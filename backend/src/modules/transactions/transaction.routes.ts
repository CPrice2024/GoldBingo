import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../auth/auth.middleware";

import {
  getMyTransactions,
  getAllTransactionsController,
} from "./transaction.controller";

const router = Router();


// =========================
// PLAYER
// =========================

router.get(
  "/me",
  authenticate,
  getMyTransactions
);


// =========================
// ADMIN
// =========================

router.get(
  "/admin",
  authenticate,
  authorize("admin"),
  getAllTransactionsController
);

export default router;