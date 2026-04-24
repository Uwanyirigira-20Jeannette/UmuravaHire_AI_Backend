import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined in environment variables');

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cache = global._mongooseCache ?? (global._mongooseCache = { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  // Return existing live connection
  if (cache.conn) return cache.conn;

  // Start a new connection attempt if none is in flight
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands:          false,
      serverSelectionTimeoutMS: 10000, // fail fast – don't hang for 30 s
      connectTimeoutMS:         10000,
      socketTimeoutMS:          45000,
      maxPoolSize:              10,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    // Reset so the next request gets a fresh attempt
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}
