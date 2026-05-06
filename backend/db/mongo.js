import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
}

// Cache connection for serverless reuse
let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Do NOT call process.exit() in serverless — it kills the entire function
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    throw error; // Let the caller handle it
  }
};
