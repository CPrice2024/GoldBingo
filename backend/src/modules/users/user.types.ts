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

export type TrustedDevicePlatform =
  | "web"
  | "android";

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

export interface ITrustedDevice {
  deviceId: string;

  deviceCredentialHash: string;

  platform: TrustedDevicePlatform;

  fcmToken: string;

  createdAt: Date;

  lastSeenAt: Date;
}

export interface IUser {
  fullName: string;

  phone: string;

  email?: string;

  password: string;

  role: UserRole;

  status: UserStatus;

  referralCode?: string;

  referredBy?:
    mongoose.Types.ObjectId;

  agentId?:
    mongoose.Types.ObjectId;

  paymentSettings?:
    AgentPaymentSettings;

  isVerified: boolean;

  avatar?: string;

  /*
   * Keep this during migration.
   * Existing notifications still use it.
   */
  fcmToken?: string | null;

  /*
   * New persistent device system.
   */
  trustedDevices?:
    ITrustedDevice[];

  lastLogin?: Date;
}