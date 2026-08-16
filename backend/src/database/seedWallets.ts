import dotenv from "dotenv";

dotenv.config();

import mongoose from "mongoose";

import { User } from "../modules/users/user.model";
import { Wallet } from "../modules/wallet/wallet.model";

const seedWallets = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");
    console.log("Database:", mongoose.connection.db?.databaseName);

    const users = await User.find({});

    let created = 0;
    let existing = 0;

    for (const user of users) {
      const wallet = await Wallet.findOne({
        userId: user._id,
      });

      if (wallet) {
        existing++;
        continue;
      }

      await Wallet.create({
        userId: user._id,
        balance: 0,
        reservedBalance: 0,
        currency: "ETB",
        status: "active",
      });

      created++;

      console.log(
        `Wallet created for ${user.fullName} (${user.role})`
      );
    }

    console.log("--------------------------------");
    console.log(`Wallets created: ${created}`);
    console.log(`Wallets already existing: ${existing}`);
    console.log("--------------------------------");
  } catch (error) {
    console.error("Failed to seed wallets:", error);
  } finally {
    await mongoose.disconnect();
  }
};

seedWallets();