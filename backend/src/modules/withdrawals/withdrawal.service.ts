import mongoose from "mongoose";

import { Withdrawal } from "./withdrawal.model";
import { Wallet } from "../wallet/wallet.model";
import { Transaction } from "../transactions/transaction.model";
import { User } from "../users/user.model";

import {
  createWithdrawal,
  findPlayerWithdrawals,
  findAgentPendingWithdrawals,
  findWithdrawalById,
} from "./withdrawal.repository";
import {
  sendNotificationToUser,
} from "../notifications/notification.service";
import {
  WithdrawalPaymentMethod,
} from "./withdrawal.types";

interface CreateWithdrawalInput {
  amount: number;
  paymentMethod: WithdrawalPaymentMethod;
  accountNumber: string;
  note?: string;
}

export const submitWithdrawal = async (
  playerId: string,
  data: CreateWithdrawalInput
) => {
  if (data.amount <= 0) {
    throw new Error(
      "Withdrawal amount must be greater than zero"
    );
  }

  const player = await User.findOne({
    _id: playerId,
    role: "player",
    status: "active",
  });

  if (!player) {
    throw new Error("Player not found");
  }

  if (!player.referredBy) {
    throw new Error(
      "Player is not assigned to an agent"
    );
  }

  const agent = await User.findOne({
    _id: player.referredBy,
    role: "agent",
    status: "active",
  });

  if (!agent) {
    throw new Error(
      "Player's assigned agent is not available"
    );
  }

  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const wallet =
      await Wallet.findOneAndUpdate(
        {
          userId: player._id,
          status: "active",

          $expr: {
            $gte: [
              {
                $subtract: [
                  "$balance",
                  "$reservedBalance",
                ],
              },
              data.amount,
            ],
          },
        },
        {
          $inc: {
            reservedBalance: data.amount,
          },
        },
        {
          new: true,
          session,
        }
      );

    if (!wallet) {
      throw new Error(
        "Insufficient available balance"
      );
    }

    const withdrawal =
      await createWithdrawal(
        {
          playerId: player._id,
          agentId: agent._id,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          accountNumber: data.accountNumber,
          note: data.note,
        },
        session
      );

   await session.commitTransaction();

// Notify the assigned agent after the withdrawal is committed.
try {
  await sendNotificationToUser(
    agent._id.toString(),
    "New Withdrawal Request",
    `A player requested a withdrawal of ${data.amount} ETB.`,
    {
      type: "withdrawal_created",
      withdrawalId: withdrawal._id.toString(),
      playerId: player._id.toString(),
      amount: data.amount.toString(),
      paymentMethod: data.paymentMethod,
    }
  );
} catch (notificationError) {
  console.error(
    "Failed to send withdrawal notification to agent:",
    notificationError
  );
}

return {
  withdrawal,
  balance: wallet.balance,
  reservedBalance:
    wallet.reservedBalance,
  availableBalance:
    wallet.balance -
    wallet.reservedBalance,
};
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const getPlayerWithdrawals = async (
  playerId: string
) => {
  return findPlayerWithdrawals(playerId);
};

export const getAgentPendingWithdrawals = async (
  agentId: string
) => {
  return findAgentPendingWithdrawals(agentId);
};

export const getWithdrawal = async (
  withdrawalId: string
) => {
  const withdrawal =
    await findWithdrawalById(
      withdrawalId
    );

  if (!withdrawal) {
    throw new Error(
      "Withdrawal request not found"
    );
  }

  return withdrawal;
};

/*
 * Agent approves withdrawal.
 *
 * Reserved money becomes permanently deducted
 * from the wallet.
 */
export const approveWithdrawal = async (
  withdrawalId: string,
  agentId: string
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const withdrawal =
      await Withdrawal.findOne({
        _id: withdrawalId,
        agentId,
        status: "pending",
      }).session(session);

    if (!withdrawal) {
      throw new Error(
        "Pending withdrawal not found or not assigned to this agent"
      );
    }

    const wallet =
      await Wallet.findOne({
        userId: withdrawal.playerId,
        status: "active",
      }).session(session);

    if (!wallet) {
      throw new Error(
        "Player wallet not found or inactive"
      );
    }

    if (
      wallet.reservedBalance <
      withdrawal.amount
    ) {
      throw new Error(
        "Reserved wallet balance is insufficient"
      );
    }

    const balanceBefore =
      wallet.balance;

    const balanceAfter =
      balanceBefore -
      withdrawal.amount;

    wallet.balance = balanceAfter;

    wallet.reservedBalance =
      wallet.reservedBalance -
      withdrawal.amount;

    await wallet.save({ session });

    withdrawal.status = "approved";

    withdrawal.processedBy =
      new mongoose.Types.ObjectId(
        agentId
      );

    withdrawal.processedAt =
      new Date();

    await withdrawal.save({
      session,
    });

    await Transaction.create(
      [
        {
          userId: withdrawal.playerId,

          type: "withdrawal",

          amount: withdrawal.amount,

          balanceBefore,

          balanceAfter,

          currency: "ETB",

          status: "completed",

          requestId:
            withdrawal._id,

          processedBy:
            new mongoose.Types.ObjectId(
              agentId
            ),

          description:
            "Withdrawal approved by agent",
        },
      ],
      {
        session,
      }
    );

   await session.commitTransaction();

// Notify the player after the withdrawal is committed.
try {
  await sendNotificationToUser(
    withdrawal.playerId.toString(),
    "Withdrawal Approved",
    `Your withdrawal of ${withdrawal.amount} ETB has been approved.`,
    {
      type: "withdrawal_approved",
      withdrawalId: withdrawal._id.toString(),
      amount: withdrawal.amount.toString(),
      paymentMethod: withdrawal.paymentMethod,
    }
  );
} catch (notificationError) {
  console.error(
    "Failed to send withdrawal approval notification:",
    notificationError
  );
}

return {
  withdrawal,
  balanceBefore,
  balanceAfter,
  reservedBalance:
    wallet.reservedBalance,
  availableBalance:
    wallet.balance -
    wallet.reservedBalance,
};
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/*
 * Agent rejects withdrawal.
 *
 * No money is deducted.
 * Reserved money is released.
 */
export const rejectWithdrawal = async (
  withdrawalId: string,
  agentId: string,
  rejectionReason?: string
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const withdrawal =
      await Withdrawal.findOne({
        _id: withdrawalId,
        agentId,
        status: "pending",
      }).session(session);

    if (!withdrawal) {
      throw new Error(
        "Pending withdrawal not found or not assigned to this agent"
      );
    }

    const wallet =
      await Wallet.findOne({
        userId: withdrawal.playerId,
        status: "active",
      }).session(session);

    if (!wallet) {
      throw new Error(
        "Player wallet not found or inactive"
      );
    }

    if (
      wallet.reservedBalance <
      withdrawal.amount
    ) {
      throw new Error(
        "Reserved wallet balance is insufficient"
      );
    }

    wallet.reservedBalance =
      wallet.reservedBalance -
      withdrawal.amount;

    await wallet.save({ session });

    withdrawal.status = "rejected";

    withdrawal.rejectionReason =
      rejectionReason?.trim() ||
      "Withdrawal rejected by agent";

    withdrawal.processedBy =
      new mongoose.Types.ObjectId(
        agentId
      );

    withdrawal.processedAt =
      new Date();

    await withdrawal.save({
      session,
    });

    await session.commitTransaction();

// Notify the player after the withdrawal is committed.
try {
  await sendNotificationToUser(
    withdrawal.playerId.toString(),
    "Withdrawal Rejected",
    `Your withdrawal of ${withdrawal.amount} ETB was rejected.`,
    {
      type: "withdrawal_rejected",
      withdrawalId: withdrawal._id.toString(),
      amount: withdrawal.amount.toString(),
      reason:
        withdrawal.rejectionReason ||
        "Withdrawal rejected by agent",
    }
  );
} catch (notificationError) {
  console.error(
    "Failed to send withdrawal rejection notification:",
    notificationError
  );
}

return {
  withdrawal,
  balance: wallet.balance,
  reservedBalance:
    wallet.reservedBalance,
  availableBalance:
    wallet.balance -
    wallet.reservedBalance,
};

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};