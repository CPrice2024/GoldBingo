import mongoose from "mongoose";

import { Deposit } from "./deposit.model";
import { Wallet } from "../wallet/wallet.model";
import { Transaction } from "../transactions/transaction.model";
import { User } from "../users/user.model";

import {
  createDeposit,
  findPlayerDeposits,
  findAgentPendingDeposits,
  findDepositById,
} from "./deposit.repository";

import {
  sendNotificationToUser,
} from "../notifications/notification.service";

import {
  PaymentMethod,
} from "./deposit.types";

interface CreateDepositInput {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  note?: string;
}

export const submitDeposit = async (
  playerId: string,
  data: CreateDepositInput
) => {
  if (data.amount <= 0) {
    throw new Error(
      "Deposit amount must be greater than zero"
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

  const deposit = await createDeposit({
  playerId: new mongoose.Types.ObjectId(playerId),
  agentId: agent._id,
  amount: data.amount,
  paymentMethod: data.paymentMethod,
  reference: data.reference,
  note: data.note,
});

// Send a private push notification to this player's assigned agent.
try {
  await sendNotificationToUser(
    agent._id.toString(),
    "New Deposit Request",
    `${player.fullName} requested a deposit of ${data.amount} ETB.`,
    {
      type: "deposit_request",
      depositId: deposit._id.toString(),
      playerId: player._id.toString(),
      agentId: agent._id.toString(),
      amount: data.amount.toString(),
    }
  );
} catch (notificationError) {
  // Notification failure must NOT cancel the deposit request.
  console.error(
    "Failed to send deposit push notification:",
    notificationError
  );
}

return deposit;

};

export const getPlayerDeposits = async (
  playerId: string
) => {
  return findPlayerDeposits(playerId);
};

export const getAgentPendingDeposits = async (
  agentId: string
) => {
  return findAgentPendingDeposits(agentId);
};

export const getDeposit = async (
  depositId: string
) => {
  const deposit = await findDepositById(
    depositId
  );

  if (!deposit) {
    throw new Error(
      "Deposit request not found"
    );
  }

  return deposit;
};

export const approveDeposit = async (
  depositId: string,
  agentId: string
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Find ONLY a pending deposit
    // belonging to this agent.
    const deposit =
      await Deposit.findOne({
        _id: depositId,
        agentId,
        status: "pending",
      }).session(session);

    if (!deposit) {
      throw new Error(
        "Pending deposit not found or not assigned to this agent"
      );
    }

    // 2. Find player's active wallet.
    const wallet =
      await Wallet.findOne({
        userId: deposit.playerId,
        status: "active",
      }).session(session);

    if (!wallet) {
      throw new Error(
        "Player wallet not found or inactive"
      );
    }

    // 3. Calculate new balance.
    const balanceBefore = wallet.balance;

    const balanceAfter =
      balanceBefore + deposit.amount;

    // 4. Update wallet.
    wallet.balance = balanceAfter;

    await wallet.save({
      session,
    });

    // 5. Mark deposit as approved.
    deposit.status = "approved";

    deposit.processedBy =
      new mongoose.Types.ObjectId(agentId);

    deposit.processedAt = new Date();

    await deposit.save({
      session,
    });

    // 6. Create transaction ledger entry.
    await Transaction.create(
      [
        {
          userId: deposit.playerId,

          type: "deposit",

          amount: deposit.amount,

          balanceBefore,

          balanceAfter,

          currency: "ETB",

          status: "completed",

          reference: deposit.reference,

          requestId: deposit._id,

          processedBy:
            new mongoose.Types.ObjectId(agentId),

          description:
            "Deposit approved by agent",
        },
      ],
      {
        session,
      }
    );

    await session.commitTransaction();

// Send notification AFTER the transaction succeeds.
// FCM failure must not undo the approved deposit.
try {
  await sendNotificationToUser(
    deposit.playerId.toString(),
    "Deposit Approved",
    `Your deposit of ${deposit.amount} ETB has been approved.`,
    {
      type: "deposit_approved",
      depositId: deposit._id.toString(),
      amount: deposit.amount.toString(),
      agentId: agentId.toString(),
    }
  );
} catch (notificationError) {
  console.error(
    "Failed to send deposit approval notification:",
    notificationError
  );
}

return {
  deposit,
  balanceBefore,
  balanceAfter,
};
  } catch (error) {
    // If ANY operation fails,
    // undo everything.
    await session.abortTransaction();

    throw error;
  } finally {
    await session.endSession();
  }
};