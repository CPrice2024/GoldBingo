import {
  Router,
} from "express";

import {
  requestOTP,
  verifyOTPCode,
  getPendingOTPRequests,
  approveOTPRequest,
   getOTPRequestStatus,
} from "./otp.controller";

import {
  authenticate,
  authorize,
} from "../modules/auth/auth.middleware";


const router =
  Router();


/* =================================
   PLAYER OTP
================================= */

router.post(
  "/request",
  requestOTP
);

router.post(
  "/verify",
  verifyOTPCode
);

router.get(
  "/status/:requestId",
  getOTPRequestStatus
);
/* =================================
   ADMIN OTP MANAGEMENT
================================= */

router.get(
  "/admin/pending",
  authenticate,
  authorize("admin"),
  getPendingOTPRequests
);


router.patch(
  "/admin/:requestId/approve",
  authenticate,
  authorize("admin"),
  approveOTPRequest
);


export default router;