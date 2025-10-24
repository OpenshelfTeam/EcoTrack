import User from '../models/User.model.js';
import { generateToken } from '../middleware/auth.middleware.js';
import mongoose from 'mongoose';

// Test user data generators
export const testUserData = {
  resident: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.resident@test.com',
    password: 'Test123456',
    phone: '+1234567890',
    role: 'resident',
    address: {
      street: '123 Main St',
      city: 'TestCity',
      state: 'TS',
      zipCode: '12345',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    }
  },
  collector: {
    firstName: 'Jane',
    lastName: 'Collector',
    email: 'jane.collector@test.com',
    password: 'Test123456',
    phone: '+1234567891',
    role: 'collector'
  },
  operator: {
    firstName: 'Bob',
    lastName: 'Operator',
    email: 'bob.operator@test.com',
    password: 'Test123456',
    phone: '+1234567892',
    role: 'operator'
  },
  admin: {
    firstName: 'Alice',
    lastName: 'Admin',
    email: 'alice.admin@test.com',
    password: 'Test123456',
    phone: '+1234567893',
    role: 'admin'
  },
  authority: {
    firstName: 'Tom',
    lastName: 'Authority',
    email: 'tom.authority@test.com',
    password: 'Test123456',
    phone: '+1234567894',
    role: 'authority'
  }
};

// Create test users
export async function createTestUser(roleOrData) {
  let userData;
  
  // If string role passed, get predefined user data
  if (typeof roleOrData === 'string') {
    userData = { ...testUserData[roleOrData] };
    // Make email unique to avoid duplicates
    userData.email = generateUniqueEmail(roleOrData);
  } else {
    userData = roleOrData;
  }
  
  const user = await User.create(userData);
  const token = generateToken(user._id);
  return { user, token };
}

// Create multiple test users
export async function createTestUsers() {
  const resident = await createTestUser(testUserData.resident);
  const collector = await createTestUser(testUserData.collector);
  const operator = await createTestUser(testUserData.operator);
  const admin = await createTestUser(testUserData.admin);
  const authority = await createTestUser(testUserData.authority);

  return { resident, collector, operator, admin, authority };
}

// Generate unique email for tests
export function generateUniqueEmail(prefix = 'test') {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).substring(7)}@test.com`;
}

// Test bin request data
export const testBinRequestData = {
  valid: {
    requestedBinType: 'recycling',
    preferredDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    notes: 'Please deliver in the morning',
    address: '123 Test Street, Test City',
    street: '123 Test Street',
    city: 'Test City',
    province: 'Test Province',
    postalCode: '12345',
    coordinates: {
      lat: 40.7128,
      lng: -74.0060
    }
  },
  invalidCoordinates: {
    requestedBinType: 'compost',
    coordinates: {
      lat: 200, // Invalid latitude
      lng: -74.0060
    }
  },
  missingRequired: {
    notes: 'Missing required fields'
  }
};

// Test delivery data
export const testDeliveryData = {
  valid: {
    scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  }
};

// Test smart bin data
export const testSmartBinData = {
  valid: {
    binId: 'BIN-TEST-001',
    binType: 'recycling',
    location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128] // [longitude, latitude]
    },
    capacity: 100,
    currentFillLevel: 0,
    status: 'active',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345'
    }
  }
};

// Test coordinates (common locations)
export const testCoordinates = {
  colombo: [79.8612, 6.9271],      // Colombo, Sri Lanka
  newYork: [-74.0060, 40.7128],    // New York
  london: [-0.1278, 51.5074],      // London
  tokyo: [139.6917, 35.6895]       // Tokyo
};

// Test route data
export const testRouteData = {
  valid: {
    startLocation: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128]
    },
    endLocation: {
      type: 'Point',
      coordinates: [-73.9352, 40.7306]
    },
    status: 'active'
  }
};

// Test pickup request data
export const testPickupRequestData = {
  valid: {
    requestType: 'scheduled',
    preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    urgency: 'normal',
    notes: 'Regular pickup',
    location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128]
    }
  }
};

// Cleanup helper
export async function cleanupTestData() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

// Generate test coordinate
export function generateTestCoordinate() {
  return {
    lat: 40.7128 + (Math.random() - 0.5) * 0.1,
    lng: -74.0060 + (Math.random() - 0.5) * 0.1
  };
}

// Generate test GeoJSON point
export function generateTestGeoPoint() {
  return {
    type: 'Point',
    coordinates: [-74.0060 + (Math.random() - 0.5) * 0.1, 40.7128 + (Math.random() - 0.5) * 0.1]
  };
}
