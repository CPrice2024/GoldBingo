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
  normalizeCbeReceiptUrl,
  extractCbeTransferAmountFromSms,
} from "./cbeReceiptUrl.util";
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

  amount:
    number;

  paymentMethod:
    PaymentMethod;

  reference?:
    string;

  cbeReceiptUrl?:
    string;

  note?:
    string;
}
interface ApproveDepositOptions {
  verifiedAmount?: number;

  autoApproved?: boolean;

  matchedTransactionId?: string;

  smsReceivedAt?: Date;

  approvalSource?:
  | "sms"
  | "cbe_qr"
  | "cbe_sms_qr";
}
const PAYMENT_SMS_REVERSE_MATCH_WINDOW_MS =
  12 * 60 * 60 * 1000;
const PAYMENT_SMS_FORWARD_MATCH_WINDOW_MS =
  24 * 60 * 60 * 1000;
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
  const raw =
    String(text || "");

  const patterns = [
    // English Telebirr
    // You have received ETB 11.00
    /you\s+have\s+received\s+(?:ETB|BIRR)\s*:?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i,

    // Amharic Telebirr
    // 11.00 ብር በ 03/10/2026
    /([0-9][0-9,]*(?:\.\d{1,2})?)\s*ብር\s*በ\s*\d{1,2}[/-]\d{1,2}[/-]\d{4}/u,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      raw.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const amount =
      Number(
        match[1].replace(
          /,/g,
          ""
        )
      );

    if (
      Number.isFinite(amount) &&
      amount > 0
    ) {
      return amount;
    }
  }

  return null;
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
  data.paymentMethod ===
    "telebirr"
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
       1. NORMALIZE QR URL
    ========================================= */

    const normalizedReceiptUrl =
      normalizeCbeReceiptUrl(
        receiptUrl
      );


    if (!normalizedReceiptUrl) {
      throw new Error(
        "Invalid CBE receipt QR URL"
      );
    }


    /* =========================================
       2. VISIT / VERIFY WITH CBE
    ========================================= */

    const receipt =
      await verifyCbeReceipt(
        normalizedReceiptUrl
      );


    /* =========================================
       3. PLAYER
    ========================================= */

    const player =
      await User.findOne({
        _id:
          playerId,

        role:
          "player",

        status:
          "active",
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
       4. AGENT
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
       5. VERIFY CBE ACCOUNT
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
        cbeSettings.account ||
          ""
      ).replace(
        /\D/g,
        ""
      );


    if (!agentCbeAccount) {
      throw new Error(
        "Agent CBE account is not configured"
      );
    }


    const receiptAccountDigits =
      String(
        receipt.receiverAccount ||
          ""
      ).replace(
        /\D/g,
        ""
      );


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
       6. NORMALIZE RECEIPT REFERENCE
    ========================================= */

    const receiptReference =
      String(
        receipt.reference ||
          ""
      )
        .trim()
        .toUpperCase()
        .replace(
          /\s+/g,
          ""
        );


    if (!receiptReference) {
      throw new Error(
        "CBE receipt transaction ID was not found"
      );
    }


    /* =========================================
       7. FIND PENDING DEPOSIT

       Player's entered FT reference must
       equal the official CBE receipt.
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
          receiptReference,

        status:
          "pending",
      });


    if (!deposit) {
      throw new Error(
        "No matching pending CBE deposit found for this receipt"
      );
    }


    /* =========================================
       8. RECEIPT AMOUNT MUST MATCH EXACTLY
    ========================================= */

    const requestedAmount =
      Number(
        deposit.amount
      );


    const receiptAmount =
      Number(
        receipt.transferredAmount
      );


    if (
      !Number.isFinite(
        receiptAmount
      ) ||
      receiptAmount <= 0
    ) {
      throw new Error(
        "Invalid CBE receipt amount"
      );
    }


    if (
      Math.abs(
        receiptAmount -
          requestedAmount
      ) >= 0.01
    ) {
      throw new Error(
        `CBE receipt amount ${receiptAmount} ETB does not match requested deposit amount ${requestedAmount} ETB`
      );
    }


    /* =========================================
       9. PREVENT QR RECEIPT REUSE
    ========================================= */

    const usedReceipt =
      await Deposit.findOne({
        cbeReceiptUrl:
          normalizedReceiptUrl,

        _id: {
          $ne:
            deposit._id,
        },
      });


    if (usedReceipt) {
      throw new Error(
        "This CBE receipt has already been used"
      );
    }


    /*
     * QR has now been verified against
     * CBE and belongs to this deposit.
     */
    deposit.cbeReceiptUrl =
      normalizedReceiptUrl;


    await deposit.save();


    /* =========================================
       10. FIND SAME VERIFIED FT IN AGENT SMS
    ========================================= */

    const depositCreatedAt =
      new Date(
        deposit.createdAt
      );


    const earliestSmsTime =
      new Date(
        depositCreatedAt.getTime() -
          PAYMENT_SMS_REVERSE_MATCH_WINDOW_MS
      );


    const latestSmsTime =
      new Date(
        depositCreatedAt.getTime() +
          PAYMENT_SMS_FORWARD_MATCH_WINDOW_MS
      );


    /* =========================================
   10. FIND MATCHING RECEIVER CBE SMS

   IMPORTANT:
   Sender receipt URL and receiver receipt
   URL are different.

   Match the underlying verified
   transaction reference instead.
========================================= */

const paymentSms =
  await PaymentSms.findOne({
    agentId:
      agent._id,

    paymentMethod:
      "cbe",

    /*
     * Both official CBE receipt pages
     * must resolve to the same FT.
     */
    reference:
      receiptReference,

    /*
     * "ignored" is included because
     * the SMS may have arrived before
     * the player created/submitted
     * the deposit.
     */
    status: {
      $in: [
        "received",
        "ignored",
        "matched",
      ],
    },

    createdAt: {
      $gte:
        earliestSmsTime,

      $lte:
        latestSmsTime,
    },
  }).sort({
    createdAt: -1,
  });


    /*
     * QR is valid, but agent SMS has
     * not arrived yet.
     *
     * Keep deposit pending.
     */
    if (!paymentSms) {

      return {
        verified:
          true,

        matched:
          false,

        approved:
          false,

        reason:
          "Waiting for matching CBE SMS",

        receipt,

        deposit,
      };

    }


    /* =========================================
       11. SMS AMOUNT
    ========================================= */

    const storedSmsAmount =
      Number(
        paymentSms.amount
      );


    const parsedSmsAmount =
      extractCbeTransferAmountFromSms(
        paymentSms.text
      );


    const smsAmount =
      Number.isFinite(
        storedSmsAmount
      )
        ? storedSmsAmount
        : parsedSmsAmount;


    if (
      smsAmount === null ||
      !Number.isFinite(
        Number(
          smsAmount
        )
      )
    ) {
      throw new Error(
        "Could not determine CBE amount from agent SMS"
      );
    }


    /*
     * Business rule:
     *
     * SMS amount must be EXACTLY
     * the amount requested.
     */
    if (
      Math.abs(
        Number(
          smsAmount
        ) -
          requestedAmount
      ) >= 0.01
    ) {
      throw new Error(
        `CBE SMS amount ${smsAmount} ETB does not match requested deposit amount ${requestedAmount} ETB`
      );
    }


    /*
     * We now have:
     *
     * QR URL match
     * receipt amount match
     * SMS amount match
     * same agent
     * same pending deposit
     */

    paymentSms.status =
      "matched";

    paymentSms.reference =
      receiptReference;

    paymentSms.amount =
      Number(
        smsAmount
      );

    paymentSms.depositId =
      deposit._id;

    paymentSms.error =
      undefined;


    await paymentSms.save();


    /* =========================================
       12. SAFE MODE
    ========================================= */

    if (
      !isAutoApprovalEnabled()
    ) {

      return {
        verified:
          true,

        matched:
          true,

        approved:
          false,

        reason:
          "CBE QR and SMS matched, but automatic approval is disabled",

        receipt,

        deposit,

        sms:
          paymentSms,
      };

    }


    /* =========================================
       13. AUTO APPROVE
    ========================================= */

    const smsReceivedAt =
      getPaymentSmsReceivedAt(
        paymentSms
      );


    const result =
      await approveDeposit(
        deposit._id.toString(),

        agent._id.toString(),

        {
          verifiedAmount:
            requestedAmount,

          autoApproved:
            true,

          matchedTransactionId:
            receiptReference,

          smsReceivedAt,

          approvalSource:
            "cbe_sms_qr",
        }
      );


    paymentSms.status =
      "approved";


    await paymentSms.save();


    return {
      verified:
        true,

      matched:
        true,

      approved:
        true,

      verificationSource:
        "cbe_sms_qr",

      receipt,

      sms:
        paymentSms,

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

export const lookupTelebirrPayment =
  async (
    playerId: string,
    rawReference: string
  ) => {
    const reference =
      String(rawReference || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

    if (
      !/^D[A-Z0-9]{9}$/.test(
        reference
      )
    ) {
      throw new Error(
        "Invalid Telebirr transaction ID"
      );
    }

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

    const existingDeposit =
      await findDepositByReference(
        reference
      );

    if (existingDeposit) {
      throw new Error(
        "This transaction ID has already been used"
      );
    }

    const sms =
      await PaymentSms.findOne({
        agentId:
          player.referredBy,

        paymentMethod:
          "telebirr",

        reference,
      }).sort({
        createdAt: -1,
      });

    if (!sms) {
      return {
        matched: false,
        reference,
        amount: null,
        reason:
          "Matching Telebirr SMS has not arrived yet",
      };
    }

    /*
     * Do not allow an SMS already
     * connected to another deposit.
     */
    if (
      sms.depositId ||
      sms.status === "matched" ||
      sms.status === "approved"
    ) {
      throw new Error(
        "This Telebirr transaction has already been used"
      );
    }

    const storedAmount =
      Number(
        sms.amount
      );

    const parsedAmount =
      extractReceivedSmsAmount(
        sms.text || ""
      );

    const amount =
      Number.isFinite(
        storedAmount
      ) &&
      storedAmount > 0
        ? storedAmount
        : parsedAmount;

    if (
  (
    !Number.isFinite(
      storedAmount
    ) ||
    storedAmount <= 0
  ) &&
  parsedAmount !== null &&
  parsedAmount > 0
) {
  sms.amount =
    parsedAmount;

  await sms.save();
}

    if (
      amount === null ||
      !Number.isFinite(
        Number(amount)
      ) ||
      Number(amount) <= 0
    ) {
      return {
        matched: false,
        reference,
        amount: null,
        reason:
          "Telebirr SMS found but amount could not be determined",
      };
    }

    const smsReceivedAt =
      getPaymentSmsReceivedAt(
        sms
      );

    const ageMs =
      Date.now() -
      smsReceivedAt.getTime();

    if (
      ageMs < 0 ||
      ageMs >
        PAYMENT_SMS_REVERSE_MATCH_WINDOW_MS
    ) {
      return {
        matched: false,
        reference,
        amount: null,
        reason:
          "Telebirr transaction is outside the allowed time window",
      };
    }

    return {
      matched: true,
      reference,
      amount:
        Number(amount),
      smsReceivedAt,
    };
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
