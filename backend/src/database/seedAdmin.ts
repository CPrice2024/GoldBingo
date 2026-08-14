import dotenv from "dotenv";
import { createUserWallet } from "../modules/wallet/wallet.service";
dotenv.config();

import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { User } from "../modules/users/user.model";

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      console.log("An admin already exists.");
      return;
    }

    const password = "Admin@123456";

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      fullName: "BingoHub Administrator",
      phone: "0900000000",
      password: hashedPassword,
      role: "admin",
      status: "active",
      isVerified: true,
    });

    await createUserWallet(admin._id.toString());

    console.log("=================================");
    console.log("Admin created successfully");
    console.log("=================================");
    console.log("ID:", admin._id.toString());
    console.log("Phone:", admin.phone);
    console.log("Password:", password);
    console.log("=================================");
  } catch (error) {
    console.error("Failed to seed admin:", error);
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();