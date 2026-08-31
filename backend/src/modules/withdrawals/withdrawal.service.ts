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

  paymentMethod:
    WithdrawalPaymentMethod;

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

  if (
  data.paymentMethod !== "telebirr" &&
  data.paymentMethod !== "cbe"
) {
  throw new Error(
  "Only Telebirr and CBE Birr withdrawals are supported"
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
  /* =========================
   PLAYER ACCOUNT PHONE
========================= */

const playerPhone =
  String(
    player.phone || ""
  ).trim();


if (!playerPhone) {
  throw new Error(
    "Player account does not have a registered phone number"
  );
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
              "$winningBalance",
              "$reservedWinningBalance",
            ],
          },
          data.amount,
        ],
      },
    },
    {
      $inc: {
        reservedWinningBalance:
          data.amount,
      },
    },
    {
      new: true,
      session,
    }
  );

    if (!wallet) {
  throw new Error(
    "Insufficient withdrawable winnings"
  );
}

    const withdrawal =
      await createWithdrawal(
        {
          playerId: player._id,
          agentId: agent._id,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          accountNumber:playerPhone,
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

  winningBalance:
    wallet.winningBalance,

  reservedWinningBalance:
    wallet.reservedWinningBalance,

  withdrawableWinningBalance:
    Math.max(
      0,
      wallet.winningBalance -
        wallet.reservedWinningBalance
    ),
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
  wallet.reservedWinningBalance <
  withdrawal.amount
) {
  throw new Error(
    "Reserved winning balance is insufficient"
  );
}

  const winningBalanceBefore =
  wallet.winningBalance;

const winningBalanceAfter =
  winningBalanceBefore -
  withdrawal.amount;

wallet.winningBalance =
  winningBalanceAfter;

wallet.reservedWinningBalance =
  wallet.reservedWinningBalance -
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
      userId:
        withdrawal.playerId,

      type: "withdrawal",

      amount:
        withdrawal.amount,

      balanceBefore:
        winningBalanceBefore,

      balanceAfter:
        winningBalanceAfter,

      currency: "ETB",

      status: "completed",

      requestId:
        withdrawal._id,

      processedBy:
        new mongoose.Types.ObjectId(
          agentId
        ),

      description:
        "Withdrawal approved from winning balance",
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

  winningBalanceBefore,

  winningBalanceAfter,

  winningBalance:
    wallet.winningBalance,

  reservedWinningBalance:
    wallet.reservedWinningBalance,

  withdrawableWinningBalance:
    Math.max(
      0,
      wallet.winningBalance -
        wallet.reservedWinningBalance
    ),
};
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const rejectWithdrawal = async (
  withdrawalId: string,
  agentId: string,
  rejectionReason?: string
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    /* =====================================
       1. FIND PENDING WITHDRAWAL
    ====================================== */

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


    /* =====================================
       2. RELEASE RESERVED WINNING BALANCE
    ====================================== */

    const wallet =
      await Wallet.findOneAndUpdate(
        {
          userId:
            withdrawal.playerId,

          status:
            "active",

          reservedWinningBalance: {
            $gte:
              withdrawal.amount,
          },
        },

        {
          $inc: {
            reservedWinningBalance:
              -withdrawal.amount,
          },
        },

        {
          new: true,
          session,
        }
      );


    if (!wallet) {
      throw new Error(
        "Unable to release reserved winning balance"
      );
    }


    /* =====================================
       3. MARK WITHDRAWAL REJECTED
    ====================================== */

    withdrawal.status =
      "rejected";

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


    /* =====================================
       4. COMMIT
    ====================================== */

    await session.commitTransaction();


    /* =====================================
       5. NOTIFY PLAYER
    ====================================== */

    try {
      await sendNotificationToUser(
        withdrawal.playerId.toString(),

        "Withdrawal Rejected",

        `Your withdrawal of ${withdrawal.amount} ETB was rejected. The amount has been returned to your withdrawable winnings.`,

        {
          type:
            "withdrawal_rejected",

          withdrawalId:
            withdrawal._id.toString(),

          amount:
            withdrawal.amount.toString(),

          paymentMethod:
            withdrawal.paymentMethod,
        }
      );

    } catch (
      notificationError
    ) {

      console.error(
        "Failed to send withdrawal rejection notification:",
        notificationError
      );

    }


    return {
      withdrawal,

      winningBalance:
        wallet.winningBalance,

      reservedWinningBalance:
        wallet.reservedWinningBalance,

      withdrawableWinningBalance:
        Math.max(
          0,
          wallet.winningBalance -
            wallet.reservedWinningBalance
        ),
    };

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    await session.endSession();

  }
};