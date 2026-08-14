import mongoose from "mongoose";

export type UserRole =
  | "admin"
  | "agent"
  | "player";

export type UserStatus =
  | "active"
  | "pending"
  | "suspended"
  | "blocked";

export interface IUser {
  fullName: string;
  phone: string;
  email?: string;
  password: string;

  role: UserRole;
  status: UserStatus;

  referralCode?: string;

  referredBy?: mongoose.Types.ObjectId;

  agentId?: mongoose.Types.ObjectId;

  isVerified: boolean;

  avatar?: string;
  fcmToken?: string | null;
  lastLogin?: Date;
}