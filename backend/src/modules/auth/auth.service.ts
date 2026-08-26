import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUserWallet } from "../wallet/wallet.service";
import { PLAYER_AVATARS, generateRandomAvatar } from "../../utils/avatar";
import {
  createAuthUser,
  findFirstActiveAgent,
  findUserByPhone,
  findUserByPhoneWithPassword,
  findUsedPlayerAvatars,
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
    expiresIn: "48h",
  });
};

export const registerPlayer = async (
  data: RegisterInput
) => {
  const existingUser = await findUserByPhone(
    data.phone
  );

  if (existingUser) {
    throw new Error(
      "Phone number is already registered"
    );
  }
/* ======================================
   DEFAULT AGENT
====================================== */

const defaultAgent =
  await findFirstActiveAgent();

if (!defaultAgent) {
  throw new Error(
    "No active agent is available"
  );
}

const referredBy =
  defaultAgent._id;

  const hashedPassword =
    await bcrypt.hash(
      data.password,
      12
    );

  const usedAvatars =
  await findUsedPlayerAvatars();

const availableAvatars =
  PLAYER_AVATARS.filter(
    (avatar) =>
      !usedAvatars.includes(avatar)
  );

const avatar =
  availableAvatars.length > 0
    ? availableAvatars[
        Math.floor(
          Math.random() *
            availableAvatars.length
        )
      ]
    : generateRandomAvatar();

  const user = await createAuthUser({
    phone: data.phone.trim(),
    password: hashedPassword,

    role: "player",

    status: "active",

    referredBy,

    isVerified: false,

    avatar,
  });

  await createUserWallet(
    user._id.toString()
  );

  return {
    userId: user._id,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
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
      phone: user.phone,
      role: user.role,
    },
  };
};