import { Router } from "express";
import {
  requestOTP,
  verifyOTPCode,
} from "./otp.controller";

const router = Router();

router.post("/request", requestOTP);
router.post("/verify", verifyOTPCode);

export default router;