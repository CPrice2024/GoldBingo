import mongoose, { Document, Schema } from "mongoose";
import {
  IUser,
  UserRole,
  UserStatus,
} from "./user.types";

export interface IUserDocument
  extends Omit<IUser, "referredBy">,
    Document {
  referredBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "agent", "player"] satisfies UserRole[],
      default: "player",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "active",
        "pending",
        "suspended",
        "blocked",
      ] satisfies UserStatus[],
      default: "active",
      required: true,
      index: true,
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    agentId: {
  type: Schema.Types.ObjectId,
  ref: "User",
  default: null,
  index: true,
},

paymentSettings: {
  telebirr: {
    enabled: {
      type: Boolean,
      default: true,
    },

    account: {
      type: String,
      trim: true,
      default: "",
    },
  },

  cbe: {
    enabled: {
      type: Boolean,
      default: true,
    },

    account: {
      type: String,
      trim: true,
      default: "",
    },
  },

  minDeposit: {
    type: Number,
    required: false,
    min: 0,
    default: 10,
  },

  maxDeposit: {
    type: Number,
    required: false,
    min: 0,
    default: 10000,
  },
},

    isVerified: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
      default: null,
    },

    fcmToken: {
  type: String,
  default: null,
  trim: true,
},

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUserDocument>(
  "User",
  userSchema
);