import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deceit';
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000, // Timeout fast if offline local Mongo is not active
    });
    console.log(`[DB] Connected to local MongoDB: ${mongoURI}`);
  } catch (err) {
    console.warn(`[DB] Could not connect to local MongoDB (${mongoURI}). Running with in-memory state only.`);
  }
}
