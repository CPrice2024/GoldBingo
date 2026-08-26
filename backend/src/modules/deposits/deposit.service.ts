import mongoose from "mongoose";

import { Deposit } from "./deposit.model";
import { Wallet } from "../wallet/wallet.model";
import { Transaction } from "../transactions/transaction.model";
import { User } from "../users/user.model";
import {
  AppSettings,
} from "../settings/appSettings.model";
import {
  createDeposit,
  findPlayerDeposits,
  findAgentPendingDeposits,
  findDepositById,
  findDepositByReference,
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

  // ------------------------------------------
  // AGENT PAYMENT SETTINGS
  // ------------------------------------------

  const paymentSettings =
    agent.paymentSettings;

  if (!paymentSettings) {
    throw new Error(
      "Agent payment settings are not configured"
    );
  }

  // ------------------------------------------
  // PAYMENT METHOD VALIDATION
  // ------------------------------------------

  if (data.paymentMethod === "telebirr") {
    if (!paymentSettings.telebirr?.enabled) {
      throw new Error(
        "Telebirr deposits are currently unavailable"
      );
    }

    if (
      !paymentSettings.telebirr?.account?.trim()
    ) {
      throw new Error(
        "Telebirr payment account is not configured"
      );
    }
  }

  if (data.paymentMethod === "cbe") {
    if (!paymentSettings.cbe?.enabled) {
      throw new Error(
        "CBE deposits are currently unavailable"
      );
    }

    if (
      !paymentSettings.cbe?.account?.trim()
    ) {
      throw new Error(
        "CBE payment account is not configured"
      );
    }
  }

  // ------------------------------------------
  // DEPOSIT LIMIT VALIDATION
  // ------------------------------------------

  const minDeposit = Number(
    paymentSettings.minDeposit ?? 10
  );

  const maxDeposit = Number(
    paymentSettings.maxDeposit ?? 10000
  );

  if (minDeposit <= 0) {
    throw new Error(
      "Agent minimum deposit must be greater than zero"
    );
  }

  if (maxDeposit <= 0) {
    throw new Error(
      "Agent maximum deposit must be greater than zero"
    );
  }

  if (minDeposit >= maxDeposit) {
    throw new Error(
      "Agent deposit limits are invalid"
    );
  }

  if (data.amount < minDeposit) {
    throw new Error(
      `Minimum deposit amount is ${minDeposit} ETB`
    );
  }

  if (data.amount > maxDeposit) {
    throw new Error(
      `Maximum deposit amount is ${maxDeposit} ETB`
    );
  }

 // ------------------------------------------
// DUPLICATE TRANSACTION ID CHECK
// ------------------------------------------

const reference =
  data.reference?.trim();

if (reference) {
  const existingDeposit =
    await findDepositByReference(reference);

  if (existingDeposit) {
    throw new Error(
      "This transaction ID has already been used"
    );
  }
}

// ------------------------------------------
// CREATE DEPOSIT
// ------------------------------------------

const deposit = await createDeposit({
    playerId:
      new mongoose.Types.ObjectId(playerId),

    agentId: agent._id,

    amount: data.amount,

    paymentMethod:
      data.paymentMethod,

    reference,

    note: data.note,
  });

  // ------------------------------------------
  // NOTIFY AGENT
  // ------------------------------------------

  try {
    await sendNotificationToUser(
      agent._id.toString(),
      "New Deposit Request",
      `${player.fullName} requested a deposit of ${data.amount} ETB.`,
      {
        type: "deposit_request",
        depositId:
          deposit._id.toString(),
        playerId:
          player._id.toString(),
        agentId:
          agent._id.toString(),
        amount:
          data.amount.toString(),
      }
    );
  } catch (notificationError) {
    // Notification failure must NOT cancel
    // the deposit request.
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

export const getPlayerPaymentSettings = async (
  playerId: string
) => {
  const player = await User.findOne({
    _id: playerId,
    role: "player",
    status: "active",
  }).select("referredBy");

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
  }).select("paymentSettings");

  if (!agent) {
    throw new Error(
      "Player's assigned agent is not available"
    );
  }

  const settings =
    agent.paymentSettings;

  if (!settings) {
    throw new Error(
      "Agent payment settings are not configured"
    );
  }

  return {
    telebirr:
      settings.telebirr?.enabled &&
      settings.telebirr.account?.trim()
        ? settings.telebirr.account
        : null,

    cbe:
      settings.cbe?.enabled &&
      settings.cbe.account?.trim()
        ? settings.cbe.account
        : null,

    minDeposit:
      settings.minDeposit ?? 10,

    maxDeposit:
      settings.maxDeposit ?? 10000,
  };
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

    /* =========================================
       1. FIND PENDING DEPOSIT
    ========================================= */

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


    /* =========================================
       2. FIND PLAYER WALLET
    ========================================= */

    const wallet =
      await Wallet.findOne({
        userId:
          deposit.playerId,

        status:
          "active",
      }).session(session);

    if (!wallet) {
      throw new Error(
        "Player wallet not found or inactive"
      );
    }


    /* =========================================
       3. LOAD GLOBAL DEPOSIT BONUS
    ========================================= */

    const appSettings =
      await AppSettings.findOne({
        key: "global",
      }).session(session);


    const bonusEnabled =
      appSettings
        ?.depositBonusEnabled ===
      true;


    const rawBonusPercent =
      Number(
        appSettings
          ?.depositBonusPercent ??
          0
      );


    const bonusPercent =
      bonusEnabled &&
      Number.isFinite(
        rawBonusPercent
      )
        ? Math.min(
            Math.max(
              rawBonusPercent,
              0
            ),
            100
          )
        : 0;


    /* =========================================
       4. CALCULATE BONUS
    ========================================= */

    const depositAmount =
      Number(
        deposit.amount
      );


    const bonusAmount =
      Number(
        (
          (
            depositAmount *
            bonusPercent
          ) /
          100
        ).toFixed(2)
      );


    const creditedAmount =
      Number(
        (
          depositAmount +
          bonusAmount
        ).toFixed(2)
      );


    /* =========================================
       5. CALCULATE WALLET BALANCE
    ========================================= */

    const balanceBefore =
      Number(
        wallet.balance || 0
      );


    const balanceAfter =
      Number(
        (
          balanceBefore +
          creditedAmount
        ).toFixed(2)
      );


    /* =========================================
       6. UPDATE WALLET
    ========================================= */

    wallet.balance =
      balanceAfter;


    await wallet.save({
      session,
    });


    /* =========================================
       7. APPROVE DEPOSIT
    ========================================= */

    deposit.status =
      "approved";


    deposit.processedBy =
      new mongoose.Types.ObjectId(
        agentId
      );


    deposit.processedAt =
      new Date();


    await deposit.save({
      session,
    });


    /* =========================================
       8. CREATE TRANSACTION
    ========================================= */

    await Transaction.create(
      [
        {
          userId:
            deposit.playerId,

          type:
            "deposit",

          /*
           * Transaction amount is the
           * actual amount credited to
           * the wallet.
           */
          amount:
            creditedAmount,

          balanceBefore,

          balanceAfter,

          currency:
            "ETB",

          status:
            "completed",

          reference:
            deposit.reference,

          requestId:
            deposit._id,

          processedBy:
            new mongoose.Types.ObjectId(
              agentId
            ),

          description:
            bonusAmount > 0
              ? `Deposit approved by agent. Base deposit: ${depositAmount} ETB, bonus: ${bonusAmount} ETB (${bonusPercent}%), total credited: ${creditedAmount} ETB`
              : "Deposit approved by agent",
        },
      ],
      {
        session,
      }
    );


    /* =========================================
       9. COMMIT
    ========================================= */

    await session.commitTransaction();


    /* =========================================
       10. NOTIFY PLAYER
    ========================================= */

    try {

      const notificationMessage =
        bonusAmount > 0
          ? `Your deposit of ${depositAmount} ETB has been approved. You received a ${bonusPercent}% deposit bonus of ${bonusAmount} ETB. Total credited: ${creditedAmount} ETB.`
          : `Your deposit of ${depositAmount} ETB has been approved.`;


      await sendNotificationToUser(
        deposit.playerId.toString(),

        "Deposit Approved",

        notificationMessage,

        {
          type:
            "deposit_approved",

          depositId:
            deposit._id.toString(),

          amount:
            depositAmount.toString(),

          bonusAmount:
            bonusAmount.toString(),

          bonusPercent:
            bonusPercent.toString(),

          creditedAmount:
            creditedAmount.toString(),

          agentId:
            agentId.toString(),
        }
      );

    } catch (
      notificationError
    ) {

      console.error(
        "Failed to send deposit approval notification:",
        notificationError
      );

    }


    /* =========================================
       11. RETURN RESULT
    ========================================= */

    return {
      deposit,

      balanceBefore,

      balanceAfter,

      depositAmount,

      bonusEnabled,

      bonusPercent,

      bonusAmount,

      creditedAmount,
    };

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    await session.endSession();

  }
};