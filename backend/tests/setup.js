import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

// Setup before all tests
export const setupTestDB = async () => {
  try {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    
    console.log('✓ Test database connected');
  } catch (error) {
    console.error('Error connecting to test database:', error);
    throw error;
  }
};

// Cleanup after all tests
export const teardownTestDB = async () => {
  try {
    // Disconnect from the database
    await mongoose.disconnect();
    
    // Stop the in-memory MongoDB server
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('✓ Test database disconnected');
  } catch (error) {
    console.error('Error disconnecting from test database:', error);
    throw error;
  }
};

// Clear all collections between tests
export const clearDatabase = async () => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};
