import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SmartBin from './models/SmartBin.model.js';
import User from './models/User.model.js';
import connectDB from './config/db.js';

dotenv.config();

const seedBins = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Find an operator or admin user to use as createdBy
    let createdByUser = await User.findOne({ role: { $in: ['operator', 'admin'] } });
    
    if (!createdByUser) {
      console.log('⚠️  No operator or admin user found. Creating a system admin...');
      // Create a system admin for bin creation
      createdByUser = await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: 'system@ecotrack.com',
        password: 'System@123', // This will be hashed by the model
        phone: '0000000000',
        role: 'admin',
        address: {
          street: 'System',
          city: 'Colombo',
          province: 'Western',
          postalCode: '00000',
          coordinates: [79.8612, 6.9271]
        }
      });
      console.log('✅ System admin created');
    }
    
    console.log(`Using user ${createdByUser.email} (${createdByUser.role}) as bin creator`);

    // Sample bins for each type
    const bins = [
      // General waste bins
      {
        binId: 'GEN-001',
        binType: 'general',
        capacity: 120,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8612, 6.9271], // Colombo
          address: 'Warehouse A, Industrial Zone, Colombo'
        }
      },
      {
        binId: 'GEN-002',
        binType: 'general',
        capacity: 120,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8613, 6.9272],
          address: 'Warehouse A, Industrial Zone, Colombo'
        }
      },
      {
        binId: 'GEN-003',
        binType: 'general',
        capacity: 120,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8614, 6.9273],
          address: 'Warehouse A, Industrial Zone, Colombo'
        }
      },
      
      // Recyclable bins
      {
        binId: 'REC-001',
        binType: 'recyclable',
        capacity: 120,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8615, 6.9274],
          address: 'Warehouse B, Industrial Zone, Colombo'
        }
      },
      {
        binId: 'REC-002',
        binType: 'recyclable',
        capacity: 120,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8616, 6.9275],
          address: 'Warehouse B, Industrial Zone, Colombo'
        }
      },
      {
        binId: 'REC-003',
        binType: 'recyclable',
        capacity: 120,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8617, 6.9276],
          address: 'Warehouse B, Industrial Zone, Colombo'
        }
      },
      
      // Organic bins
      {
        binId: 'ORG-001',
        binType: 'organic',
        capacity: 100,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8618, 6.9277],
          address: 'Warehouse C, Industrial Zone, Colombo'
        }
      },
      {
        binId: 'ORG-002',
        binType: 'organic',
        capacity: 100,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8619, 6.9278],
          address: 'Warehouse C, Industrial Zone, Colombo'
        }
      },
      {
        binId: 'ORG-003',
        binType: 'organic',
        capacity: 100,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8620, 6.9279],
          address: 'Warehouse C, Industrial Zone, Colombo'
        }
      },
      
      // Hazardous bins
      {
        binId: 'HAZ-001',
        binType: 'hazardous',
        capacity: 80,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8621, 6.9280],
          address: 'Hazardous Waste Facility, Colombo'
        }
      },
      {
        binId: 'HAZ-002',
        binType: 'hazardous',
        capacity: 80,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8622, 6.9281],
          address: 'Hazardous Waste Facility, Colombo'
        }
      },
      {
        binId: 'HAZ-003',
        binType: 'hazardous',
        capacity: 80,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8623, 6.9282],
          address: 'Hazardous Waste Facility, Colombo'
        }
      },
      {
        binId: 'HAZ-004',
        binType: 'hazardous',
        capacity: 80,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8624, 6.9283],
          address: 'Hazardous Waste Facility, Colombo'
        }
      },
      {
        binId: 'HAZ-005',
        binType: 'hazardous',
        capacity: 80,
        currentLevel: 0,
        status: 'available',
        createdBy: createdByUser._id,
        location: {
          type: 'Point',
          coordinates: [79.8625, 6.9284],
          address: 'Hazardous Waste Facility, Colombo'
        }
      }
    ];

    // Check if bins already exist
    const existingBins = await SmartBin.countDocuments();
    
    if (existingBins > 0) {
      console.log(`Database already has ${existingBins} bins.`);
      const answer = 'yes'; // Auto-proceed for script execution
      
      if (answer.toLowerCase() === 'yes') {
        console.log('Adding more bins to existing inventory...');
      } else {
        console.log('Seed cancelled.');
        process.exit(0);
      }
    }

    // Insert bins
    const createdBins = await SmartBin.insertMany(bins);
    console.log(`✅ Successfully seeded ${createdBins.length} smart bins!`);
    
    // Show summary
    const summary = await SmartBin.aggregate([
      {
        $group: {
          _id: '$binType',
          count: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
          }
        }
      }
    ]);
    
    console.log('\n📊 Bin Inventory Summary:');
    summary.forEach(item => {
      console.log(`   ${item._id}: ${item.count} total (${item.available} available)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding bins:', error);
    process.exit(1);
  }
};

seedBins();
