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
        });


      if (!deposit) {

        sms.status =
          "ignored";

        sms.error =
          "No matching pending deposit request";

        await sms.save();


        return {
          matched: false,
          reference:
            parsed.reference,
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


      /*
       * Extract all ETB/Birr amounts
       * appearing in the SMS.
       */

      const smsAmounts =
        extractAmounts(
          text
        );


      const requestedAmount =
        Number(
          deposit.amount
        );


      /*
       * Require one of the actual
       * currency amounts in the SMS
       * to equal the requested amount.
       */

      const amountMatches =
        smsAmounts.some(
          (amount) =>
            Math.abs(
              amount -
              requestedAmount
            ) < 0.01
        );


      if (!amountMatches) {

        sms.status =
          "failed";

        sms.error =
          "SMS amount does not match deposit request";

        await sms.save();


        return {
          matched: false,

          reference:
            parsed.reference,

          requestedAmount,

          smsAmounts,
        };

      }


      sms.status =
        "matched";

      sms.amount =
        requestedAmount;

      sms.depositId =
        deposit._id;

      await sms.save();


      /*
       * IMPORTANT:
       *
       * Reuse existing transactional
       * deposit approval.
       */

      const result =
        await approveDeposit(
          deposit._id.toString(),
          data.agentId
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

        amount:
          requestedAmount,

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