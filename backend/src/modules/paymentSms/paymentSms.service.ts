import crypto from "crypto";
import mongoose from "mongoose";

import {
  PaymentSms,
} from "./paymentSms.model";

import {
  Deposit,
} from "../deposits/deposit.model";

import {
  approveDeposit,
} from "../deposits/deposit.service";


interface IncomingSms {
  agentId: string;
  from?: string;
  text?: string;
  sentStamp?: string;
  receivedStamp?: string;
  sim?: string;
}

/* =========================================
   AUTO APPROVAL SAFETY SWITCH
========================================= */

const isAutoApprovalEnabled = () => {
  return (
    String(
      process.env.PAYMENT_SMS_AUTO_APPROVE ??
        "false"
    )
      .trim()
      .toLowerCase() === "true"
  );
};
const PAYMENT_SMS_MATCH_WINDOW_MS =
  24 * 60 * 60 * 1000;

/* =========================================
   NORMALIZE REFERENCE
========================================= */

const normalizeReference = (
  value: string
) =>
  value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");


/* =========================================
   EXTRACT TRANSACTION REFERENCE
========================================= */

const extractReference = (
  text: string
) => {

  const normalized =
    text.toUpperCase();


  /*
   * TELEBIRR
   *
   * Your frontend currently expects:
   * D + 9 alphanumeric characters.
   */

  const telebirr =
    normalized.match(
      /\bD[A-Z0-9]{9}\b/
    );


  if (telebirr) {
    return {
      reference:
        normalizeReference(
          telebirr[0]
        ),

      paymentMethod:
        "telebirr" as const,
    };
  }


  /*
   * CBE
   *
   * Your frontend currently expects:
   * FT + 10 alphanumeric characters.
   */

  const cbe =
    normalized.match(
      /\bFT[A-Z0-9]{10}\b/
    );


  if (cbe) {
    return {
      reference:
        normalizeReference(
          cbe[0]
        ),

      paymentMethod:
        "cbe" as const,
    };
  }


  return null;
};


/* =========================================
   EXTRACT ALL CURRENCY AMOUNTS
========================================= */

const extractAmounts = (
  text: string
): number[] => {

  const results:
    number[] = [];


  const patterns = [

    /*
     * ETB 500
     * ETB 1,500.00
     */

    /(?:ETB|BIRR)\s*:?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/gi,


    /*
     * 500 ETB
     * 1,500.00 birr
     */

    /([0-9][0-9,]*(?:\.\d{1,2})?)\s*(?:ETB|BIRR)/gi,
  ];


  for (
    const pattern of patterns
  ) {

    let match;


    while (
      (
        match =
          pattern.exec(text)
      ) !== null
    ) {

      const value =
        Number(
          match[1]
            .replace(
              /,/g,
              ""
            )
        );


      if (
        Number.isFinite(
          value
        )
      ) {

        results.push(
          value
        );

      }

    }

  }


  return [
    ...new Set(
      results
    ),
  ];

};

/* =========================================
   EXTRACT RECEIVED PAYMENT AMOUNT
========================================= */

const extractReceivedAmount = (
  text: string
): number | null => {

  const match = text.match(
    /you\s+have\s+received\s+(?:ETB|BIRR)\s*:?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i
  );

  if (!match) {
    return null;
  }

  const amount = Number(
    match[1].replace(/,/g, "")
  );

  return Number.isFinite(amount)
    ? amount
    : null;
};

/* =========================================
   SMS FINGERPRINT
========================================= */

const createFingerprint = (
  data: IncomingSms
) => {

  return crypto
    .createHash(
      "sha256"
    )
    .update(
      [
        data.agentId,
        data.from || "",
        data.text || "",
        data.sentStamp || "",
        data.receivedStamp || "",
        data.sim || "",
      ].join("|")
    )
    .digest(
      "hex"
    );

};


/* =========================================
   PROCESS PAYMENT SMS
========================================= */

export const processPaymentSms =
  async (
    data: IncomingSms
  ) => {

    if (
      !mongoose.Types.ObjectId
        .isValid(
          data.agentId
        )
    ) {

      throw new Error(
        "Invalid SMS listener agent"
      );

    }


    const text =
      String(
        data.text || ""
      ).trim();


    if (!text) {

      throw new Error(
        "SMS text is required"
      );

    }


    const fingerprint =
      createFingerprint(
        data
      );


    /*
     * Prevent duplicate processing.
     */

    const existingSms =
      await PaymentSms.findOne({
        fingerprint,
      });


    if (existingSms) {

      return {
        duplicate: true,
        sms:
          existingSms,
      };

    }


    const sms =
      await PaymentSms.create({
        fingerprint,

        agentId:
          new mongoose.Types.ObjectId(
            data.agentId
          ),

        from:
          String(
            data.from || "unknown"
          ),

        text,

        sentStamp:
          data.sentStamp,

        receivedStamp:
          data.receivedStamp,

        sim:
          data.sim,

        status:
          "received",
      });


    try {

      /*
       * Find transaction ID.
       */

      const parsed =
        extractReference(
          text
        );


      if (!parsed) {

        sms.status =
          "ignored";

        sms.error =
          "No supported payment transaction reference found";

        await sms.save();


        return {
          matched: false,
          reason:
            sms.error,
        };

      }


      sms.reference =
        parsed.reference;

      sms.paymentMethod =
        parsed.paymentMethod;


      /*
       * Find a PENDING request with
       * this exact transaction ID.
       */

      const receivedAmount =
  extractReceivedAmount(text);

if (receivedAmount !== null) {
  sms.amount =
    receivedAmount;
}

      /* =========================================
   SMS ARRIVAL TIME
========================================= */

/*
 * Prefer receivedStamp when it contains
 * a valid SMS arrival timestamp.
 *
 * Otherwise use the time our backend
 * received/stored the SMS.
 */

const parsedReceivedStamp =
  data.receivedStamp
    ? new Date(
        data.receivedStamp
      )
    : null;


const smsReceivedAt =
  parsedReceivedStamp &&
  Number.isFinite(
    parsedReceivedStamp.getTime()
  )
    ? parsedReceivedStamp
    : new Date();


const windowStart =
  new Date(
    smsReceivedAt.getTime() -
      PAYMENT_SMS_MATCH_WINDOW_MS
  );


/* =========================================
   FIND PENDING DEPOSIT

   Deposit must have been submitted:

   1. BEFORE SMS arrival
   2. No more than 24 hours before SMS
========================================= */

const deposit =
  await Deposit.findOne({

    reference:
      parsed.reference,

    agentId:
      new mongoose.Types.ObjectId(
        data.agentId
      ),

    status:
      "pending",

    createdAt: {
      $gte:
        windowStart,

      $lte:
        smsReceivedAt,
    },

  }).sort({
    createdAt: -1,
  });


      if (!deposit) {

  sms.status =
    "ignored";

  sms.error =
    "No matching pending deposit request within the 24-hour window";

  await sms.save();

  return {
    matched: false,

    reason:
      "NO_PENDING_DEPOSIT_WITHIN_24_HOURS",

    reference:
      parsed.reference,

    smsReceivedAt,
  };
}


      /*
       * Verify payment method.
       */

      if (
        deposit.paymentMethod !==
        parsed.paymentMethod
      ) {

        sms.status =
          "failed";

        sms.error =
          "Payment method does not match deposit request";

        await sms.save();


        return {
          matched: false,
          reason:
            sms.error,
        };

      }


      /* =========================================
   VERIFY RECEIVED AMOUNT
========================================= */

const requestedAmount =
  Number(
    deposit.amount
  );


const actualReceivedAmount =
  Number(
    receivedAmount
  );


/*
 * We must know the actual amount
 * received from the payment SMS.
 */

if (
  receivedAmount === null ||
  !Number.isFinite(
    actualReceivedAmount
  ) ||
  actualReceivedAmount <= 0
) {

  sms.status =
    "failed";

  sms.error =
    "Could not determine received payment amount from SMS";

  await sms.save();


  return {
    matched: false,

    reason:
      "INVALID_SMS_AMOUNT",

    reference:
      parsed.reference,

    requestedAmount,
  };
}


/*
 * IMPORTANT BUSINESS RULE:
 *
 * Received amount may be equal to
 * OR greater than requested amount.
 *
 * But it must never be lower.
 */

if (
  actualReceivedAmount <
  requestedAmount
) {

  sms.status =
    "failed";

  sms.error =
    `Received SMS amount ${actualReceivedAmount} ETB is lower than requested deposit amount ${requestedAmount} ETB`;

  await sms.save();


  return {
    matched: false,

    reason:
      "SMS_AMOUNT_TOO_LOW",

    reference:
      parsed.reference,

    requestedAmount,

    receivedAmount:
      actualReceivedAmount,
  };
}
/* =========================================
   SMS MATCHED
========================================= */

sms.status =
  "matched";

sms.amount =
  actualReceivedAmount;

sms.depositId =
  deposit._id;

sms.error =
  undefined;

await sms.save();
/* =========================================
   SAFE TEST MODE
========================================= */

if (
  !isAutoApprovalEnabled()
) {

  return {
    matched: true,
    approved: false,

    reason:
      "Automatic SMS approval is disabled",

    depositId:
      deposit._id,

    reference:
      parsed.reference,

    requestedAmount,

    receivedAmount:
      actualReceivedAmount,

    smsReceivedAt,
  };
}


/* =========================================
   AUTOMATIC APPROVAL
========================================= */

const result =
  await approveDeposit(
    deposit._id.toString(),
    data.agentId,
    {
      verifiedAmount:
        actualReceivedAmount,

      autoApproved:
        true,

      matchedTransactionId:
        parsed.reference,

      smsReceivedAt,
    }
  );

      sms.status =
        "approved";

      await sms.save();


      return {
  matched: true,
  approved: true,

  depositId:
    deposit._id,

  reference:
    parsed.reference,

  requestedAmount,

  approvedAmount:
    actualReceivedAmount,

  smsReceivedAt,

  result,
};

    } catch (error) {

      sms.status =
        "failed";

      sms.error =
        error instanceof Error
          ? error.message
          : "SMS processing failed";

      await sms.save();


      throw error;

    }

  };