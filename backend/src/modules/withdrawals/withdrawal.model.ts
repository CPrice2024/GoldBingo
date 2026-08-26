import mongoose, {
  Document,
  Schema,
} from "mongoose";

import {
  IWithdrawal,
  WithdrawalPaymentMethod,
  WithdrawalStatus,
} from "./withdrawal.types";

export interface IWithdrawalDocument
  extends Omit<
    IWithdrawal,
    "playerId" | "agentId" | "processedBy"
  >,
  Document {
  playerId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  processedBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentMethod: {
      type: String,
      enum: [
        "telebirr",
        "cbe",
      ] satisfies WithdrawalPaymentMethod[],
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ] satisfies WithdrawalStatus[],
      default: "pending",
      required: true,
      index: true,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    processedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

withdrawalSchema.index({
  agentId: 1,
  status: 1,
  createdAt: -1,
});

withdrawalSchema.index({
  playerId: 1,
  createdAt: -1,
});

export const Withdrawal =
  mongoose.model<IWithdrawalDocument>(
    "Withdrawal",
    withdrawalSchema
  );