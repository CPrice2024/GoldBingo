import mongoose from "mongoose";

import { Deposit } from "./deposit.model";
import { Wallet } from "../wallet/wallet.model";
import { Transaction } from "../transactions/transaction.model";
import { User } from "../users/user.model";
import {
  AppSettings,
} from "../settings/appSettings.model";
import {
  verifyCbeReceipt,
} from "./cbeReceipt.service";
import {
  PaymentSms,
} from "../paymentSms/paymentSms.model";
import {
  createDeposit,
  findPlayerDeposits,
  countFilteredPlayerDeposits,
  findAgentPendingDeposits,
  countAgentPendingDeposits,
  getAgentPendingDepositAmount,
  findDepositById,
  findDepositByReference,
} from "./deposit.repository";

import {
  sendNotificationToUser,
} from "../notifications/notification.service";

import {
  PaymentMethod,
} from "./deposit.types";

import {
  getPaginationParams,
  buildPaginationMeta,
} from "../../shared/pagination";

interface CreateDepositInput {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  note?: string;
}
interface ApproveDepositOptions {
  verifiedAmount?: number;

  autoApproved?: boolean;

  matchedTransactionId?: string;

  smsReceivedAt?: Date;

  approvalSource?:
    | "sms"
    | "cbe_qr";
}
const PAYMENT_SMS_REVERSE_MATCH_WINDOW_MS =
  12 * 60 * 60 * 1000;

const isAutoApprovalEnabled = () =>
  String(
    process.env.PAYMENT_SMS_AUTO_APPROVE ??
      "false"
  )
    .trim()
    .toLowerCase() === "true";
  const getPaymentSmsReceivedAt = (
  sms: any
): Date => {
  const parsedReceivedStamp =
    sms?.receivedStamp
      ? new Date(
          sms.receivedStamp
        )
      : null;

  if (
    parsedReceivedStamp &&
    Number.isFinite(
      parsedReceivedStamp.getTime()
    )
  ) {
    return parsedReceivedStamp;
  }

  return new Date(
    sms.createdAt
  );
};


const extractReceivedSmsAmount = (
  text: string
): number | null => {
  const match =
    String(text || "").match(
      /you\s+have\s+received\s+(?:ETB|BIRR)\s*:?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i
    );

  if (!match) {
    return null;
  }

  const amount =
    Number(
      match[1].replace(/,/g, "")
    );

  return Number.isFinite(amount)
    ? amount
    : null;
};


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
  data.reference
    ? data.reference
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "")
    : undefined;

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

/* =========================================
   MATCH SMS THAT ARRIVED BEFORE DEPOSIT

   Allowed:
   SMS first
   → deposit request up to 12 hours later
========================================= */

if (
  reference &&
  (
    data.paymentMethod === "telebirr" ||
    data.paymentMethod === "cbe"
  )
) {
  const previousSms =
    await PaymentSms.findOne({
      agentId:
        agent._id,

      reference,

      paymentMethod:
        data.paymentMethod,

      status:
        "ignored",
    }).sort({
      createdAt: -1,
    });


  if (previousSms) {
    const smsReceivedAt =
      getPaymentSmsReceivedAt(
        previousSms
      );

    const depositCreatedAt =
      new Date(
        (deposit as any).createdAt
      );

    const timeDifferenceMs =
      depositCreatedAt.getTime() -
      smsReceivedAt.getTime();

    const withinReverseWindow =
      timeDifferenceMs >= 0 &&
      timeDifferenceMs <=
        PAYMENT_SMS_REVERSE_MATCH_WINDOW_MS;


    if (withinReverseWindow) {
      const storedSmsAmount =
        Number(
          previousSms.amount
        );

      const parsedSmsAmount =
        extractReceivedSmsAmount(
          previousSms.text || ""
        );

      const smsAmount =
        Number.isFinite(
          storedSmsAmount
        )
          ? storedSmsAmount
          : parsedSmsAmount;

      const requestedAmount =
        Number(
          deposit.amount
        );


      const amountIsValid =
        smsAmount !== null &&
        Number.isFinite(
          Number(smsAmount)
        ) &&
        Number(smsAmount) >=
          requestedAmount;


      if (amountIsValid) {
        previousSms.status =
          "matched";

        previousSms.amount =
          Number(smsAmount);

        previousSms.depositId =
          deposit._id;

        previousSms.error =
          undefined;

        await previousSms.save();


        if (
          isAutoApprovalEnabled()
        ) {
          const approval =
            await approveDeposit(
              deposit._id.toString(),
              agent._id.toString(),
              {
                verifiedAmount:
                  Number(smsAmount),

                autoApproved:
                  true,

                matchedTransactionId:
                  reference,

                smsReceivedAt,
              }
            );


          previousSms.status =
            "approved";

          await previousSms.save();

          return approval.deposit;
        }
      }
    }
  }
}

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
export const verifyAndApproveCbeDeposit =
  async (
    playerId: string,
    receiptUrl: string
  ) => {

    /* =========================================
       1. VERIFY RECEIPT WITH CBE
    ========================================= */

    const receipt =
      await verifyCbeReceipt(
        receiptUrl
      );


    /* =========================================
       2. FIND PLAYER
    ========================================= */

    const player =
      await User.findOne({
        _id: playerId,
        role: "player",
        status: "active",
      });


    if (!player) {
      throw new Error(
        "Player not found"
      );
    }


    if (!player.referredBy) {
      throw new Error(
        "Player is not assigned to an agent"
      );
    }


    /* =========================================
       3. FIND ASSIGNED AGENT
    ========================================= */

    const agent =
      await User.findOne({
        _id:
          player.referredBy,

        role:
          "agent",

        status:
          "active",
      });


    if (!agent) {
      throw new Error(
        "Player's assigned agent is not available"
      );
    }


    /* =========================================
       4. CHECK AGENT CBE SETTINGS
    ========================================= */

    const cbeSettings =
      agent.paymentSettings
        ?.cbe;


    if (
      !cbeSettings?.enabled
    ) {
      throw new Error(
        "CBE deposits are currently unavailable"
      );
    }


    const agentCbeAccount =
      String(
        cbeSettings.account || ""
      )
        .replace(/\D/g, "");


    if (!agentCbeAccount) {
      throw new Error(
        "Agent CBE account is not configured"
      );
    }


    /* =========================================
       5. VERIFY RECEIVER ACCOUNT

       CBE API returns masked account:
       1********0051

       Agent setting contains real account.
       We compare final 4 digits.
    ========================================= */

    const receiptAccountDigits =
      String(
        receipt.receiverAccount || ""
      )
        .replace(/\D/g, "");


    const expectedLast4 =
      agentCbeAccount.slice(
        -4
      );


    const receivedLast4 =
      receiptAccountDigits.slice(
        -4
      );


    if (
      !expectedLast4 ||
      !receivedLast4 ||
      expectedLast4 !==
        receivedLast4
    ) {
      throw new Error(
        "CBE receipt receiver account does not match the assigned agent"
      );
    }


    /* =========================================
       6. FIND MATCHING PENDING DEPOSIT
    ========================================= */

    const deposit =
      await Deposit.findOne({
        playerId:
          player._id,

        agentId:
          agent._id,

        paymentMethod:
          "cbe",

        reference:
          receipt.reference,

        status:
          "pending",
      });


    if (!deposit) {
      throw new Error(
        "No matching pending CBE deposit found for this receipt"
      );
    }


    /* =========================================
       7. CHECK RECEIPT AMOUNT
    ========================================= */

    const requestedAmount =
      Number(
        deposit.amount
      );


    const receivedAmount =
      Number(
        receipt.transferredAmount
      );


    if (
      !Number.isFinite(
        receivedAmount
      ) ||
      receivedAmount <= 0
    ) {
      throw new Error(
        "Invalid CBE receipt amount"
      );
    }


    if (
      receivedAmount <
      requestedAmount
    ) {
      throw new Error(
        `CBE receipt amount ${receivedAmount} ETB is lower than requested deposit amount ${requestedAmount} ETB`
      );
    }


    /* =========================================
       8. AUTO APPROVE
    ========================================= */

    const result =
      await approveDeposit(
        deposit._id.toString(),

        agent._id.toString(),

        {
          verifiedAmount:
            receivedAmount,

          autoApproved:
            true,

          matchedTransactionId:
            receipt.reference,

          approvalSource:
            "cbe_qr",
        }
      );


    return {
      receipt,

      deposit:
        result.deposit,

      balanceBefore:
        result.balanceBefore,

      balanceAfter:
        result.balanceAfter,

      depositAmount:
        result.depositAmount,

      bonusAmount:
        result.bonusAmount,

      creditedAmount:
        result.creditedAmount,
    };
  };
export const getPlayerDeposits = async (
  playerId: string,
  query: any = {}
) => {

  const {
    page,
    limit,
    skip,
  } =
    getPaginationParams(
      query
    );


  /* =========================================
     SEARCH
  ========================================= */

  const search =
    typeof query.search ===
      "string"
      ? query.search.trim()
      : "";


  /* =========================================
     STATUS
  ========================================= */

  const requestedStatus =
    typeof query.status ===
      "string"
      ? query.status.trim()
      : "";


  const status =
    [
      "pending",
      "approved",
      "rejected",
    ].includes(
      requestedStatus
    )
      ? requestedStatus
      : "";


  /* =========================================
     PAYMENT METHOD
  ========================================= */

  const requestedPaymentMethod =
    typeof query.paymentMethod ===
      "string"
      ? query.paymentMethod.trim()
      : "";


  const paymentMethod =
    [
      "telebirr",
      "cbe",
    ].includes(
      requestedPaymentMethod
    )
      ? requestedPaymentMethod
      : "";


  /* =========================================
     LOAD DEPOSITS + TOTAL
  ========================================= */

  const [
    deposits,
    total,
  ] =
    await Promise.all([

      findPlayerDeposits(
        playerId,
        search,
        status,
        paymentMethod,
        skip,
        limit
      ),

      countFilteredPlayerDeposits(
        playerId,
        search,
        status,
        paymentMethod
      ),

    ]);


  /* =========================================
     RESULT
  ========================================= */

  return {
    data:
      deposits,

    pagination:
      buildPaginationMeta({
        page,
        limit,
        total,
      }),
  };
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
  agentId: string,
  query: any = {}
) => {

  /* =========================================
     PAGINATION
  ========================================= */

  const {
    page,
    limit,
    skip,
  } =
    getPaginationParams(
      query
    );


  /* =========================================
     SEARCH
  ========================================= */

  const search =
    typeof query.search ===
      "string"
      ? query.search.trim()
      : "";


  /* =========================================
     PAYMENT METHOD
  ========================================= */

  const requestedPaymentMethod =
    typeof query.paymentMethod ===
      "string"
      ? query.paymentMethod.trim()
      : "";


  const paymentMethod =
    [
      "telebirr",
      "cbe",
    ].includes(
      requestedPaymentMethod
    )
      ? requestedPaymentMethod
      : "";


  /* =========================================
     LOAD DATA + COUNTS + AMOUNT
  ========================================= */

  const [
    deposits,
    filteredTotal,
    pendingCount,
    pendingAmount,
  ] =
    await Promise.all([

      findAgentPendingDeposits(
        agentId,
        search,
        paymentMethod,
        skip,
        limit
      ),


      /*
       * Total matching current filters.
       * Used for pagination.
       */
      countAgentPendingDeposits(
        agentId,
        search,
        paymentMethod
      ),


      /*
       * Entire pending request count.
       * Used by top statistics card.
       */
      countAgentPendingDeposits(
        agentId
      ),


      /*
       * Entire pending amount.
       * Not limited to current page.
       */
      getAgentPendingDepositAmount(
        agentId
      ),

    ]);


  /* =========================================
     RESULT
  ========================================= */

  return {
    data:
      deposits,

    pagination:
      buildPaginationMeta({
        page,
        limit,
        total:
          filteredTotal,
      }),

    stats: {
      pendingCount:
        Number(
          pendingCount || 0
        ),

      pendingAmount:
        Number(
          pendingAmount || 0
        ),
    },
  };
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
  agentId: string,
  options: ApproveDepositOptions = {}
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

    const requestedAmount =
  Number(
    deposit.amount
  );


const depositAmount =
  Number(
    options.verifiedAmount ??
      requestedAmount
  );


if (
  !Number.isFinite(
    depositAmount
  ) ||
  depositAmount <= 0
) {
  throw new Error(
    "Invalid approved deposit amount"
  );
}


/*
 * An automatically verified SMS
 * must never approve less than
 * the player requested.
 */
if (
  options.autoApproved === true &&
  depositAmount <
    requestedAmount
) {
  throw new Error(
    "Verified SMS amount is lower than requested deposit amount"
  );
}


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


deposit.approvedAmount =
  depositAmount;


deposit.processedBy =
  new mongoose.Types.ObjectId(
    agentId
  );


deposit.processedAt =
  new Date();


/* =========================================
   SMS AUTO APPROVAL DATA
========================================= */

if (
  options.autoApproved === true
) {

  deposit.autoApproved =
    true;

  deposit.matchedTransactionId =
    options.matchedTransactionId;


  if (
    options.approvalSource !==
      "cbe_qr"
  ) {

    deposit.smsAmount =
      depositAmount;

    deposit.smsReceivedAt =
      options.smsReceivedAt;
  }

} else {

  deposit.autoApproved =
    false;

}


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
            options.matchedTransactionId ||
               deposit.reference,

          requestId:
            deposit._id,

          processedBy:
            new mongoose.Types.ObjectId(
              agentId
            ),

          description:
  options.autoApproved
    ? bonusAmount > 0
      ? `Deposit automatically approved from SMS. Verified deposit: ${depositAmount} ETB, bonus: ${bonusAmount} ETB (${bonusPercent}%), total credited: ${creditedAmount} ETB`
      : `Deposit automatically approved from verified SMS: ${depositAmount} ETB`
    : bonusAmount > 0
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


/* =========================================
   PROCESS NEW PAYMENT SMS

   RULES:

   1. SMS arrives AFTER deposit request
   2. SMS arrives within 24 hours
   3. Reference matches
   4. Payment method matches
   5. Agent matches
   6. SMS amount >= requested amount
========================================= */
