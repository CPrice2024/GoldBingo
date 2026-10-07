require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.DATABASE_URL;

    await mongoose.connect(uri);

    const db = mongoose.connection.db;
    const col = db.collection("paymentsms");

    const start = new Date("2026-10-07T07:45:00.000Z");
    const end   = new Date("2026-10-07T08:20:00.000Z");

    const rows = await col
      .find({
        createdAt: {
          $gte: start,
          $lte: end
        }
      })
      .sort({
        createdAt: 1
      })
      .toArray();

    console.log(
      "\n===== SMS AROUND TRANSACTION TIME ====="
    );

    console.log(
      "COUNT =",
      rows.length
    );

    for (const sms of rows) {
      console.log("\n--------------------");

      console.log({
        _id: sms._id,
        agentId: sms.agentId,
        from: sms.from,
        paymentMethod: sms.paymentMethod,
        reference: sms.reference,
        amount: sms.amount,
        status: sms.status,
        error: sms.error,
        createdAt: sms.createdAt,
        sentStamp: sms.sentStamp,
        receivedStamp: sms.receivedStamp
      });

      console.log(
        "TEXT =",
        sms.text
      );
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
