import mongoose from "mongoose";
import { Deposit } from "./deposit.model";
import { PaymentMethod } from "./deposit.types";

interface CreateDepositData {
  playerId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  note?: string;
}

export const createDeposit = async (
  data: CreateDepositData,
  session?: mongoose.ClientSession
) => {
  const deposits = await Deposit.create(
    [
      {
        ...data,
        status: "pending",
      },
    ],
    { session }
  );

  return deposits[0];
};

export const findDepositById = async (
  depositId: string
) => {
  return Deposit.findById(depositId);
};

export const findPlayerDeposits = async (
  playerId: string
) => {
  return Deposit.find({
    playerId,
  }).sort({
    createdAt: -1,
  });
};

export const findAgentPendingDeposits = async (
  agentId: string
) => {
  return Deposit.find({
    agentId,
    status: "pending",
  })
    .populate(
      "playerId",
      "phone avatar"
    )
    .sort({
      createdAt: 1,
    });
};

export const findDepositByReference = async (
  reference: string
) => {
  return Deposit.findOne({
    reference: reference.trim(),
  });
};