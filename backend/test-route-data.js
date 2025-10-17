import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Route from './models/Route.model.js';
import SmartBin from './models/SmartBin.model.js';
import User from './models/User.model.js';

dotenv.config();

const testRouteData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all routes
    const routes = await Route.find()
      .populate('assignedCollector', 'firstName lastName email')
      .populate('bins', 'binId location currentLevel binType status');

    console.log('\n📋 ROUTES DATA:');
    console.log('================');
    
    for (const route of routes) {
      console.log(`\nRoute: ${route.routeName} (${route.routeCode})`);
      console.log(`Status: ${route.status}`);
      console.log(`Area: ${route.area}`);
      console.log(`Scheduled: ${route.scheduledDate?.toLocaleDateString()}`);
      console.log(`Time: ${route.scheduledTime?.start} - ${route.scheduledTime?.end}`);
      console.log(`Assigned to: ${route.assignedCollector?.firstName} ${route.assignedCollector?.lastName}`);
      console.log(`Total Bins: ${route.totalBins}`);
      console.log(`Collected Bins: ${route.collectedBins || 0}`);
      console.log(`Bins Array Length: ${route.bins?.length || 0}`);
      
      if (route.bins && route.bins.length > 0) {
        console.log('\nBins Details:');
        route.bins.forEach((bin, index) => {
          console.log(`  ${index + 1}. ${bin.binId} - ${bin.binType}`);
          console.log(`     Location: ${bin.location?.address || 'N/A'}`);
          console.log(`     Level: ${bin.currentLevel}%`);
          console.log(`     Status: ${bin.status}`);
        });
      } else {
        console.log('⚠️  No bins assigned to this route!');
      }
    }

    // Get all bins
    const bins = await SmartBin.find().select('binId location binType currentLevel status');
    console.log(`\n\n🗑️  TOTAL BINS IN DATABASE: ${bins.length}`);
    
    if (bins.length > 0) {
      console.log('\nFirst 5 bins:');
      bins.slice(0, 5).forEach((bin, index) => {
        console.log(`  ${index + 1}. ${bin.binId} - ${bin.binType} (${bin.currentLevel}%)`);
        console.log(`     Location: ${bin.location?.address || 'N/A'}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testRouteData();
