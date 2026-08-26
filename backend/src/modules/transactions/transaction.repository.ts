import mongoose from "mongoose";
import { Transaction } from "./transaction.model";
import {
  TransactionType,
  TransactionStatus,
} from "./transaction.types";

interface CreateTransactionData {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: "ETB";
  status: TransactionStatus;
  reference?: string;
  requestId?: mongoose.Types.ObjectId;
  processedBy?: mongoose.Types.ObjectId;
  description?: string;
}

export const createTransaction = async (
  data: CreateTransactionData,
  session?: mongoose.ClientSession
) => {
  const transactions = await Transaction.create(
    [data],
    { session }
  );

  return transactions[0];
};


// =========================
// PLAYER
// =========================

export const findUserTransactions = async (
  userId: string
) => {
  return Transaction.find({
    userId,
  }).sort({
    createdAt: -1,
  });
};


// =========================
// ADMIN
// =========================

export const findAllTransactions = async () => {
  return Transaction.find()
    .populate(
      "userId",
      "phone role"
    )
    .populate(
      "processedBy",
      "phone role"
    )
    .sort({
      createdAt: -1,
    });
};