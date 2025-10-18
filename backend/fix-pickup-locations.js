import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PickupRequest from './models/PickupRequest.model.js';

dotenv.config();

const fixPickupLocations = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Update all pickup requests to have Colombo-area coordinates
    // This ensures collectors see nearby locations, not far-away addresses

    const result = await PickupRequest.updateMany(
      {}, // Update all pickups
      {
        $set: {
          'pickupLocation.coordinates': [79.8612, 6.9271], // Colombo Fort area [lng, lat]
          'pickupLocation.address': '123 Main St, Apt 4B, Colombo 1, Sri Lanka'
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} pickup requests`);
    console.log('📍 All pickups now point to: 123 Main St, Apt 4B, Colombo 1');
    console.log('🗺️  Coordinates: 6.9271, 79.8612 (Colombo Fort area)');

    // Show updated pickups
    const pickups = await PickupRequest.find({})
      .select('requestId pickupLocation.address pickupLocation.coordinates status')
      .limit(10);

    console.log('\n📋 Updated Pickups:');
    pickups.forEach(pickup => {
      console.log(`   ${pickup.requestId}: ${pickup.pickupLocation.address}`);
      console.log(`      📍 Coordinates: [${pickup.pickupLocation.coordinates[0]}, ${pickup.pickupLocation.coordinates[1]}]`);
      console.log(`      Status: ${pickup.status}`);
    });

    console.log('\n✅ Location fix complete!');
    console.log('🔄 Refresh the collector\'s Routes page to see updated locations');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing pickup locations:', error);
    process.exit(1);
  }
};

fixPickupLocations();
