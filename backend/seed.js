import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';
import SmartBin from './models/SmartBin.model.js';
import Route from './models/Route.model.js';
import Ticket from './models/Ticket.model.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await SmartBin.deleteMany({});
    await Route.deleteMany({});
    await Ticket.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users for each role
    const users = await User.create([
      {
        firstName: 'John',
        lastName: 'Resident',
        email: 'resident@test.com',
        password: 'password123',
        phone: '+1234567890',
        role: 'resident',
        address: {
          street: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
        },
      },
      {
        firstName: 'Mike',
        lastName: 'Collector',
        email: 'collector@test.com',
        password: 'password123',
        phone: '+1234567891',
        role: 'collector',
      },
      {
        firstName: 'Sarah',
        lastName: 'Authority',
        email: 'authority@test.com',
        password: 'password123',
        phone: '+1234567892',
        role: 'authority',
      },
      {
        firstName: 'Tom',
        lastName: 'Operator',
        email: 'operator@test.com',
        password: 'password123',
        phone: '+1234567893',
        role: 'operator',
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'password123',
        phone: '+1234567894',
        role: 'admin',
      },
    ]);

    console.log('✅ Created test users');
    console.log('📧 Login credentials:');
    users.forEach(user => {
      console.log(`   ${user.role}: ${user.email} / password123`);
    });

    // Create smart bins
    const bins = await SmartBin.create([
      {
        binId: 'BIN001',
        qrCode: 'QR001',
        rfidTag: 'RFID001',
        assignedTo: users[0]._id, // Assign to resident
        location: {
          type: 'Point',
          coordinates: [-89.6501, 39.7817],
          address: '123 Main St, Springfield, IL',
        },
        capacity: 100,
        currentLevel: 45,
        binType: 'general',
        status: 'active',
      },
      {
        binId: 'BIN002',
        qrCode: 'QR002',
        rfidTag: 'RFID002',
        assignedTo: users[0]._id,
        location: {
          type: 'Point',
          coordinates: [-89.6502, 39.7818],
          address: '123 Main St, Springfield, IL',
        },
        capacity: 100,
        currentLevel: 75,
        binType: 'recyclable',
        status: 'active',
      },
      {
        binId: 'BIN003',
        qrCode: 'QR003',
        rfidTag: 'RFID003',
        location: {
          type: 'Point',
          coordinates: [-89.6503, 39.7819],
          address: '456 Oak Ave, Springfield, IL',
        },
        capacity: 100,
        currentLevel: 20,
        binType: 'general',
        status: 'available',
      },
      {
        binId: 'BIN004',
        qrCode: 'QR004',
        rfidTag: 'RFID004',
        location: {
          type: 'Point',
          coordinates: [-89.6504, 39.7820],
          address: 'Warehouse, Springfield, IL',
        },
        capacity: 100,
        currentLevel: 0,
        binType: 'recyclable',
        status: 'available',
      },
      {
        binId: 'BIN005',
        qrCode: 'QR005',
        rfidTag: 'RFID005',
        location: {
          type: 'Point',
          coordinates: [-89.6505, 39.7821],
          address: 'Warehouse, Springfield, IL',
        },
        capacity: 100,
        currentLevel: 0,
        binType: 'organic',
        status: 'available',
      },
      {
        binId: 'BIN006',
        qrCode: 'QR006',
        rfidTag: 'RFID006',
        location: {
          type: 'Point',
          coordinates: [-89.6506, 39.7822],
          address: 'Warehouse, Springfield, IL',
        },
        capacity: 100,
        currentLevel: 0,
        binType: 'hazardous',
        status: 'available',
      },
    ]);

    console.log('✅ Created smart bins');

    // Create routes
    const routes = await Route.create([
      {
        routeName: 'Downtown Route',
        routeCode: 'RT001',
        assignedCollector: users[1]._id, // Assign to collector
        area: 'Downtown Springfield',
        bins: [bins[0]._id, bins[1]._id],
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        scheduledTime: {
          start: '09:00',
          end: '12:00',
        },
        status: 'pending',
        priority: 'medium',
        totalBins: 2,
      },
    ]);

    console.log('✅ Created routes');

    // Create sample tickets (manually set ticket numbers since we cleared the collection)
    const ticket1 = new Ticket({
      ticketNumber: 'TKT000001',
      title: 'Damaged bin needs replacement',
      description: 'My recycling bin has a crack on the side and cannot hold waste properly.',
      category: 'bin',
      priority: 'high',
      status: 'open',
      reporter: users[0]._id,
      relatedBin: bins[0]._id,
    });
    await ticket1.save({ validateBeforeSave: false });

    const ticket2 = new Ticket({
      ticketNumber: 'TKT000002',
      title: 'Missed pickup last week',
      description: 'The waste collection was scheduled but the team did not show up.',
      category: 'collection',
      priority: 'medium',
      status: 'in-progress',
      reporter: users[0]._id,
      assignedTo: users[2]._id,
    });
    await ticket2.save({ validateBeforeSave: false });

    console.log('✅ Created sample tickets');

    // Create sample payments for residents
    const payments = await Payment.create([
      {
        user: users[0]._id, // Resident
        amount: 50,
        currency: 'USD',
        paymentType: 'installation-fee',
        paymentMethod: 'credit-card',
        status: 'completed',
        paymentDetails: {
          cardLastFour: '4242',
          cardType: 'Visa',
          paymentGateway: 'Stripe'
        },
        invoice: {
          invoiceDate: new Date(),
          paidDate: new Date()
        },
        description: 'Smart bin installation fee'
      }
    ]);

    console.log('✅ Created sample payments');

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📝 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Bins: ${bins.length}`);
    console.log(`   Routes: ${routes.length}`);
    console.log(`   Tickets: ${tickets.length}`);
    console.log(`   Payments: ${payments.length}`);
    console.log('\n🚀 You can now login with any of the test accounts!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();
