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

    const start =
      new Date("2026-10-07T00:00:00.000Z");

    const end =
      new Date("2026-10-08T00:00:00.000Z");

    const rows = await col
      .find({
        createdAt: {
          $gte: start,
          $lt: end
        }
      })
      .sort({
        createdAt: 1
      })
      .toArray();

    console.log(
      "\n===== POSSIBLE 11 ETB SMS ====="
    );

    for (const sms of rows) {
      const text =
        String(sms.text || "");

      if (
        sms.amount === 11 ||
        /11(?:\.00)?\s*(?:ETB|BIRR|\u1265\u122d)/i.test(text) ||
        /(?:ETB|BIRR)\s*11(?:\.00)?/i.test(text)
      ) {
        console.log("\n--------------------");

        console.log({
          _id: sms._id,
          agentId: sms.agentId,
          from: sms.from,
          paymentMethod:
            sms.paymentMethod,
          reference:
            sms.reference,
          amount:
            sms.amount,
          status:
            sms.status,
          error:
            sms.error,
          createdAt:
            sms.createdAt,
          sentStamp:
            sms.sentStamp,
          receivedStamp:
            sms.receivedStamp
        });

        console.log(
          "TEXT =",
          sms.text
        );
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
