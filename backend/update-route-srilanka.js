import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Route from './models/Route.model.js';
import SmartBin from './models/SmartBin.model.js';
import User from './models/User.model.js';

dotenv.config();

const updateRouteWithSriLankanBins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the Downtown Route
    const route = await Route.findOne({ routeCode: 'RT001' });
    if (!route) {
      console.log('❌ Route RT001 not found');
      return;
    }

    console.log(`\n📋 Found route: ${route.routeName}`);

    // Get Sri Lankan bins (let's use some from Colombo city center)
    const bins = await SmartBin.find({
      binId: { 
        $in: [
          'BIN004', // Fort Railway Station, Colombo 01 (100% full)
          'BIN005', // Pettah Market Area, Colombo 11 (95% full)
          'BIN006', // Galle Road, Kollupitiya, Colombo 03 (85% full)
          'BIN007', // Slave Island, Colombo 02 (70% full)
          'BIN008'  // Union Place, Colombo 02 (65% full)
        ]
      }
    }).select('_id binId location binType currentLevel');

    console.log(`\n🗑️  Found ${bins.length} Sri Lankan bins`);
    bins.forEach(bin => {
      console.log(`  - ${bin.binId}: ${bin.location.address}`);
      console.log(`    Coords: [${bin.location.coordinates.join(', ')}]`);
      console.log(`    ${bin.currentLevel}% full`);
    });

    // Update route with new bins
    route.bins = bins.map(b => b._id);
    route.totalBins = bins.length;
    route.area = 'Colombo City';
    route.routeName = 'Colombo City Route';
    route.notes = 'Collection route covering Fort, Pettah, and Kollupitiya areas';
    
    await route.save();

    console.log('\n✅ Route updated successfully!');
    console.log(`   Route: ${route.routeName}`);
    console.log(`   Area: ${route.area}`);
    console.log(`   Bins: ${route.totalBins}`);
    console.log(`   Status: ${route.status}`);

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateRouteWithSriLankanBins();
