import mongoose from 'mongoose';
import SmartBin from './models/SmartBin.model.js';
import User from './models/User.model.js';

// Update existing bins to have createdBy field
mongoose.connect('mongodb://localhost:27017/ecotrack').then(async () => {
  try {
    console.log('🔄 Migrating existing bins to add createdBy field...\n');

    // Get a default resident user to assign as creator
    const resident = await User.findOne({ role: 'resident' });
    
    if (!resident) {
      console.log('❌ No resident user found. Please create a resident user first.');
      process.exit(1);
    }

    console.log(`✅ Found resident: ${resident.firstName} ${resident.lastName} (${resident.email})`);

    // Update all bins that don't have createdBy
    const result = await SmartBin.updateMany(
      { createdBy: { $exists: false } },
      { $set: { createdBy: resident._id } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} bins with createdBy field`);

    // Verify
    const totalBins = await SmartBin.countDocuments();
    const binsWithCreator = await SmartBin.countDocuments({ createdBy: { $exists: true } });

    console.log(`\n📊 Status:`);
    console.log(`   Total bins: ${totalBins}`);
    console.log(`   Bins with creator: ${binsWithCreator}`);
    console.log(`   Bins without creator: ${totalBins - binsWithCreator}`);

    if (totalBins === binsWithCreator) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Some bins still missing createdBy field');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});
