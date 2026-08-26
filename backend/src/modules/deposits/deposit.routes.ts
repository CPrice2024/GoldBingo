import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";

import {
  createDepositRequest,
  getMyDeposits,
  getMyPaymentSettings,
  getPendingAgentDeposits,
  approveDepositRequest,

} from "./deposit.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  createDepositRequest
);

router.get(
  "/my",
  getMyDeposits
);

router.get(
  "/payment-settings",
  getMyPaymentSettings
);

router.get(
  "/pending",
  getPendingAgentDeposits
);

router.patch(
  "/:id/approve",
  approveDepositRequest
);

export default router;