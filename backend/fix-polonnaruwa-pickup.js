import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PickupRequest from './models/PickupRequest.model.js';

dotenv.config();

const fixPolonnaruwaPickup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Polonnaruwa coordinates (not Colombo!)
    const polonnaruwaCoords = [81.0006, 7.9403]; // [lng, lat]

    // Update PKP00017 which has Kaduruwela, Polonnaruwa address but wrong coordinates
    const result = await PickupRequest.updateOne(
      { 
        requestId: 'PKP00017',
        'pickupLocation.address': { $regex: 'Polonnaruwa', $options: 'i' }
      },
      { 
        $set: { 'pickupLocation.coordinates': polonnaruwaCoords } 
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Fixed PKP00017 (Kaduruwela, Polonnaruwa)');
      console.log(`   Old: Colombo coordinates [79.8612, 6.9271]`);
      console.log(`   New: Polonnaruwa coordinates [${polonnaruwaCoords[0]}, ${polonnaruwaCoords[1]}]`);
      console.log(`   → Lat: ${polonnaruwaCoords[1]}, Lng: ${polonnaruwaCoords[0]}\n`);
    } else {
      console.log('❌ No pickup found to update\n');
    }

    // Verify the fix
    const pickup = await PickupRequest.findOne({ requestId: 'PKP00017' });
    if (pickup) {
      console.log('📍 Verified PKP00017:');
      console.log(`   Address: ${pickup.pickupLocation.address}`);
      console.log(`   Coordinates: [${pickup.pickupLocation.coordinates}]`);
      console.log(`   ✓ Now shows in North Central Province (Polonnaruwa District)\n`);
    }

    console.log('🎉 Fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixPolonnaruwaPickup();
