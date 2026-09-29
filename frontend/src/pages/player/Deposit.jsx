import { useEffect, useState } from "react";
import { createWorker } from "tesseract.js";
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import jsQR from "jsqr";
import MobileBackHeader from "../../components/player/MobileBackHeader";
import SearchIcon from "../../components/animated-icons/SearchIcon";
import { useLanguage } from "../../context/LanguageContext";
import telebirrLogo from "../../assets/payment/telebirr.png";
import cbeLogo from "../../assets/payment/cbe.png";

import {
  createDeposit,
  getMyDeposits,
  getMyPaymentSettings,
  approveCbeReceipt,
  verifyCbeReceipt,
} from "../../api/deposits.api";

const PAYMENT_METHOD_META = {
  telebirr: {
    value: "telebirr",
    label: "Telebirr",
    descriptionKey: "deposit.telebirrDescription",
    icon: telebirrLogo,
  },

  cbe: {
    value: "cbe",
    label: "CBE",
    descriptionKey: "deposit.cbeDescription",
    icon: cbeLogo,
  },
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString();
};

const formatAmount = (amount) =>
  Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getStatusIcon = (status) => {
  if (status === "approved") {
    return <CheckCircle2 size={17} />;
  }

  if (status === "rejected") {
    return <XCircle size={17} />;
  }

  return <Clock3 size={17} />;
};

function Deposit() {
    const { t } = useLanguage();

  const [cbeStage, setCbeStage] =
    useState("idle");

  const [verifiedCbe, setVerifiedCbe] =
    useState(null);
  const [form, setForm] = useState({
  amount: "",
  paymentMethod: "",
  reference: "",
  receiptUrl: "",
});

  const [deposits, setDeposits] = useState([]);
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");


const [paymentSettings, setPaymentSettings] = useState(null);
const [paymentSettingsLoading, setPaymentSettingsLoading] =
  useState(true);

const [ocrLoading, setOcrLoading] = useState(false);
const [ocrProgress, setOcrProgress] = useState(0);
const [ocrError, setOcrError] = useState("");

  const loadDeposits = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getMyDeposits();

      const recentDeposits =
  Array.isArray(result?.data)
    ? [...result.data]
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ).getTime() -
            new Date(
              a.createdAt
            ).getTime()
        )
        .slice(0, 15)
    : [];

setDeposits(
  recentDeposits
);
    } catch (err) {
      console.error("Failed to load deposits:", err);

      setError(
  err?.response?.data?.message ||
    t("deposit.loadRequestsError")
);
    } finally {
      setLoading(false);
    }
  };
const loadPaymentSettings = async () => {
  try {
    setPaymentSettingsLoading(true);

    const result = await getMyPaymentSettings();

    setPaymentSettings(result?.data || result || null);
  } catch (err) {
    console.error(
      "Failed to load payment settings:",
      err
    );

    setPaymentSettings(null);

    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load payment settings."
    );
  } finally {
    setPaymentSettingsLoading(false);
  }
};

  useEffect(() => {
  loadDeposits();
  loadPaymentSettings();
}, []);

const handleChange = (event) => {
  const { name, value } = event.target;

  if (name === "reference") {
    setForm((current) => ({
      ...current,
      reference: value
        .toUpperCase()
        .replace(/\s/g, ""),
    }));

    return;
  }

  setForm((current) => ({
    ...current,
    [name]: value,
  }));
};
 const validateReference = () => {
  const reference =
    form.reference.trim().toUpperCase();

  if (!reference) {
    return t(
      "deposit.referenceRequired"
    );
  }

  if (form.paymentMethod === "telebirr") {
    if (!/^D[A-Z0-9]{9}$/.test(reference)) {
      return t(
        "deposit.invalidTelebirrReference"
      );
    }
  }

  if (form.paymentMethod === "cbe") {
    if (!/^FT[A-Z0-9]{10}$/.test(reference)) {
      return t(
        "deposit.invalidCbeReference"
      );
    }
  }

  return "";
};

const isValidReference = (
  reference,
  paymentMethod
) => {
  if (!reference) return false;

  if (paymentMethod === "telebirr") {
    return /^D[A-Z0-9]{9}$/.test(
      reference
    );
  }

  if (paymentMethod === "cbe") {
    return /^FT[A-Z0-9]{10}$/.test(
      reference
    );
  }

  return false;
};
const extractTransactionDate = (
  text
) => {

  if (!text) {
    return null;
  }

  /*
   * FORMAT 1
   *
   * 2026/09/04
   * 2026-09-04
   * 2026/09/04 19:00:43
   */

  let match =
    text.match(
      /\b(20\d{2})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?)?\b/
    );

  if (match) {

    const date =
      new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4] || 0),
        Number(match[5] || 0),
        Number(match[6] || 0)
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date;
    }
  }


  /*
   * FORMAT 2
   *
   * 04/09/2026
   * 04-09-2026
   * 04/09/2026 19:00:43
   *
   * DD/MM/YYYY
   */

  match =
    text.match(
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2})(?:\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?)?\b/
    );

  if (match) {

    const day =
      Number(match[1]);

    const month =
      Number(match[2]);

    const year =
      Number(match[3]);

    const hour =
      Number(match[4] || 0);

    const minute =
      Number(match[5] || 0);

    const second =
      Number(match[6] || 0);


    const date =
      new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        second
      );


    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date;
    }
  }


  /*
   * FORMAT 3
   *
   * 07-Aug-2025
   * 07 Aug 2025
   * 07/Aug/2025
   */

  match =
    text.match(
      /\b(\d{1,2})[\s\/-](JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[\s\/-](20\d{2})\b/i
    );


  if (match) {

    const months = {
      JAN: 0,
      FEB: 1,
      MAR: 2,
      APR: 3,
      MAY: 4,
      JUN: 5,
      JUL: 6,
      AUG: 7,
      SEP: 8,
      OCT: 9,
      NOV: 10,
      DEC: 11,
    };


    const date =
      new Date(
        Number(match[3]),
        months[
          match[2].toUpperCase()
        ],
        Number(match[1])
      );


    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date;
    }
  }


  return null;
};

const extractAmountFromScreenshot =
  (
    text
  ) => {

    if (!text) {
      return null;
    }


    const patterns = [

  // Best match:
  // "You have received ETB 22.00"
  /YOU\s+HAVE\s+RECEIVED\s+(?:ETB|BIRR)\s*:?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i,

  // Fallback
  /(?:ETB|BIRR)\s*:?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i,

  // Fallback: "22.00 ETB"
  /([0-9][0-9,]*(?:\.\d{1,2})?)\s*(?:ETB|BIRR)/i,

];


    for (
      const pattern of patterns
    ) {

      const match =
        text.match(pattern);


      if (match?.[1]) {

        const amount =
          Number(
            match[1].replace(
              /,/g,
              ""
            )
          );


        if (
          Number.isFinite(
            amount
          )
        ) {
          return amount;
        }
      }
    }


    return null;
  };
const extractCbeReceiptUrlFromQr =
  async (file) => {
    if (!file) {
      return "";
    }

    const objectUrl =
      URL.createObjectURL(file);

    try {
      const image =
        await new Promise(
          (resolve, reject) => {
            const img =
              new Image();

            img.onload = () =>
              resolve(img);

            img.onerror = () =>
              reject(
                new Error(
                  "Failed to read receipt image"
                )
              );

            img.src =
              objectUrl;
          }
        );

      const canvas =
        document.createElement(
          "canvas"
        );

      const maxSide = 2400;

      const width =
        image.naturalWidth;

      const height =
        image.naturalHeight;

      const scale =
        Math.min(
          1,
          maxSide /
            Math.max(
              width,
              height
            )
        );

      canvas.width =
        Math.max(
          1,
          Math.round(
            width * scale
          )
        );

      canvas.height =
        Math.max(
          1,
          Math.round(
            height * scale
          )
        );

      const context =
        canvas.getContext(
          "2d",
          {
            willReadFrequently:
              true,
          }
        );

      if (!context) {
        return "";
      }

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const imageData =
        context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

      const qr =
        jsQR(
          imageData.data,
          imageData.width,
          imageData.height,
          {
            inversionAttempts:
              "attemptBoth",
          }
        );

      const raw =
        String(
          qr?.data || ""
        ).trim();

      if (!raw) {
        return "";
      }

      try {
        const url =
          new URL(raw);

        const pathname =
          url.pathname.replace(
            /\/+$/,
            ""
          );

        if (
          url.protocol !==
            "https:" ||
          url.hostname.toLowerCase() !==
            "mbreciept.cbe.com.et" ||
          !/^\/v2-[A-Za-z0-9_-]+$/.test(
            pathname
          )
        ) {
          return "";
        }

        return (
          "https://mbreciept.cbe.com.et" +
          pathname
        );
      } catch {
        return "";
      }
    } finally {
      URL.revokeObjectURL(
        objectUrl
      );
    }
  };
const extractReferenceFromScreenshot = async (file) => {
  if (!file) return;

  if (!form.paymentMethod) {
  setOcrError(
    t("deposit.selectTelebirrOrCbe")
  );
  return;
}

if (!file.type.startsWith("image/")) {
  setOcrError(
    t("deposit.uploadImageScreenshot")
  );
  return;
}

  setOcrError("");
  setError("");
  setSuccess("");
  setOcrLoading(true);
  setOcrProgress(0);

  let worker;

let detectedCbeReceiptUrl =
  "";

try {

  if (
    form.paymentMethod ===
    "cbe"
  ) {
    detectedCbeReceiptUrl =
      await extractCbeReceiptUrlFromQr(
        file
      );

    console.log(
      "[CBE QR] detected:",
      Boolean(
        detectedCbeReceiptUrl
      )
    );

    if (
      !detectedCbeReceiptUrl
    ) {
      setOcrError(
        "CBE QR code was not found. Upload the complete CBE receipt image containing the QR code."
      );

      return;
    }
  }

  worker =
    await createWorker(
      "eng"
    );

    await worker.setParameters({
      tessedit_char_whitelist:
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/-:.",
    });

    const result = await worker.recognize(file);

    const text = result.data.text || "";

    console.log("OCR extracted text:", text);

    const normalizedText = text
      .toUpperCase()
      .replace(/\r/g, "\n");

      const detectedAmount =
  extractAmountFromScreenshot(
    normalizedText
  );

console.log(
  "OCR detected amount:",
  detectedAmount
);
      const transactionDate =
  extractTransactionDate(normalizedText);

console.log(
  "OCR detected transaction date:",
  transactionDate
);

    let reference = "";

    // ==========================================
    // TELEBIRR
    // Look specifically for:
    // TransactionNumber DXXXXXXXXX
    // D + 9 alphanumeric characters
    // ==========================================
    if (form.paymentMethod === "telebirr") {
      const transactionNumberMatch =
        normalizedText.match(
          /TRANSACTION\s*NUMBER\s*[:\-]?\s*(D[A-Z0-9]{9})/i
        );

      if (transactionNumberMatch?.[1]) {
        reference = transactionNumberMatch[1]
          .toUpperCase();
      }

      // Fallback: search anywhere in OCR text
      if (!reference) {
        const fallbackMatch =
          normalizedText.match(
            /\b(D[A-Z0-9]{9})\b/
          );

        if (fallbackMatch?.[1]) {
          reference = fallbackMatch[1]
            .toUpperCase();
        }
      }
    }

    // ==========================================
    // CBE
    // Look specifically for:
    // transaction ID: FTXXXXXXXXXX
    // FT + 10 alphanumeric characters
    // ==========================================
    if (form.paymentMethod === "cbe") {
      const transactionIdMatch =
        normalizedText.match(
          /TRANSACTION\s*(?:ID|NUMBER)\s*[:\-]?\s*(FT[A-Z0-9]{10})/i
        );

      if (transactionIdMatch?.[1]) {
        reference = transactionIdMatch[1]
          .toUpperCase();
      }

      // Fallback: search anywhere in OCR text
      if (!reference) {
        const fallbackMatch =
          normalizedText.match(
            /\b(FT[A-Z0-9]{10})\b/
          );

        if (fallbackMatch?.[1]) {
          reference = fallbackMatch[1]
            .toUpperCase();
        }
      }
    }

    console.log(
      "OCR detected transaction reference:",
      reference
    );
/* ==========================================
   TRANSACTION DATE VALIDATION
========================================== */

if (transactionDate) {

  const now =
    new Date();


  const today =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );


  const transactionDay =
    new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      transactionDate.getDate()
    );


  const ageInDays =
    Math.floor(
      (
        today.getTime() -
        transactionDay.getTime()
      ) /
      (
        24 *
        60 *
        60 *
        1000
      )
    );


  if (ageInDays < 0) {

    await worker.terminate();

    worker = null;

    setOcrError(
      t(
        "deposit.tryAnotherDeposit"
      )
    );

    return;
  }


  if (ageInDays >= 5) {

    await worker.terminate();

    worker = null;

    setOcrError(
      t(
        "deposit.tryAnotherDeposit"
      )
    );

    return;
  }
}


    await worker.terminate();
    worker = null;

    // ==========================================
    // FINAL VALIDATION
    // ==========================================
    if (
      !isValidReference(
        reference,
        form.paymentMethod
      )
    ) {
      setOcrError(
  form.paymentMethod === "telebirr"
    ? t("deposit.telebirrReferenceNotFound")
    : t("deposit.cbeReferenceNotFound")
);

      return;
    }

setForm((current) => ({
  ...current,

  reference,

  amount:
    detectedAmount !== null
      ? String(
          detectedAmount
        )
      : current.amount,

  receiptUrl:
    form.paymentMethod ===
    "cbe"
      ? detectedCbeReceiptUrl
      : "",
}));

    setSuccess(
  `${t("deposit.transactionIdFound")}: ${reference}`
);

    setTimeout(() => {
      setSuccess("");
    }, 4000);

  } catch (error) {
    console.error(
      "OCR transaction ID error:",
      error
    );

    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }

    setOcrError(
  t("deposit.screenshotReadFailed")
);

  } finally {
    setOcrLoading(false);
    setOcrProgress(0);
  }
};
const processCbeScreenshot =
  async (file) => {
    try {
      setOcrError("");
      setError("");
      setSuccess("");
      setVerifiedCbe(null);

      setCbeStage(
        "reading_qr"
      );

      /*
       * STEP 1
       * Decode sender QR.
       */
      const receiptUrl =
        await extractCbeReceiptUrlFromQr(
          file
        );

      if (!receiptUrl) {
        setCbeStage(
          "error"
        );

        setOcrError(
          "CBE QR code could not be detected. Upload the complete CBE receipt."
        );

        return;
      }


      /*
       * STEP 2
       * Backend visits official
       * sender CBE receipt page.
       */
      setCbeStage(
        "verifying"
      );

      const verification =
        await verifyCbeReceipt(
          receiptUrl
        );

      const receipt =
        verification?.data;


      const reference =
        String(
          receipt?.reference ||
            ""
        )
          .trim()
          .toUpperCase();


      const amount =
        Number(
          receipt?.transferredAmount
        );


      if (
        !/^FT[A-Z0-9]{10}$/.test(
          reference
        )
      ) {
        throw new Error(
          "CBE transaction ID could not be verified."
        );
      }


      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        throw new Error(
          "CBE transaction amount could not be verified."
        );
      }


      /*
       * STEP 3
       * Store VERIFIED CBE data.
       */
      setForm(
        (current) => ({
          ...current,

          reference,

          amount:
            String(amount),

          receiptUrl,
        })
      );


      setVerifiedCbe({
        reference,

        amount,

        status:
          receipt?.status ||
          "COMPLETED",

        paymentDate:
          receipt?.paymentDate ||
          null,
      });


      setCbeStage(
        "verified"
      );

      setSuccess(
        `CBE payment verified: ${reference}`
      );

    } catch (err) {

      console.error(
        "CBE receipt verification failed:",
        err
      );

      setCbeStage(
        "error"
      );

      setOcrError(
        err?.response?.data
          ?.message ||
          err?.message ||
          "Failed to verify CBE receipt."
      );
    }
  };
const handleScreenshotChange =
  async (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      form.paymentMethod ===
      "cbe"
    ) {
      await processCbeScreenshot(
        file
      );
    } else {
      await extractReferenceFromScreenshot(
        file
      );
    }

    event.target.value = "";
  };
const waitForCbeApproval =
  async (reference) => {

    for (
      let attempt = 0;
      attempt < 20;
      attempt += 1
    ) {
      try {
        const result =
          await getMyDeposits();

        const list =
          Array.isArray(
            result?.data
          )
            ? result.data
            : [];

        const deposit =
          list.find(
            (item) =>
              String(
                item?.reference || ""
              )
                .trim()
                .toUpperCase() ===
              reference
          );

        if (
          deposit?.status ===
          "approved"
        ) {
          setCbeStage(
            "approved"
          );

          setSuccess(
            "CBE deposit approved. Wallet updated successfully."
          );

          await loadDeposits();

          return;
        }

        if (
          deposit?.status ===
          "rejected"
        ) {
          setCbeStage(
            "error"
          );

          setError(
            "CBE deposit was rejected."
          );

          await loadDeposits();

          return;
        }

      } catch (err) {
        console.error(
          "CBE status check failed:",
          err
        );
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            3000
          )
      );
    }

    setSuccess(
      "Payment verified. CBE confirmation is still pending."
    );
  };
  const handleSubmit = async (event) => {
  event.preventDefault();

  setError("");
  setSuccess("");

  const amount = Number(
    form.amount
  );

  const minDeposit = Number(
    paymentSettings?.minDeposit ??
      10
  );

  const maxDeposit = Number(
    paymentSettings?.maxDeposit ??
      10000
  );


  if (
    !amount ||
    amount < minDeposit
  ) {
    setError(
      `${t(
        "deposit.minimumDeposit"
      )} ${minDeposit.toLocaleString()} ${t(
        "common.birr"
      )}.`
    );

    return;
  }


  if (amount > maxDeposit) {
    setError(
      `${t(
        "deposit.maximumDeposit"
      )} ${maxDeposit.toLocaleString()} ${t(
        "common.birr"
      )}.`
    );

    return;
  }


  if (!form.paymentMethod) {
    setError(
      t(
        "deposit.selectPaymentMethod"
      )
    );

    return;
  }


  const selectedPaymentAccount =
    paymentSettings?.[
      form.paymentMethod
    ];


  if (!selectedPaymentAccount) {
    setError(
      t(
        "deposit.paymentDetailsUnavailable"
      )
    );

    return;
  }


  const referenceError =
    validateReference();


  if (referenceError) {
    setError(
      referenceError
    );

    return;
  }


  if (
    form.paymentMethod ===
      "cbe" &&
    !form.receiptUrl
  ) {
    setError(
      "Please upload the complete CBE receipt containing the QR code."
    );

    return;
  }


  if (
    form.paymentMethod ===
      "cbe" &&
    cbeStage !== "verified"
  ) {
    setError(
      "Please verify the CBE receipt before submitting."
    );

    return;
  }


  try {
    setSubmitting(true);


    /*
     * STEP 1
     * Create pending deposit.
     */
    await createDeposit({
      amount,

      paymentMethod:
        form.paymentMethod,

      reference:
        form.reference
          .trim()
          .toUpperCase() ||
        undefined,
    });


    /*
     * ===========================
     * CBE
     * ===========================
     */
    if (
      form.paymentMethod ===
      "cbe"
    ) {
      const submittedReference =
        form.reference
          .trim()
          .toUpperCase();


      /*
       * STEP 2
       * Bind/verify the sender
       * receipt against the
       * pending deposit.
       */
      const verification =
        await approveCbeReceipt(
          form.receiptUrl
        );


      const result =
        verification?.data;


      /*
       * Agent SMS may already
       * have arrived.
       */
      if (
        result?.approved ===
        true
      ) {
        setCbeStage(
          "approved"
        );

        setSuccess(
          "CBE deposit approved. Wallet updated successfully."
        );

        await loadDeposits();

        return;
      }


      /*
       * Sender side is verified.
       * Wait for matching
       * receiver-side CBE SMS.
       */
      setCbeStage(
        "waiting_sms"
      );

      setSuccess(
        result?.reason ||
          "Payment verified. Waiting for matching CBE SMS."
      );


      await loadDeposits();


      /*
       * Continue checking without
       * blocking the UI.
       */
      void waitForCbeApproval(
        submittedReference
      );

      return;
    }


    /*
     * ===========================
     * TELEBIRR
     * Existing flow unchanged.
     * ===========================
     */
    setSuccess(
      t(
        "deposit.requestSubmitted"
      )
    );


    setForm({
      amount: "",
      paymentMethod: "",
      reference: "",
      receiptUrl: "",
    });


    await loadDeposits();

  } catch (err) {
    console.error(
      "Deposit submission failed:",
      err
    );


    setError(
      err?.response?.data
        ?.message ||
        err?.message ||
        "Failed to submit deposit request."
    );

  } finally {
    setSubmitting(false);
  }
};
 if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <RefreshCw
            size={20}
            className="spin"
          />
          {t("Deposit.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="player-page deposit-page">
      <div className="page-header">
        <MobileBackHeader title="Deposit" />
      </div>

      <div className="deposit-layout">
        <section className="deposit-card">
          <div className="card-title">
            <div className="title-icon">
              <ArrowDownToLine size={18} />
            </div>

            <div>
              <h2>{t("deposit.depositFunds")}</h2>

<p>
  {t("deposit.depositDescription")}
</p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <XCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            

            <div className="form-group">
  <label>
  {t("deposit.paymentMethod")} <span>*</span>
</label>

  <div className="payment-methods">
  {Object.values(PAYMENT_METHOD_META).map((method) => {
    const account = paymentSettings?.[method.value];

    const available = Boolean(account);

    return (
      <button
        type="button"
        key={method.value}
        className={`payment-method ${
          form.paymentMethod === method.value
            ? "selected"
            : ""
        } ${!available ? "disabled" : ""}`}
        onClick={() => {
          if (!available) return;

          setForm((current) => ({
  ...current,
  paymentMethod: method.value,
  reference: "",
  receiptUrl: "",
  amount: "",
}));

setCbeStage("idle");
setVerifiedCbe(null);

setOcrError("");
setError("");
setSuccess("");
        }}
        disabled={
          submitting ||
          paymentSettingsLoading ||
          !available
        }
      >
        <div className="payment-icon payment-logo">
          <img
            src={method.icon}
            alt={method.label}
          />
        </div>

        <div className="payment-info">
          <strong>{method.label}</strong>

          <span>
            {paymentSettingsLoading
  ? t("deposit.loadingPaymentDetails")
  : available
  ? t(method.descriptionKey)
  : t("common.notAvailable")}
          </span>
        </div>

        <div className="payment-radio">
          {form.paymentMethod === method.value && (
            <CheckCircle2 size={18} />
          )}
        </div>
      </button>
    );
  })}
</div>
<div className="form-group">
              <label htmlFor="amount">
  {t("deposit.amount")} <span>*</span>
</label>
              <div className="input-with-suffix">
  <input
    id="amount"
    name="amount"
    type="number"
    min={paymentSettings?.minDeposit ?? 10}
    max={paymentSettings?.maxDeposit ?? 10000}
    step="0.01"
    placeholder={t("deposit.enterAmount")}
    value={form.amount}
    onChange={handleChange}
    disabled={
  submitting ||
  (
    form.paymentMethod ===
      "cbe" &&
    (
      cbeStage ===
        "verified" ||
      cbeStage ===
        "waiting_sms" ||
      cbeStage ===
        "approved"
    )
  )
}
  />

  <span>ETB</span>
</div>

<small className="deposit-limit">
  {t("deposit.deposit")} - {t("deposit.min")}{" "}
  {Number(
    paymentSettings?.minDeposit ?? 10
  ).toLocaleString()}{" "}
  {t("common.birr")}{" "}
  {t("deposit.max")}{" "}
  {Number(
    paymentSettings?.maxDeposit ?? 10000
  ).toLocaleString()}{" "}
  {t("common.birr")}
</small>
            </div>
{/* Selected payment account */}
{form.paymentMethod && (
  <div className="deposit-payment-account">
    <div className="deposit-payment-account-header">
      <div>
        <strong>
          {form.paymentMethod === "telebirr"
  ? t("deposit.telebirrPaymentNumber")
  : t("deposit.cbeAccountNumber")}
        </strong>

        <span>
  {t("deposit.sendToAccount")}
</span>
      </div>
    </div>

    <div className="deposit-payment-account-value">
      <div className="payment-account-number">
        {paymentSettings?.[form.paymentMethod] || "-"}
      </div>

      <button
        type="button"
        className="copy-payment-account"
        onClick={async () => {
          const account =
            paymentSettings?.[form.paymentMethod];

          if (!account) return;

          try {
            await navigator.clipboard.writeText(account);

           setSuccess(
  t("deposit.accountCopied")
);

            setTimeout(() => {
              setSuccess("");
            }, 2500);
          } catch (error) {
            console.error(
              "Failed to copy account:",
              error
            );
          }
        }}
      >
        {t("common.copy")}
      </button>
    </div>
  </div>
)}
</div>

            {form.paymentMethod !==
  "cbe" && (
  <div className="form-group">
    <label htmlFor="reference">
      {t(
        "deposit.transactionReference"
      )}
      <span>*</span>
    </label>

    <input
      id="reference"
      name="reference"
      type="text"
      value={form.reference}
      onChange={handleChange}
      disabled={
        submitting ||
        !form.paymentMethod
      }
      maxLength={10}
      placeholder={t(
        "deposit.telebirrReferenceExample"
      )}
      autoComplete="off"
    />
  </div>
)}
{/* ======================================================
    TELEBIRR SCREENSHOT UPLOAD
   ====================================================== */}

{form.paymentMethod ===
  "telebirr" && (
  <div className="deposit-ocr-section">

    <div className="deposit-upload-action">

      <input
        id="telebirr-screenshot"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={
          handleScreenshotChange
        }
        disabled={
          ocrLoading ||
          submitting
        }
        hidden
      />

      <label
        htmlFor="telebirr-screenshot"
        className={`deposit-upload-button ${
          ocrLoading
            ? "upload-button-loading"
            : ""
        }`}
      >

        {ocrLoading ? (
          <>
            <Loader2
              size={16}
              className="spin"
            />

            <div className="ocr-loading-text">
              <span>
                {t(
                  "deposit.readingScreenshot"
                )}
              </span>
            </div>
          </>
        ) : (
          <>
            <span>
              {t(
                "deposit.uploadScreenshot"
              )}
            </span>
          </>
        )}

      </label>

    </div>


    {ocrError && (
      <div className="deposit-ocr-error">

        <XCircle size={16} />

        <span>
          {ocrError}
        </span>

      </div>
    )}

  </div>
)}
{form.paymentMethod ===
  "cbe" && (
  <div className="cbe-flow-card">

      <div className="cbe-upload-content">
        <input
          id="cbe-receipt-image"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={
            handleScreenshotChange
          }
          disabled={
  cbeStage ===
    "reading_qr" ||
  cbeStage ===
    "verifying" ||
  cbeStage ===
    "waiting_sms" ||
  cbeStage ===
    "approved" ||
  submitting
}
          hidden
        />


        <label
          htmlFor="cbe-receipt-image"
          className="deposit-upload-button"
        >
          {cbeStage ===
            "reading_qr" ? (
            <>
              <Loader2
                size={17}
                className="spin"
              />

              wait...
            </>
          ) : cbeStage ===
            "verifying" ? (
            <>
              <Loader2
                size={17}
                className="spin"
              />

              Verifying with CBE...
            </>
          ) : (
            <>
              Upload screenshot
            </>
          )}
        </label>
      </div>
  </div>
)}
            <button
              type="submit"
              className="submit-deposit-btn"
              disabled={
  submitting ||
  paymentSettingsLoading ||
  (
    form.paymentMethod === "cbe" &&
    cbeStage !== "verified"
  )
}
            >
              {submitting ? (
                <>
                  <Loader2
                    size={18}
                    className="spin"
                  />
                 {t("deposit.submitting")}
                </>
              ) : (
                <>
                  <Send size={18} />
                 {t("deposit.sendRequest")}
                </>
              )}
            </button>
          </form>
        </section>
        <section className="deposit-info-card">
  <div className="info-icon">
    <CreditCard size={21} />
  </div>
  <h3>{t("deposit.howDepositsWork")}</h3>
  <div className="steps">
    <div className="step">
      <span>1</span>
      <div>
        <strong>
          {t("deposit.chooseMethod")}
        </strong>
        <p>
          {t("deposit.chooseMethodDescription")}
        </p>
      </div>
    </div>

    <div className="step">
      <span>2</span>

      <div>
        <strong>
          {t("deposit.submitRequest")}
        </strong>

        <p>
          {t("deposit.submitRequestDescription")}
        </p>
      </div>
    </div>

    <div className="step">
      <span>3</span>

      <div>
        <strong>
          {t("deposit.agentVerification")}
        </strong>

        <p>
          {t("deposit.agentVerificationDescription")}
        </p>
      </div>
    </div>

    <div className="step">
      <span>4</span>

      <div>
        <strong>
          {t("deposit.balanceUpdated")}
        </strong>

        <p>
          {t("deposit.balanceUpdatedDescription")}
        </p>
      </div>
    </div>
  </div>
</section>
      </div>

      <section className="deposits-history">
        <div className="history-header">
  <div>
    <h2>
      {t("deposit.myDepositRequests")}
    </h2>

    <p>
      {t("deposit.trackRequests")}
    </p>
  </div>

  <span className="deposit-count">
    {deposits.length}{" "}
    {deposits.length === 1
      ? t("deposit.request")
      : t("deposit.requests")}
  </span>
</div>

        {loading ? (
          <div className="empty-state">
            <Loader2 size={28} className="spin" />
            <p>{t("deposit.loadingRequests")}</p>
          </div>
        ) : deposits.length === 0 ? (
          <div className="empty-state">
            <ArrowDownToLine size={32} />
            <h3>{t("deposit.noRequests")}</h3>

<p>
  {t("deposit.requestsAppearHere")}
</p>
          </div>
        ) : (
          <div className="deposit-list">
            {deposits.map((deposit) => (
              <div
                className="deposit-row"
                key={deposit._id}
              >
                <div className="deposit-method-icon payment-logo">
  <img
    src={
      PAYMENT_METHOD_META[
        deposit.paymentMethod
      ]?.icon
    }
    alt={
      PAYMENT_METHOD_META[
        deposit.paymentMethod
      ]?.label || "Payment"
    }
  />
</div>

                <div className="deposit-main">
                  <strong>
                    {deposit.paymentMethod
                      ?.toUpperCase()}
                  </strong>

                  <span>
                    {formatDate(deposit.createdAt)}
                  </span>

                  {deposit.reference && (
                    <small>
                      {t("deposit.ref")}: {deposit.reference}
                    </small>
                  )}
                </div>

                <div className="deposit-amount">
                  <strong>
                    +{formatAmount(deposit.amount)} ETB
                  </strong>
                </div>

                <div
                  className={`deposit-status ${deposit.status}`}
                >
                  {getStatusIcon(deposit.status)}
                  <span>
  {deposit.status === "approved"
    ? t("deposit.statusApproved")
    : deposit.status === "rejected"
    ? t("deposit.statusRejected")
    : t("deposit.statusPending")}
</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Deposit;