import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('smartbins');

    console.log('🔍 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    // Drop the problematic indexes
    try {
      await collection.dropIndex('qrCode_1');
      console.log('✅ Dropped qrCode_1 index');
    } catch (error) {
      console.log('⚠️  qrCode_1 index does not exist or already dropped');
    }

    try {
      await collection.dropIndex('rfidTag_1');
      console.log('✅ Dropped rfidTag_1 index');
    } catch (error) {
      console.log('⚠️  rfidTag_1 index does not exist or already dropped');
    }

    // Create new sparse indexes
    await collection.createIndex({ qrCode: 1 }, { unique: true, sparse: true });
    console.log('✅ Created sparse qrCode index');

    await collection.createIndex({ rfidTag: 1 }, { unique: true, sparse: true });
    console.log('✅ Created sparse rfidTag index');

    console.log('\n🎉 Indexes fixed successfully!');
    console.log('\n📝 New indexes:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n🚀 You can now create bins without qrCode/rfidTag!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  }
};

fixIndexes();
