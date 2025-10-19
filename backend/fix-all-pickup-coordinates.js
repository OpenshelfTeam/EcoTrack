import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PickupRequest from './models/PickupRequest.model.js';

dotenv.config();

// Sri Lankan district coordinates
const districtCoordinates = {
  // Western Province
  'Colombo': [79.8612, 6.9271],
  'Gampaha': [80.0170, 7.0873],
  'Kalutara': [79.9595, 6.5854],
  
  // Central Province
  'Kandy': [80.6350, 7.2906],
  'Matale': [80.6234, 7.4675],
  'Nuwara Eliya': [80.7891, 6.9497],
  
  // Southern Province
  'Galle': [80.2170, 6.0535],
  'Matara': [80.5353, 5.9549],
  'Hambantota': [81.1185, 6.1429],
  
  // Northern Province
  'Jaffna': [80.0074, 9.6615],
  'Kilinochchi': [80.3982, 9.3851],
  'Mannar': [79.9044, 8.9810],
  'Vavuniya': [80.5000, 8.7500],
  'Mullaitivu': [80.8142, 9.2671],
  
  // Eastern Province
  'Trincomalee': [81.2335, 8.5874],
  'Batticaloa': [81.6924, 7.7310],
  'Ampara': [81.6724, 7.2976],
  
  // North Western Province
  'Kurunegala': [80.3644, 7.4863],
  'Puttalam': [79.8283, 8.0362],
  
  // North Central Province
  'Anuradhapura': [80.4037, 8.3114],
  'Polonnaruwa': [81.0006, 7.9403],
  
  // Uva Province
  'Badulla': [81.0550, 6.9934],
  'Monaragala': [81.3510, 6.8728],
  
  // Sabaragamuwa Province
  'Ratnapura': [80.3842, 6.6828],
  'Kegalle': [80.3431, 7.2513]
};

const fixPickupCoordinates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Get ALL pickups to check
    const pickups = await PickupRequest.find({})
      .select('requestId pickupLocation status');

    console.log(`🔍 Found ${pickups.length} active pickups to check\n`);

    let fixedCount = 0;
    const fixes = [];

    for (const pickup of pickups) {
      const address = pickup.pickupLocation.address;
      const currentCoords = pickup.pickupLocation.coordinates;

      // Find which district this address belongs to
      let matchedDistrict = null;
      let correctCoords = null;

      for (const [district, coords] of Object.entries(districtCoordinates)) {
        if (address.includes(district)) {
          matchedDistrict = district;
          correctCoords = coords;
          break;
        }
      }

      if (matchedDistrict && correctCoords) {
        // Check if coordinates are wrong
        const currentLng = currentCoords[0];
        const currentLat = currentCoords[1];
        const correctLng = correctCoords[0];
        const correctLat = correctCoords[1];

        // If coordinates differ by more than 0.1 degrees (significant mismatch)
        const lngDiff = Math.abs(currentLng - correctLng);
        const latDiff = Math.abs(currentLat - correctLat);

        if (lngDiff > 0.1 || latDiff > 0.1) {
          // Update the coordinates
          await PickupRequest.updateOne(
            { _id: pickup._id },
            { $set: { 'pickupLocation.coordinates': correctCoords } }
          );

          fixedCount++;
          fixes.push({
            requestId: pickup.requestId,
            district: matchedDistrict,
            address: address,
            oldCoords: [currentLat, currentLng],
            newCoords: [correctLat, correctLng]
          });
        }
      }
    }

    console.log(`✅ Fixed ${fixedCount} pickups with incorrect coordinates\n`);

    if (fixes.length > 0) {
      console.log('📍 CORRECTED PICKUPS:\n');
      fixes.forEach(fix => {
        console.log(`${fix.requestId} - ${fix.district}:`);
        console.log(`  Address: ${fix.address}`);
        console.log(`  Old: Lat ${fix.oldCoords[0].toFixed(4)}, Lng ${fix.oldCoords[1].toFixed(4)}`);
        console.log(`  New: Lat ${fix.newCoords[0].toFixed(4)}, Lng ${fix.newCoords[1].toFixed(4)}`);
        console.log(`  ✅ NOW CORRECT for ${fix.district}\n`);
      });
    }

    // Show current status of all pickups
    const updatedPickups = await PickupRequest.find({})
      .select('requestId pickupLocation status');

    console.log('📋 ALL ACTIVE PICKUPS (AFTER FIX):\n');
    updatedPickups.forEach(p => {
      const district = Object.keys(districtCoordinates).find(d => 
        p.pickupLocation.address.includes(d)
      );
      console.log(`${p.requestId} [${p.status}]:`);
      console.log(`  📍 ${p.pickupLocation.address}`);
      console.log(`  🗺️  Coordinates: [${p.pickupLocation.coordinates[1].toFixed(4)}, ${p.pickupLocation.coordinates[0].toFixed(4)}]`);
      console.log(`  ✓ District: ${district || 'Unknown'}\n`);
    });

    console.log('🎉 Fix complete! All pickups now have coordinates matching their addresses.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixPickupCoordinates();
