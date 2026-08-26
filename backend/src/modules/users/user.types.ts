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

export interface AgentPaymentSettings {
  telebirr: {
    enabled: boolean;
    account: string;
  };

  cbe: {
    enabled: boolean;
    account: string;
  };

  minDeposit: number;
  maxDeposit: number;
}

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

  paymentSettings?: AgentPaymentSettings;

  isVerified: boolean;

  avatar?: string;
  fcmToken?: string | null;
  lastLogin?: Date;
  
}