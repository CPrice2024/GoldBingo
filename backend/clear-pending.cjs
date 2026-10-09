require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;

  if (!uri) {
    throw new Error(
      "MongoDB URI not found. Expected MONGO_URI, MONGODB_URI, or DATABASE_URL in .env"
    );
  }

  await mongoose.connect(uri);

  console.log("Connected to MongoDB");
  console.log("Database:", mongoose.connection.db.databaseName);

  const collections = await mongoose.connection.db
    .listCollections({}, { nameOnly: true })
    .toArray();

  const names = collections.map((c) => c.name);

  if (!names.includes("deposits")) {
    console.log("Could not find deposits collection.");
    console.log(
      "Possible matches:",
      names.filter((n) => n.toLowerCase().includes("deposit"))
    );
    await mongoose.disconnect();
    return;
  }

  if (!names.includes("withdrawals")) {
    console.log("Could not find withdrawals collection.");
    console.log(
      "Possible matches:",
      names.filter((n) => n.toLowerCase().includes("withdraw"))
    );
    await mongoose.disconnect();
    return;
  }

  const deposits = mongoose.connection.db.collection("deposits");
  const withdrawals = mongoose.connection.db.collection("withdrawals");

  const pendingDeposits = await deposits.countDocuments({
    status: "pending",
  });

  const pendingWithdrawals = await withdrawals.countDocuments({
    status: "pending",
  });

  console.log("Pending deposits found:", pendingDeposits);
  console.log("Pending withdrawals found:", pendingWithdrawals);

  const depositResult = await deposits.deleteMany({
    status: "pending",
  });

  const withdrawalResult = await withdrawals.deleteMany({
    status: "pending",
  });

  console.log("");
  console.log("CLEANUP COMPLETE");
  console.log("Pending deposits deleted:", depositResult.deletedCount);
  console.log("Pending withdrawals deleted:", withdrawalResult.deletedCount);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("ERROR:", err.message);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
