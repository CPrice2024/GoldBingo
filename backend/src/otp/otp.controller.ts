import { Request, Response } from "express";
import {
  createOTP,
  verifyOTP,
} from "./otp.service";
import { sendSMS } from "../services/sms.service";

export async function requestOTP(
  req: Request,
  res: Response
) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const otp = createOTP(phone);

    const message = `Your Gold Bingo verification code is ${otp.code}. This code expires in 5 minutes. Do not share this code with anyone.`;

    await sendSMS({
      phone: otp.phone,
      message,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      phone: otp.phone,
      expiresIn: 300,
    });
  } catch (error: any) {
    console.error(
      "OTP request error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.response?.data ||
        error.message ||
        "Failed to send OTP",
    });
  }
}

export async function verifyOTPCode(
  req: Request,
  res: Response
) {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number and OTP are required",
      });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be 6 digits",
      });
    }

    const result = verifyOTP(phone, code);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(
      "OTP verification error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "OTP verification failed",
    });
  }
}