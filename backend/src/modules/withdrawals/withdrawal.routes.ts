import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../auth/auth.middleware";

import {
  createWithdrawal,
  getMyWithdrawals,
  getAgentWithdrawals,
  getWithdrawalById,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
} from "./withdrawal.controller";

const router = Router();

router.use(authenticate);

/*
 * PLAYER
 */

router.post(
  "/",
  authorize("player"),
  createWithdrawal
);

router.get(
  "/me",
  authorize("player"),
  getMyWithdrawals
);

/*
 * AGENT
 */

router.get(
  "/agent/pending",
  authorize("agent"),
  getAgentWithdrawals
);

router.get(
  "/:id",
  getWithdrawalById
);

router.patch(
  "/:id/approve",
  authorize("agent"),
  approveWithdrawalRequest
);

router.patch(
  "/:id/reject",
  authorize("agent"),
  rejectWithdrawalRequest
);

export default router;