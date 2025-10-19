import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import config from './config';
import WhopClient, { Product, Membership } from './whopClient';
import connectToDatabase, { checkDatabaseHealth, getConnectionStatus } from './db';
import ProductModel from './models/Product';
import MembershipModel from './models/Membership';
import cors from 'cors';

const app = express();
const whopClient = new WhopClient();

// Memory monitoring and management
const logMemoryUsage = () => {
  const used = process.memoryUsage();
  const rssMB = Math.round(used.rss / 1024 / 1024);
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  
  console.log(`[Memory] RSS: ${rssMB}MB, Heap: ${heapUsedMB}MB / ${heapTotalMB}MB`);
  
  // Force garbage collection if memory usage is high (lower threshold for Render)
  if (heapUsedMB > 150 && global.gc) {
    console.log('[Memory] High memory usage detected, forcing garbage collection...');
    global.gc();
  }
};

// Log memory usage every 2 minutes (less frequent for production)
setInterval(logMemoryUsage, 120000);

// Conservative memory management for production
if (process.env.NODE_ENV === 'production') {
  // Force garbage collection every 5 minutes in production
  setInterval(() => {
    if (global.gc) {
      global.gc();
      console.log('[Memory] Forced garbage collection');
    }
  }, 300000);
}

// Database health monitoring
const checkDatabaseHealthPeriodically = async () => {
  const isHealthy = await checkDatabaseHealth();
  const status = getConnectionStatus();
  console.log(`[Database] Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}, Status: ${status}`);
  
  if (!isHealthy) {
    console.log('[Database] Attempting to reconnect...');
    try {
      await connectToDatabase();
    } catch (error) {
      console.error('[Database] Reconnection failed:', error);
    }
  }
};

// Check database health every 60 seconds
setInterval(checkDatabaseHealthPeriodically, 60000);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app build directory
const frontendBuildPath = path.join(__dirname, '../dist');
app.use(express.static(frontendBuildPath));

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const dbHealthy = await checkDatabaseHealth();
    const dbStatus = getConnectionStatus();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        healthy: dbHealthy,
        status: dbStatus
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      },
      uptime: process.uptime()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// API Routes
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Check database connection first
    if (!await checkDatabaseHealth()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    // Get products with pagination
    const productsDocs = await ProductModel.find()
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(10000); // 10 second timeout

    // Get active user counts efficiently using aggregation
    const activeByProduct = await MembershipModel.aggregate([
      { $match: { productId: { $exists: true, $ne: null } } }, // Only count valid productIds
      { $group: { _id: "$productId", count: { $sum: 1 } } },
      { $project: { productId: "$_id", count: 1, _id: 0 } }
    ]);

    const activeByProductMap: Record<string, number> = {};
    activeByProduct.forEach(item => {
      if (item.productId) {
        activeByProductMap[item.productId] = item.count;
      }
    });

    const products = productsDocs.map((p: any) => ({
      id: p.productId,
      title: p.title,
      visibility: p.visibility,
      activeUsers: p.activeUsers || 0,
    }));

    // Get total count for pagination
    const totalProducts = await ProductModel.countDocuments().maxTimeMS(5000); // 5 second timeout

    return res.json({ 
      products, 
      activeByProduct: activeByProductMap,
      pagination: {
        page,
        limit,
        total: totalProducts,
        pages: Math.ceil(totalProducts / limit)
      }
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/products/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Check database connection first
    if (!await checkDatabaseHealth()) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const productDoc = await ProductModel.findOne({ productId }).lean().maxTimeMS(5000);
    
    // Get memberships with pagination
    const membershipsDocs = await MembershipModel.find({ productId })
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(10000);

    const product = productDoc ? { 
      id: productDoc.productId, 
      title: productDoc.title, 
      visibility: productDoc.visibility, 
      activeUsers: productDoc.activeUsers 
    } : null;

    const memberships = membershipsDocs.map((m: any) => ({ 
      id: m.membershipId, 
      user: m.userId, 
      email: m.email 
    }));

    // Get total count for pagination
    const totalMemberships = await MembershipModel.countDocuments({ productId }).maxTimeMS(5000);

    return res.json({ 
      product, 
      memberships,
      pagination: {
        page,
        limit,
        total: totalMemberships,
        pages: Math.ceil(totalMemberships / limit)
      }
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Send DM to all memberships of a product (JSON API) - Process in batches
app.post('/api/products/:productId/message', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { message } = req.body as { message?: string };

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const BATCH_SIZE = 100; // Process 100 memberships at a time
    let skip = 0;
    let totalSuccessCount = 0;
    let totalErrorCount = 0;
    const allErrors: string[] = [];

    // Get total count first
    const totalMemberships = await MembershipModel.countDocuments({ productId }).maxTimeMS(5000);
    
    if (totalMemberships === 0) {
      return res.json({ 
        success: true, 
        successCount: 0, 
        errorCount: 0, 
        errors: [],
        message: 'No memberships found for this product'
      });
    }

    console.log(`[Server] Starting to send messages to ${totalMemberships} memberships in batches of ${BATCH_SIZE}`);

    // Process memberships in batches to avoid memory issues
    while (skip < totalMemberships) {
      const membershipsDocs = await MembershipModel.find({ productId })
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean()
        .maxTimeMS(10000);

      if (membershipsDocs.length === 0) break;

      let batchSuccessCount = 0;
      let batchErrorCount = 0;
      const batchErrors: string[] = [];

      // Process current batch
      for (const membership of membershipsDocs) {
        const userId = membership.userId;
        const membershipId = membership.membershipId;

        if (!userId) {
          batchErrorCount++;
          batchErrors.push(`Membership ${membershipId}: No user ID`);
          continue;
        }

        try {
          const result = await whopClient.sendDirectMessage(userId, message);
          if (result.success) {
            batchSuccessCount++;
          } else {
            batchErrorCount++;
            batchErrors.push(`Membership ${membershipId}: ${result.error}`);
          }
        } catch (error: any) {
          batchErrorCount++;
          batchErrors.push(`Membership ${membershipId}: ${error.message}`);
        }
      }

      totalSuccessCount += batchSuccessCount;
      totalErrorCount += batchErrorCount;
      allErrors.push(...batchErrors);

      console.log(`[Server] Batch ${Math.floor(skip / BATCH_SIZE) + 1}: ${batchSuccessCount} success, ${batchErrorCount} errors`);

      skip += BATCH_SIZE;

      // Add small delay between batches to prevent rate limiting
      if (skip < totalMemberships) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Force garbage collection every 5 batches
      if (Math.floor(skip / BATCH_SIZE) % 5 === 0) {
        if (global.gc) {
          global.gc();
        }
      }
    }

    console.log(`[Server] Message sending complete: ${totalSuccessCount} success, ${totalErrorCount} errors`);

    return res.json({ 
      success: true, 
      successCount: totalSuccessCount, 
      errorCount: totalErrorCount, 
      errors: allErrors,
      totalProcessed: totalSuccessCount + totalErrorCount
    });
  } catch (e: any) {
    console.error('[Server] Error sending DMs (API):', e);
    return res.status(500).json({ error: e.message });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: err.message });
});

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// Start server
const PORT = parseInt(process.env.PORT || config.port.toString(), 10);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, async () => {
  try {
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
  }
  console.log(`🚀 Whop API Server running on http://${HOST}:${PORT}`);
  console.log(`📊 API Products: http://${HOST}:${PORT}/api/products`);
  console.log(`🔧 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Host: ${HOST}, Port: ${PORT}`);
});
