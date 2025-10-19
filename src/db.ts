import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDatabase(uri?: string): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb+srv://ronelmendozawork01_db_user:ZalTMjRzlYjUh9ar@cluster0.bqwun9m.mongodb.net/';

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, {
  });

  isConnected = true;
  console.log('✅ Connected to MongoDB database successfully');
  return mongoose;
}

export default connectToDatabase;