import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PickupRequest from './models/PickupRequest.model.js';
import User from './models/User.model.js';

dotenv.config();

const checkPickups = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Get ALL pickups with their exact data
    const pickups = await PickupRequest.find({})
      .populate('requestedBy', 'firstName lastName email')
      .populate('assignedCollector', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log(`🔍 Found ${pickups.length} total pickups\n`);
    console.log('=' .repeat(80));

    pickups.forEach((pickup, index) => {
      console.log(`\n${index + 1}. ${pickup.requestId} [${pickup.status}]`);
      console.log('   Resident:', pickup.requestedBy?.firstName, pickup.requestedBy?.lastName);
      if (pickup.assignedCollector) {
        console.log('   Assigned to:', pickup.assignedCollector.firstName, pickup.assignedCollector.lastName);
      }
      console.log('   Address:', pickup.pickupLocation.address);
      console.log('   Coordinates:', pickup.pickupLocation.coordinates);
      console.log('   → Latitude:', pickup.pickupLocation.coordinates[1]);
      console.log('   → Longitude:', pickup.pickupLocation.coordinates[0]);
      console.log('   Waste Type:', pickup.wasteType);
      console.log('   Preferred Date:', pickup.preferredDate?.toISOString().split('T')[0]);
      console.log('   Time Slot:', pickup.timeSlot);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary by Status:');
    const statusCounts = pickups.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkPickups();
