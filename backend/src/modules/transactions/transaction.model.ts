import mongoose, {
  Document,
  Schema,
} from "mongoose";

import {
  ITransaction,
  TransactionType,
  TransactionStatus,
} from "./transaction.types";

export interface ITransactionDocument
  extends Omit<
    ITransaction,
    "userId" | "processedBy" | "requestId"
  >,
    Document {
  userId: mongoose.Types.ObjectId;

  processedBy?: mongoose.Types.ObjectId;

  requestId?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema =
  new Schema<ITransactionDocument>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      type: {
        type: String,
        enum: [
          "deposit",
          "withdrawal",
          "deposit_reversal",
          "withdrawal_reversal",
          "game_entry",
          "game_entry_reversal",
          "game_win",
        ] satisfies TransactionType[],
        required: true,
        index: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      balanceBefore: {
        type: Number,
        required: true,
        min: 0,
      },

      balanceAfter: {
        type: Number,
        required: true,
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
        enum: [
          "completed",
          "reversed",
        ] satisfies TransactionStatus[],
        required: true,
      },

      reference: {
        type: String,
        trim: true,
        index: true,
      },

      requestId: {
        type: Schema.Types.ObjectId,
        index: true,
      },

      processedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      description: {
        type: String,
        trim: true,
        maxlength: 500,
      },
    },
    {
      timestamps: true,
    }
  );

transactionSchema.index({
  userId: 1,
  createdAt: -1,
});



export const Transaction =
  mongoose.model<ITransactionDocument>(
    "Transaction",
    transactionSchema
  );