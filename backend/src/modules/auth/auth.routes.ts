import { Router } from "express";

import {
  register,
  loginUser,
  changePassword,
  resetPassword,
} from "./auth.controller";

import { authenticate } from "./auth.middleware";

const router = Router();

router.post("/register", register);

router.post("/login", loginUser);

router.post(
  "/reset-password",
  resetPassword
);

router.patch(
  "/change-password",
  authenticate,
  changePassword
);

export default router;