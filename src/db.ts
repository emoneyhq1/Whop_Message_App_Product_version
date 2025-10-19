import mongoose from 'mongoose';

let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export async function connectToDatabase(uri?: string): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // Use environment variable, never hardcode credentials
  const mongoUri = uri || process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  // Configure mongoose for production
  mongoose.set('strictQuery', false); // Allow flexible queries
  mongoose.set('bufferCommands', false); // Disable mongoose buffering

  try {
    await mongoose.connect(mongoUri, {
      // Connection options optimized for Render
      maxPoolSize: 8, // Balanced for Render's constraints
      serverSelectionTimeoutMS: 15000, // Increased timeout for Render
      socketTimeoutMS: 45000, // Balanced timeout
      maxIdleTimeMS: 10000, // Balanced connection cleanup
      connectTimeoutMS: 20000, // Increased connection timeout for Render
      retryWrites: true, // Retry write operations
      retryReads: true, // Retry read operations
      // Enable compression for better performance
      compressors: ['zlib'],
      // Additional options for Render
      bufferCommands: false // Disable mongoose buffering
    });

    isConnected = true;
    connectionAttempts = 0;
    console.log('✅ Connected to MongoDB database successfully');
    
    // Set up connection event listeners
    setupConnectionListeners();
    
    return mongoose;
  } catch (error: any) {
    connectionAttempts++;
    console.error(`❌ MongoDB connection failed (attempt ${connectionAttempts}):`, error.message);
    
    if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
      throw new Error(`Failed to connect to MongoDB after ${MAX_RECONNECT_ATTEMPTS} attempts: ${error.message}`);
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 2000 * connectionAttempts));
    return connectToDatabase(uri);
  }
}

function setupConnectionListeners() {
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
    isConnected = true;
  });

  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
    isConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
    isConnected = true;
  });

  // Handle application termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }
    
    // Ping the database
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Get connection status
export function getConnectionStatus(): string {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
}

export default connectToDatabase;