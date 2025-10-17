import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const fixTicketIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("tickets");

    // Get existing indexes
    const indexes = await collection.indexes();
    console.log("\n📋 Current indexes:");
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, index.key);
    });

    // Drop the ticketNumber index if it exists
    try {
      await collection.dropIndex("ticketNumber_1");
      console.log("\n✅ Dropped ticketNumber_1 index");
    } catch (error) {
      if (error.codeName === "IndexNotFound") {
        console.log("\n⚠️  ticketNumber_1 index not found (already removed)");
      } else {
        throw error;
      }
    }

    // Recreate the index with proper settings
    await collection.createIndex(
      { ticketNumber: 1 },
      { unique: true, sparse: true }
    );
    console.log("✅ Recreated ticketNumber index with sparse option");

    // Check for duplicate ticket numbers
    const duplicates = await collection
      .aggregate([
        { $group: { _id: "$ticketNumber", count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    if (duplicates.length > 0) {
      console.log("\n⚠️  Found duplicate ticket numbers:");
      duplicates.forEach((dup) => {
        console.log(`  - ${dup._id}: ${dup.count} tickets`);
      });
      console.log("\n💡 You may need to manually fix these duplicates");
    } else {
      console.log("\n✅ No duplicate ticket numbers found");
    }

    // Get the highest ticket number using Mongoose model
    const Ticket = mongoose.model(
      "Ticket",
      new mongoose.Schema({
        ticketNumber: String,
      })
    );

    const lastTicket = await Ticket.findOne({
      ticketNumber: { $exists: true, $ne: null },
    })
      .sort({ ticketNumber: -1 })
      .lean();

    if (lastTicket) {
      console.log(`\n📊 Highest ticket number: ${lastTicket.ticketNumber}`);
      const nextNumber =
        parseInt(lastTicket.ticketNumber.replace("TKT", "")) + 1;
      console.log(
        `📊 Next ticket will be: TKT${String(nextNumber).padStart(6, "0")}`
      );
    } else {
      console.log("\n📊 No tickets found. Next ticket will be: TKT000001");
    }

    console.log("\n✅ Index fix completed successfully!");
  } catch (error) {
    console.error("\n❌ Error fixing ticket index:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
    process.exit(0);
  }
};

fixTicketIndex();
