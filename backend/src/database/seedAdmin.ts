import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { createUserWallet } from "../modules/wallet/wallet.service";
import { User } from "../modules/users/user.model";

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    const phone = "090000001";
    const password = "Admin@1234";

    // Check specifically for this admin phone
    const existingAdmin = await User.findOne({
      phone,
    });

    if (existingAdmin) {
      console.log("An admin with this phone already exists.");
      console.log("ID:", existingAdmin._id.toString());
      console.log("Phone:", existingAdmin.phone);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      fullName: "BingoHub Administrator",
      phone,
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