import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";

import { getMyWallet } from "./wallet.controller";

const router = Router();

router.use(authenticate);

router.get("/me", getMyWallet);

export default router;