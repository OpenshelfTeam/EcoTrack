import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

export async function startTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRE = '7d';
  
  // Connect mongoose
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

export async function stopTestDB() {
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function getTestApp() {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    await startTestDB();
  }
  const mod = await import('../server.js');
  return mod.default || mod;
}
