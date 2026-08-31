import {
  Request,
  Response,
} from "express";
import crypto
  from "crypto";
import mongoose
  from "mongoose";
import {
  normalizePhone,
  generateOTP,
  hashOTP,
  OTP_EXPIRES_MINUTES,
} from "./otp.service";
import {
  sendSMS,
} from "../services/sms.service";
import OTPRequest
  from "./otp.model";

import {
  User,
} from "../modules/users/user.model";

export async function requestOTP(
  req: Request,
  res: Response
) {
  try {

    const {
      phone,
    } = req.body;


    /* =================================
       PHONE REQUIRED
    ================================= */

    if (
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Phone number is required",
        });
    }


    /* =================================
       NORMALIZE PHONE
    ================================= */

    const normalizedPhone =
      normalizePhone(
        phone
      );


    const localPhone =
      normalizedPhone.replace(
        "+251",
        "0"
      );


    /* =================================
       FIND REGISTERED PLAYER
    ================================= */

    const player =
      await User.findOne({
        role:
          "player",

        $or: [
          {
            phone:
              normalizedPhone,
          },
          {
            phone:
              localPhone,
          },
          {
            phone:
              phone.trim(),
          },
        ],
      }).select(
        "_id fullName phone status"
      );


    if (!player) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "No player account is registered with this phone number",
        });
    }


    if (
      player.status !==
      "active"
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "This player account is not active",
        });
    }


    const now =
      new Date();


    /* =================================
       EXPIRE OLD OTP
    ================================= */

    await OTPRequest.updateMany(
      {
        playerId:
          player._id,

        purpose:
          "forgot_password",

        status:
          "approved",

        expiresAt: {
          $lte: now,
        },
      },
      {
        $set: {
          status:
            "expired",

          codeHash:
            null,
        },
      }
    );


    /* =================================
       CHECK ACTIVE OTP
    ================================= */

    const existingApproved =
      await OTPRequest.findOne({
        playerId:
          player._id,

        purpose:
          "forgot_password",

        status:
          "approved",

        expiresAt: {
          $gt: now,
        },
      }).sort({
        approvedAt: -1,
      });


    /*
     * Do NOT send another SMS
     * while the existing OTP
     * is still valid.
     */
    if (
      existingApproved
    ) {
      return res
        .status(200)
        .json({
          success: true,

          message:
            "OTP already sent. Check your phone and enter the verification code.",

          data: {
            requestId:
              existingApproved._id,

            phone:
              existingApproved.phone,

            status:
              "approved",

            approvedAt:
              existingApproved.approvedAt,

            expiresAt:
              existingApproved.expiresAt,
          },
        });
    }


    /* =================================
       GENERATE OTP
    ================================= */

    const code =
      generateOTP();


    const codeHash =
      hashOTP(
        code
      );


    const expiresAt =
      new Date(
        now.getTime() +
          OTP_EXPIRES_MINUTES *
            60 *
            1000
      );


    /* =================================
       CHECK OLD PENDING REQUEST
    ================================= */

    let otpRequest =
      await OTPRequest.findOne({
        playerId:
          player._id,

        purpose:
          "forgot_password",

        status:
          "pending_admin",
      }).sort({
        requestedAt: -1,
      });


    /*
     * If an old pending request exists
     * from the previous admin flow,
     * reuse it instead of creating
     * another MongoDB record.
     */
    if (
      otpRequest
    ) {

      otpRequest.status =
        "approved";

      otpRequest.codeHash =
        codeHash;

      otpRequest.attempts =
        0;

      otpRequest.approvedAt =
        now;

      otpRequest.expiresAt =
        expiresAt;

      otpRequest.approvedBy =
        null;


      await otpRequest.save();

    } else {

      /* =================================
         CREATE AUTO-APPROVED REQUEST
      ================================= */

      otpRequest =
        await OTPRequest.create({
          playerId:
            player._id,

          phone:
            normalizedPhone,

          purpose:
            "forgot_password",

          codeHash,

          status:
            "approved",

          attempts:
            0,

          requestedAt:
            now,

          approvedAt:
            now,

          expiresAt,
        });

    }


    /* =================================
       SEND OTP SMS AUTOMATICALLY
    ================================= */

    const message =
      `Your Gold Bingo password reset code is ${code}. ` +
      `This code expires in ${OTP_EXPIRES_MINUTES} minutes. ` +
      `Do not share this code with anyone.`;


    try {

      await sendSMS({
        phone:
          normalizedPhone,

        message,
      });

    } catch (
      smsError: any
    ) {

      console.error(
        "[OTP] Automatic SMS sending failed:",
        smsError
      );


      /*
       * OTP must not remain usable
       * when SMS sending fails.
       */
      otpRequest.status =
        "expired";

      otpRequest.codeHash =
        null;

      otpRequest.expiresAt =
        null;


      await otpRequest.save();


      return res
        .status(502)
        .json({
          success: false,
          message:
            "OTP could not be sent. Please try again.",
        });
    }


    console.log(
      `[OTP] OTP automatically sent for request ${otpRequest._id}`
    );


    /* =================================
       RESPONSE
    ================================= */

    return res
      .status(200)
      .json({
        success: true,

        message:
          "OTP sent successfully. Check your phone.",

        data: {
          requestId:
            otpRequest._id,

          phone:
            normalizedPhone,

          status:
            "approved",

          approvedAt:
            now,

          expiresAt,
        },
      });

  } catch (
    error: any
  ) {

    console.error(
      "[OTP] Request error:",
      error
    );


    return res
      .status(500)
      .json({
        success: false,

        message:
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

    const {
      phone,
      code,
    } = req.body;


    if (
      typeof phone !== "string" ||
      !phone.trim() ||
      !code
    ) {

      return res
        .status(400)
        .json({
          success: false,
          message:
            "Phone number and OTP are required",
        });

    }


    if (
      !/^\d{6}$/.test(
        String(code)
      )
    ) {

      return res
        .status(400)
        .json({
          success: false,
          message:
            "OTP must be 6 digits",
        });

    }


    const normalizedPhone =
      normalizePhone(
        phone
      );


    /* ================================
       FIND APPROVED OTP
    ================================= */

    const otpRequest =
      await OTPRequest.findOne({

        phone:
          normalizedPhone,

        purpose:
          "forgot_password",

        status:
          "approved",

      }).sort({
        approvedAt: -1,
      });


    if (!otpRequest) {

      return res
        .status(404)
        .json({
          success: false,
          message:
            "No approved OTP request was found",
        });

    }


    /* ================================
       CHECK EXPIRATION
    ================================= */

    if (
      !otpRequest.expiresAt ||
      otpRequest.expiresAt.getTime() <
        Date.now()
    ) {

      otpRequest.status =
        "expired";

      otpRequest.codeHash =
        null;

      await otpRequest.save();


      return res
        .status(400)
        .json({
          success: false,
          message:
            "OTP has expired",
        });

    }


    /* ================================
       CHECK ATTEMPTS
    ================================= */

    if (
      otpRequest.attempts >= 5
    ) {

      otpRequest.status =
        "expired";

      otpRequest.codeHash =
        null;

      await otpRequest.save();


      return res
        .status(429)
        .json({
          success: false,
          message:
            "Too many incorrect OTP attempts",
        });

    }


    /* ================================
       VERIFY OTP HASH
    ================================= */

    const incomingHash =
      hashOTP(
        String(code)
      );


    if (
      incomingHash !==
      otpRequest.codeHash
    ) {

      otpRequest.attempts += 1;

      await otpRequest.save();


      return res
        .status(400)
        .json({

          success: false,

          message:
            "Invalid OTP",

          attemptsRemaining:
            Math.max(
              0,
              5 -
                otpRequest.attempts
            ),

        });

    }


    /* ================================
       CREATE PASSWORD RESET TOKEN
    ================================= */

    const resetToken =
      crypto
        .randomBytes(32)
        .toString("hex");


    const resetTokenHash =
      crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");


    const now =
      new Date();


    otpRequest.status =
      "verified";

    otpRequest.verifiedAt =
      now;

    otpRequest.codeHash =
      null;

    otpRequest.resetTokenHash =
      resetTokenHash;

    otpRequest.resetTokenExpiresAt =
      new Date(
        now.getTime() +
          10 * 60 * 1000
      );


    await otpRequest.save();


    return res
      .status(200)
      .json({

        success: true,

        message:
          "OTP verified successfully",

        data: {

          resetToken,

          expiresIn:
            600,

        },

      });

  } catch (error: any) {

    console.error(
      "[OTP] Verification error:",
      error
    );


    return res
      .status(500)
      .json({

        success: false,

        message:
          error.message ||
          "OTP verification failed",

      });

  }
}

export async function getPendingOTPRequests(
  req: Request,
  res: Response
) {
  try {

    const requests =
      await OTPRequest.find({
        purpose:
          "forgot_password",

        status:
          "pending_admin",
      })
        .populate({
          path:
            "playerId",

          select:
            "fullName phone status",
        })
        .sort({
          requestedAt: -1,
        });


    return res
      .status(200)
      .json({

        success: true,

        data:
          requests.map(
            (request: any) => ({

              requestId:
                request._id,

              player: {
                id:
                  request.playerId?._id,

                fullName:
                  request.playerId
                    ?.fullName ||
                  "Player",

                phone:
                  request.playerId
                    ?.phone ||
                  request.phone,

                status:
                  request.playerId
                    ?.status,
              },

              purpose:
                request.purpose,

              status:
                request.status,

              requestedAt:
                request.requestedAt,

            })
          ),

      });

  } catch (error: any) {

    console.error(
      "[OTP] Pending requests error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to load OTP requests",
      });

  }
}

export async function approveOTPRequest(
  req: Request,
  res: Response
) {
  try {

   const requestIdParam =
  req.params.requestId;

const requestId =
  Array.isArray(
    requestIdParam
  )
    ? requestIdParam[0]
    : requestIdParam;


    const adminId =
      req.user?.userId;


    if (!adminId) {

      return res
        .status(401)
        .json({
          success: false,
          message:
            "Admin authentication required",
        });

    }


    if (
  !requestId ||
  !mongoose.Types.ObjectId
    .isValid(requestId)
) {
  return res
    .status(400)
    .json({
      success: false,
      message:
        "Invalid OTP request ID",
    });
}


    /* ================================
       GENERATE OTP
    ================================= */

    const code =
  generateOTP();


const codeHash =
  hashOTP(code);

    const now =
      new Date();

    const expiresAt =
      new Date(
        now.getTime() +
          OTP_EXPIRES_MINUTES *
            60 *
            1000
      );


    /* ================================
       ATOMIC ADMIN APPROVAL
    ================================= */

    const otpRequest =
      await OTPRequest
        .findOneAndUpdate(
          {
            _id:
              requestId,

            purpose:
              "forgot_password",

            status:
              "pending_admin",
          },
          {
            $set: {

              status:
                "approved",

              codeHash,

              attempts:
                0,

              approvedAt:
                now,

              approvedBy:
                adminId,

              expiresAt,

            },
          },
          {
            returnDocument: "after",
          }
        );


    if (!otpRequest) {

      return res
        .status(409)
        .json({
          success: false,
          message:
            "OTP request was not found or has already been processed",
        });

    }


    /* ================================
       SEND OTP TO REGISTERED PHONE
    ================================= */

    const message =
      `Your Gold Bingo password reset code is ${code}. ` +
      `This code expires in ${OTP_EXPIRES_MINUTES} minutes. ` +
      `Do not share this code with anyone.`;


    try {

      await sendSMS({
        phone:
          otpRequest.phone,

        message,
      });

    } catch (smsError: any) {

      console.error(
        "[OTP] SMS sending failed:",
        smsError
      );


      /*
       * Put request back into pending
       * state if SMS could not be sent.
       */
      await OTPRequest.updateOne(
        {
          _id:
            otpRequest._id,

          status:
            "approved",
        },
        {
          $set: {
            status:
              "pending_admin",

            codeHash:
              null,

            approvedAt:
              null,

            approvedBy:
              null,

            expiresAt:
              null,

            attempts:
              0,
          },
        }
      );


      return res
        .status(502)
        .json({
          success: false,
          message:
            "OTP approval succeeded but SMS could not be sent. Request returned to pending.",
        });

    }


    console.log(
      `[OTP] Request ${otpRequest._id} approved by admin`
    );


    return res
      .status(200)
      .json({

        success: true,

        message:
          "OTP approved and sent to the player's registered phone.",

        data: {

          requestId:
            otpRequest._id,

          status:
            "approved",

          expiresAt,

        },

      });

  } catch (error: any) {

    console.error(
      "[OTP] Approval error:",
      error
    );


    return res
      .status(500)
      .json({

        success: false,

        message:
          error.message ||
          "Failed to approve OTP request",

      });

  }
}

export async function getOTPRequestStatus(
  req: Request,
  res: Response
) {
  try {

    const requestIdParam =
      req.params.requestId;

    const requestId =
      Array.isArray(
        requestIdParam
      )
        ? requestIdParam[0]
        : requestIdParam;


    const phoneParam =
      req.query.phone;

    const phone =
      Array.isArray(phoneParam)
        ? phoneParam[0]
        : phoneParam;


    if (
      !requestId ||
      !mongoose.Types.ObjectId
        .isValid(requestId)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid OTP request ID",
        });
    }


    if (
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Phone number is required",
        });
    }


    const normalizedPhone =
      normalizePhone(
        phone
      );


    const otpRequest =
      await OTPRequest.findOne({
        _id:
          requestId,

        phone:
          normalizedPhone,

        purpose:
          "forgot_password",
      }).select(
        "status approvedAt expiresAt rejectedAt verifiedAt usedAt"
      );


    if (!otpRequest) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "OTP request not found",
        });
    }


    /*
     * If an approved OTP already expired,
     * update its state automatically.
     */
    if (
      otpRequest.status ===
        "approved" &&
      otpRequest.expiresAt &&
      otpRequest.expiresAt.getTime() <=
        Date.now()
    ) {

      otpRequest.status =
        "expired";

      otpRequest.codeHash =
        null;

      await otpRequest.save();

    }


    return res
      .status(200)
      .json({
        success: true,

        data: {
          requestId:
            otpRequest._id,

          status:
            otpRequest.status,

          approvedAt:
            otpRequest.approvedAt,

          expiresAt:
            otpRequest.expiresAt,
        },
      });

  } catch (error: any) {

    console.error(
      "[OTP] Status error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to check OTP request status",
      });

  }
}