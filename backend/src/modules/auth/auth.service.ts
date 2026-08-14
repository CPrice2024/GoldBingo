import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUserWallet } from "../wallet/wallet.service";

import {
  createAuthUser,
  findAgentByReferralCode,
  findUserByPhone,
  findUserByPhoneWithPassword,
} from "./auth.repository";

import {
  RegisterInput,
  LoginInput,
  AuthPayload,
} from "./auth.types";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

const generateToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
  });
};

export const registerPlayer = async (
  data: RegisterInput
) => {
  const existingUser = await findUserByPhone(data.phone);

  if (existingUser) {
    throw new Error("Phone number is already registered");
  }

  let referredBy = undefined;

  if (data.referralCode) {
    const agent = await findAgentByReferralCode(
      data.referralCode
    );

    if (!agent) {
      throw new Error("Invalid referral code");
    }

    referredBy = agent._id;
  }

  const hashedPassword = await bcrypt.hash(
    data.password,
    12
  );

  const user = await createAuthUser({
    fullName: data.fullName.trim(),
    phone: data.phone.trim(),
    email: data.email?.trim(),
    password: hashedPassword,

    role: "player",

    status: "active",

    referredBy,

    isVerified: false,
  });
  await createUserWallet(user._id.toString());

  return {
    userId: user._id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
  };
};

export const login = async (data: LoginInput) => {
  const user = await findUserByPhoneWithPassword(
  data.phone
);

  if (!user) {
    throw new Error("Invalid phone number or password");
  }

  const passwordMatch = await bcrypt.compare(
    data.password,
    user.password
  );

  if (!passwordMatch) {
    throw new Error("Invalid phone number or password");
  }

  if (user.status !== "active") {
    throw new Error("Account is not active");
  }

  const payload: AuthPayload = {
    userId: user._id.toString(),
    role: user.role,
  };

  const accessToken = generateToken(payload);

  user.lastLogin = new Date();

  await user.save();

  return {
    accessToken,

    user: {
      id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    },
  };
};