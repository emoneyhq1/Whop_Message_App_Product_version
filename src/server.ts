import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import config from './config';
import WhopClient, { Product, Membership } from './whopClient';
import connectToDatabase from './db';
import ProductModel from './models/Product';
import MembershipModel from './models/Membership';
import cors from 'cors';

const app = express();
const whopClient = new WhopClient();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app build directory
const frontendBuildPath = path.join(__dirname, '../dist');
app.use(express.static(frontendBuildPath));

// API Routes
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const productsDocs = await ProductModel.find();
    const membershipsDocs = await MembershipModel.find();
    const activeByProduct: Record<string, number> = {};
    membershipsDocs.forEach((m: any) => {
      if (m.productId) {
        activeByProduct[m.productId] = (activeByProduct[m.productId] || 0) + 1;
      }
    });
    const products = productsDocs.map((p: any) => ({
      id: p.productId,
      title: p.title,
      visibility: p.visibility,
      activeUsers: p.activeUsers,
    }));
    res.json({ products, activeByProduct });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/products/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const productDoc = await ProductModel.findOne({ productId });
    const membershipsDocs = await MembershipModel.find({ productId });
    const product = productDoc ? { id: productDoc.productId, title: productDoc.title, visibility: productDoc.visibility, activeUsers: productDoc.activeUsers } : null;
    const memberships = membershipsDocs.map((m: any) => ({ id: m.membershipId, user: m.userId, email: m.email }));
    res.json({ product, memberships });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Send DM to all memberships of a product (JSON API)
app.post('/api/products/:productId/message', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { message } = req.body as { message?: string };

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const membershipsDocs = await MembershipModel.find({ productId }).lean();
    const productMemberships: Membership[] = membershipsDocs.map(m => ({
      id: m.membershipId,
      user: m.userId,
      email: m.email,
      product: m.productId,
      status: 'completed',
      valid: true,
    })) as unknown as Membership[];

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < productMemberships.length; i++) {
      const membership = productMemberships[i];
      const userId = membership.user;
      const membershipId = membership.id;

      if (!userId) {
        errorCount++;
        errors.push(`Membership ${membershipId}: No user ID`);
        continue;
      }

      const result = await whopClient.sendDirectMessage(userId, message);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        errors.push(`Membership ${membershipId}: ${result.error}`);
      }
    }

    return res.json({ success: true, successCount, errorCount, errors });
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
const PORT = config.port;
app.listen(8828, async () => {
  try {
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
  }
  console.log(`🚀 Whop API Server running on http://localhost:${PORT}`);
  console.log(`📊 API Products: http://localhost:${PORT}/api/products`);
  console.log(`🔧 Environment: ${config.nodeEnv}`);
});
