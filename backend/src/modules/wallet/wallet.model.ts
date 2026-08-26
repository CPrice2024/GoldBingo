import mongoose, { Document, Schema } from "mongoose";
import { IWallet, WalletStatus } from "./wallet.types";

export interface IWalletDocument
  extends Omit<IWallet, "userId">,
    Document {
  userId: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWalletDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    reservedBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    winningBalance: {
  type: Number,
  required: true,
  default: 0,
  min: 0,
},

reservedWinningBalance: {
  type: Number,
  required: true,
  default: 0,
  min: 0,
},

    currency: {
      type: String,
      enum: ["ETB"],
      default: "ETB",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "suspended"] satisfies WalletStatus[],
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Wallet = mongoose.model<IWalletDocument>(
  "Wallet",
  walletSchema
);