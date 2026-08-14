import mongoose from "mongoose";
import { Wallet } from "./wallet.model";

export const createWallet = async (
  userId: string
) => {
  return Wallet.create({
    userId,
    balance: 0,
    reservedBalance: 0,
    currency: "ETB",
    status: "active",
  });
};

export const findWalletByUserId = async (
  userId: string
) => {
  return Wallet.findOne({
    userId,
  });
};

export const findWalletByUserIdWithSession = async (
  userId: string,
  session: mongoose.ClientSession
) => {
  return Wallet.findOne({
    userId,
  }).session(session);
};

export const increaseWalletBalance = async (
  userId: mongoose.Types.ObjectId,
  amount: number,
  session: mongoose.ClientSession
) => {
  return Wallet.findOneAndUpdate(
    {
      userId,
      status: "active",
    },
    {
      $inc: {
        balance: amount,
      },
    },
    {
      new: true,
      session,
    }
  );
};