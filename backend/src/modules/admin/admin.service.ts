import crypto from "crypto";
import bcrypt from "bcrypt";

import { User } from "../users/user.model";
import { CreateAgentInput } from "./admin.types";
import { createUserWallet } from "../wallet/wallet.service";
import {
  getUserCounts,
  getGameCounts,
  findAllAgents,
  findAllPlayers,
} from "./admin.repository";

const generateReferralCode = (): string => {
  return `AGT-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
};

export const createAgent = async (
  data: CreateAgentInput
) => {
  const fullName = data.fullName.trim();
  const phone = data.phone.trim();
  const email = data.email?.trim().toLowerCase();

  // Check required fields
  if (!fullName || !phone || !data.password) {
    throw new Error(
      "Full name, phone and password are required"
    );
  }

  if (data.password.length < 6) {
    throw new Error(
      "Password must be at least 6 characters"
    );
  }

  // Check phone
  const existingPhone = await User.findOne({
    phone,
  });

  if (existingPhone) {
    throw new Error(
      "A user with this phone number already exists"
    );
  }

  // Check email if provided
  if (email) {
    const existingEmail = await User.findOne({
      email,
    });

    if (existingEmail) {
      throw new Error(
        "A user with this email already exists"
      );
    }
  }

  // Generate unique referral code
  let referralCode = generateReferralCode();

  while (
    await User.exists({
      referralCode,
    })
  ) {
    referralCode = generateReferralCode();
  }

  // Hash password
  const hashedPassword =
    await bcrypt.hash(
      data.password,
      12
    );

  // Create agent
  const agent = await User.create({
    fullName,
    phone,
    email,

    password: hashedPassword,

    role: "agent",
    status: "active",

    referralCode,

    isVerified: true,
  });

  // Create wallet
  await createUserWallet(
    agent._id.toString()
  );

  return {
    id: agent._id,
    fullName: agent.fullName,
    phone: agent.phone,
    email: agent.email,
    role: agent.role,
    referralCode: agent.referralCode,
    status: agent.status,
    createdAt: agent.createdAt,
  };
};
export const getAdminDashboardStats = async () => {
  const [userCounts, gameCounts] =
    await Promise.all([
      getUserCounts(),
      getGameCounts(),
    ]);

  return {
    ...userCounts,
    ...gameCounts,
  };
};
export const getAllAgents = async () => {
  return findAllAgents();
};

export const getAllPlayers = async () => {
  return findAllPlayers();
};

export const getAdminProfile = async (
  adminId: string
) => {
  const admin = await User.findOne({
    _id: adminId,
    role: "admin",
  }).select("-password");

  if (!admin) {
    throw new Error("Admin account not found");
  }

  return admin;
};


interface UpdateAdminProfileInput {
  fullName?: string;
  email?: string;
  phone?: string;
}


export const updateAdminProfile = async (
  adminId: string,
  data: UpdateAdminProfileInput
) => {
  const admin = await User.findOne({
    _id: adminId,
    role: "admin",
  });

  if (!admin) {
    throw new Error("Admin account not found");
  }


  if (data.fullName !== undefined) {
    const fullName = data.fullName.trim();

    if (fullName.length < 2) {
      throw new Error(
        "Full name must be at least 2 characters"
      );
    }

    admin.fullName = fullName;
  }


  if (data.phone !== undefined) {
    const phone = data.phone.trim();

    if (!phone) {
      throw new Error("Phone number cannot be empty");
    }

    const existingPhone = await User.findOne({
      phone,
      _id: { $ne: adminId },
    });

    if (existingPhone) {
      throw new Error(
        "A user with this phone number already exists"
      );
    }

    admin.phone = phone;
  }


  if (data.email !== undefined) {
    const email = data.email
      .trim()
      .toLowerCase();

    if (email) {
      const existingEmail = await User.findOne({
        email,
        _id: { $ne: adminId },
      });

      if (existingEmail) {
        throw new Error(
          "A user with this email already exists"
        );
      }

      admin.email = email;
    } else {
      admin.email = undefined;
    }
  }


  await admin.save();

  return {
    id: admin._id,
    fullName: admin.fullName,
    phone: admin.phone,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    isVerified: admin.isVerified,
    avatar: admin.avatar,
    lastLogin: admin.lastLogin,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
};