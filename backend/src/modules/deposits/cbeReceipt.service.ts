export interface CbeReceiptResult {
  receiptUrl: string;
  status: string;
  reference: string;
  transferredAmount: number;
  receiver?: string;
  receiverAccount?: string;
  paymentDate?: string;
}

interface CbeApiResponse {
  id?: string;
  status?: string;
  amountCredited?: string;
  debitAmount?: string;
  creditAccountHolder?: string;
  creditAccountNo?: string;
  dateTimes?: string[];
  creditCurrency?: string;
}


/* =========================================
   VALIDATE OFFICIAL CBE RECEIPT URL
========================================= */

const validateCbeReceiptUrl = (
  value: unknown
): string => {
  const raw =
    String(value || "").trim();

  if (!raw) {
    throw new Error(
      "CBE receipt QR URL is required"
    );
  }

  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      "Invalid CBE receipt QR URL"
    );
  }

  if (
    url.protocol !== "https:" ||
    url.hostname.toLowerCase() !==
      "mbreciept.cbe.com.et"
  ) {
    throw new Error(
      "Only official CBE receipt URLs are allowed"
    );
  }

  if (
    !/^\/v2-[A-Za-z0-9_-]+$/.test(
      url.pathname
    )
  ) {
    throw new Error(
      "Invalid CBE receipt QR format"
    );
  }

  url.search = "";
  url.hash = "";

  return url.toString();
};


/* =========================================
   VERIFY CBE RECEIPT
========================================= */

export const verifyCbeReceipt =
  async (
    receiptUrl: string
  ): Promise<CbeReceiptResult> => {

    const safeUrl =
      validateCbeReceiptUrl(
        receiptUrl
      );


    /* =====================================
       EXTRACT TOKEN
    ===================================== */

    const receiptToken =
      new URL(
        safeUrl
      ).pathname.replace(
        /^\/+/,
        ""
      );


    const apiUrl =
      `https://mb.cbe.com.et/api/v1/transactions/public/transaction-detail/${encodeURIComponent(
        receiptToken
      )}`;


    /* =====================================
       TIMEOUT
    ===================================== */

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        10000
      );


    try {

      /* =====================================
         CALL CBE API
      ===================================== */

      const response =
        await fetch(
          apiUrl,
          {
            method: "GET",

            signal:
              controller.signal,

            headers: {
  Accept:
    "application/json",

  Origin:
    "https://mbreciept.cbe.com.et",

  Referer:
    "https://mbreciept.cbe.com.et/",

  "User-Agent":
    "GoldBingo-CBE-Verifier/1.0",

  "X-App-ID":
    "d1292e42-7400-49de-a2d3-9731caa4c819",

  "X-App-Version":
    "0a01980b-9859-1369-8198-59f403820000",
},

            redirect:
              "error",
          }
        );


     if (!response.ok) {
  const errorBody =
    await response.text();

  console.log(
    "\n===== CBE API ERROR ====="
  );

  console.log(
    "Status:",
    response.status
  );

  console.log(
    "Body:",
    errorBody
  );

  console.log(
    "===== END CBE API ERROR =====\n"
  );

  throw new Error(
    `CBE receipt could not be loaded (${response.status})`
  );
}


      /* =====================================
         PARSE RESPONSE
      ===================================== */

      const data: CbeApiResponse =
  await response.json();


      /* =====================================
         STATUS
      ===================================== */

      const status =
        String(
          data.status || ""
        )
          .trim()
          .toUpperCase();


      if (!status) {
        throw new Error(
          "CBE receipt status was not found"
        );
      }


      if (
        status !== "COMPLETED"
      ) {
        throw new Error(
          `CBE transaction is not completed. Status: ${status}`
        );
      }


      /* =====================================
         REFERENCE
      ===================================== */

      const reference =
        String(
          data.id || ""
        )
          .trim()
          .toUpperCase();


      if (
        !/^FT[A-Z0-9]{10}$/.test(
          reference
        )
      ) {
        throw new Error(
          "Invalid CBE transaction reference"
        );
      }


      /* =====================================
         CURRENCY
      ===================================== */

      const currency =
        String(
          data.creditCurrency || ""
        )
          .trim()
          .toUpperCase();


      if (
        currency &&
        currency !== "ETB"
      ) {
        throw new Error(
          "CBE receipt currency must be ETB"
        );
      }


      /* =====================================
         ACTUAL RECEIVED AMOUNT
      ===================================== */

      const transferredAmount =
        Number(
          data.amountCredited
        );


      if (
        !Number.isFinite(
          transferredAmount
        ) ||
        transferredAmount <= 0
      ) {
        throw new Error(
          "Invalid CBE transferred amount"
        );
      }


      /* =====================================
         RECEIVER
      ===================================== */

      const receiver =
        data.creditAccountHolder
          ? String(
              data.creditAccountHolder
            ).trim()
          : undefined;


      /* =====================================
         RECEIVER ACCOUNT
      ===================================== */

      const receiverAccount =
        data.creditAccountNo
          ? String(
              data.creditAccountNo
            ).trim()
          : undefined;


      /* =====================================
         PAYMENT DATE
      ===================================== */

      const paymentDate =
        Array.isArray(
          data.dateTimes
        ) &&
        data.dateTimes.length > 0
          ? String(
              data.dateTimes[0]
            )
          : undefined;


      return {
        receiptUrl:
          safeUrl,

        status,

        reference,

        transferredAmount,

        receiver,

        receiverAccount,

        paymentDate,
      };

   } catch (error) {

  console.error(
    "\n===== CBE FETCH ERROR ====="
  );

  console.error(
    "Error:",
    error
  );

  if (
    error &&
    typeof error === "object" &&
    "cause" in error
  ) {
    console.error(
      "Cause:",
      (error as {
        cause?: unknown;
      }).cause
    );
  }

  console.error(
    "===== END CBE FETCH ERROR =====\n"
  );


  if (
    error instanceof Error &&
    error.name === "AbortError"
  ) {
    throw new Error(
      "CBE receipt verification timed out"
    );
  }

  throw error;

    } finally {

      clearTimeout(
        timeout
      );
    }
  };