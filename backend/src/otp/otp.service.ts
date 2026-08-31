import crypto from "crypto";

interface OTPRecord {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

const otpStore = new Map<string, OTPRecord>();

export const OTP_EXPIRES_MINUTES =
  Number(
    process.env.OTP_EXPIRES_MINUTES ||
      5
  );

const OTP_MAX_ATTEMPTS = Number(
  process.env.OTP_MAX_ATTEMPTS || 5
);

const OTP_RESEND_SECONDS = Number(
  process.env.OTP_RESEND_SECONDS || 60
);

export function normalizePhone(
  phone: string
): string {
  let value = phone.trim().replace(/\s+/g, "");

  if (value.startsWith("09")) {
    value = "+251" + value.substring(1);
  }

  if (value.startsWith("9")) {
    value = "+251" + value;
  }

  if (!value.startsWith("+251")) {
    throw new Error("Invalid Ethiopian phone number");
  }

  if (!/^\+2519\d{8}$/.test(value)) {
    throw new Error("Invalid Ethiopian phone number");
  }

  return value;
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOTP(
  code: string
): string {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
}

export function createOTP(phone: string) {
  const normalizedPhone = normalizePhone(phone);

  const existing = otpStore.get(normalizedPhone);

  const now = Date.now();

  if (
    existing &&
    now - existing.lastSentAt <
      OTP_RESEND_SECONDS * 1000
  ) {
    const remaining = Math.ceil(
      (OTP_RESEND_SECONDS * 1000 -
        (now - existing.lastSentAt)) /
        1000
    );

    throw new Error(
      `Please wait ${remaining} seconds before requesting another OTP`
    );
  }

  const code = generateOTP();

  const record: OTPRecord = {
    codeHash: hashOTP(code),
    expiresAt:
      now + OTP_EXPIRES_MINUTES * 60 * 1000,
    attempts: 0,
    lastSentAt: now,
  };

  otpStore.set(normalizedPhone, record);

  return {
    phone: normalizedPhone,
    code,
    expiresAt: record.expiresAt,
  };
}

export function verifyOTP(
  phone: string,
  code: string
) {
  const normalizedPhone =
    normalizePhone(phone);

  const record =
    otpStore.get(
      normalizedPhone
    );

  if (!record) {
    return {
      success: false,
      message:
        "OTP not found or already used",
    };
  }

  if (
    Date.now() >
    record.expiresAt
  ) {
    otpStore.delete(
      normalizedPhone
    );

    return {
      success: false,
      message:
        "OTP has expired",
    };
  }

  if (
    record.attempts >=
    OTP_MAX_ATTEMPTS
  ) {
    otpStore.delete(
      normalizedPhone
    );

    return {
      success: false,
      message:
        "Too many incorrect attempts",
    };
  }

  record.attempts++;

  const incomingHash =
    hashOTP(code);

  if (
    incomingHash !==
    record.codeHash
  ) {
    return {
      success: false,
      message:
        "Invalid OTP",
      attemptsRemaining:
        OTP_MAX_ATTEMPTS -
        record.attempts,
    };
  }

  otpStore.delete(
    normalizedPhone
  );

  return {
    success: true,
    message:
      "Phone number verified successfully",
  };
}