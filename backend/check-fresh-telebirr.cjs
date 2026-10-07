require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.DATABASE_URL;

    if (!uri) {
      throw new Error("MongoDB connection string not found in .env");
    }

    await mongoose.connect(uri);

    const db = mongoose.connection.db;
    const col = db.collection("paymentsms");

    const reference = "DJ77II4WNH";

    const exact = await col.findOne({
      reference
    });

    console.log("\n===== EXACT SMS =====");
    console.log(exact ? {
      _id: exact._id,
      agentId: exact.agentId,
      reference: exact.reference,
      paymentMethod: exact.paymentMethod,
      amount: exact.amount,
      status: exact.status,
      error: exact.error,
      createdAt: exact.createdAt,
      sentStamp: exact.sentStamp,
      receivedStamp: exact.receivedStamp
    } : "NOT FOUND");

    const recent = await col
      .find({
        paymentMethod: "telebirr"
      })
      .sort({
        createdAt: -1
      })
      .limit(5)
      .toArray();

    console.log("\n===== RECENT TELEBIRR SMS =====");

    for (const sms of recent) {
      console.log({
        _id: sms._id,
        agentId: sms.agentId,
        reference: sms.reference,
        amount: sms.amount,
        status: sms.status,
        error: sms.error,
        createdAt: sms.createdAt
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
