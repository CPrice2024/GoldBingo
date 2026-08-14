import mongoose, {
  Document,
  Schema,
} from "mongoose";

import {
  IDeposit,
  DepositStatus,
  PaymentMethod,
} from "./deposit.types";

export interface IDepositDocument
  extends Omit<
    IDeposit,
    "playerId" | "agentId" | "processedBy"
  >,
    Document {
  playerId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;

  processedBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const depositSchema =
  new Schema<IDepositDocument>(
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
        min: 1,
      },

      paymentMethod: {
        type: String,
        enum: [
          "telebirr",
          "cbe",
          "mpesa",
          "bank",
        ] satisfies PaymentMethod[],
        required: true,
      },

      reference: {
        type: String,
        trim: true,
        maxlength: 100,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
        ] satisfies DepositStatus[],
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
    },
    {
      timestamps: true,
    }
  );

depositSchema.index({
  agentId: 1,
  status: 1,
  createdAt: -1,
});

depositSchema.index({
  playerId: 1,
  createdAt: -1,
});

export const Deposit =
  mongoose.model<IDepositDocument>(
    "Deposit",
    depositSchema
  );