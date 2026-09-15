require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI ||
      process.env.MONGODB_URI
    );

    const db = mongoose.connection.db;

    const result = await db
      .collection("users")
      .updateOne(
        {
          _id: new mongoose.Types.ObjectId(
            "6a76c6a790c242760aaa3caa"
          ),
          role: "agent"
        },
        {
          $set: {
            fullName: "Teda"
          }
        }
      );

    console.log("Matched:", result.matchedCount);
    console.log("Modified:", result.modifiedCount);

    const agent = await db
      .collection("users")
      .findOne(
        {
          _id: new mongoose.Types.ObjectId(
            "6a76c6a790c242760aaa3caa"
          )
        },
        {
          projection: {
            fullName: 1,
            name: 1,
            phone: 1,
            status: 1,
            referralCode: 1
          }
        }
      );

    console.log("\nUPDATED AGENT:");
    console.log(agent);

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
})();
