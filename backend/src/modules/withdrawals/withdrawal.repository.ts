import mongoose from "mongoose";

import { Withdrawal } from "./withdrawal.model";
import {
  WithdrawalPaymentMethod,
} from "./withdrawal.types";

interface CreateWithdrawalData {
  playerId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: WithdrawalPaymentMethod;
  accountNumber: string;
  note?: string;
}

export const createWithdrawal = async (
  data: CreateWithdrawalData,
  session?: mongoose.ClientSession
) => {
  const withdrawals = await Withdrawal.create(
    [
      {
        ...data,
        status: "pending",
      },
    ],
    { session }
  );

  return withdrawals[0];
};

export const findPlayerWithdrawals = async (
  playerId: string
) => {
  return Withdrawal.find({
    playerId,
  }).sort({
    createdAt: -1,
  });
};

export const findAgentPendingWithdrawals = async (
  agentId: string
) => {
  return Withdrawal.find({
    agentId,
    status: "pending",
  })
    .populate(
      "playerId",
      "fullName phone email avatar"
    )
    .sort({
      createdAt: -1,
    });
};

export const findWithdrawalById = async (
  withdrawalId: string
) => {
  return Withdrawal.findById(withdrawalId);
};