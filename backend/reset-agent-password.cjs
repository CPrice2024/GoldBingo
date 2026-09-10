require("dotenv").config();
const mongoose = require("mongoose");

let bcrypt;
try {
  bcrypt = require("bcryptjs");
} catch {
  bcrypt = require("bcrypt");
}

async function main() {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.DATABASE_URL;

    if (!mongoUri) {
      throw new Error("MongoDB URI not found in .env");
    }

    if (!process.env.RESET_PHONE) {
      throw new Error("RESET_PHONE is missing");
    }

    if (!process.env.RESET_PASSWORD) {
      throw new Error("RESET_PASSWORD is missing");
    }

    await mongoose.connect(mongoUri);

    const db = mongoose.connection.db;

    const phone = process.env.RESET_PHONE;
    const internationalPhone = "+251" + phone.substring(1);

    console.log("Searching for agent:", phone);

    const user = await db.collection("users").findOne({
      role: "agent",
      phone: {
        $in: [phone, internationalPhone]
      }
    });

    if (!user) {
      console.log("Agent not found:", phone);
      await mongoose.disconnect();
      return;
    }

    let passwordField;

    if (Object.prototype.hasOwnProperty.call(user, "passwordHash")) {
      passwordField = "passwordHash";
    } else if (Object.prototype.hasOwnProperty.call(user, "password")) {
      passwordField = "password";
    } else {
      console.log("Password field not found.");
      console.log("Available fields:", Object.keys(user));
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(
      process.env.RESET_PASSWORD,
      12
    );

    const result = await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          [passwordField]: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    console.log("");
    console.log("PASSWORD CHANGED SUCCESSFULLY");
    console.log("Phone:", user.phone);
    console.log("Role:", user.role);
    console.log("Password field:", passwordField);
    console.log("Modified:", result.modifiedCount);

    await mongoose.disconnect();
  } catch (error) {
    console.error("ERROR:", error);
    process.exit(1);
  }
}

main();
