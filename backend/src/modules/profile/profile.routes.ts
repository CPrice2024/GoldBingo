import { Router } from "express";

import {
  authenticate,
} from "../auth/auth.middleware";

import {
  getMyProfile,
} from "./profile.controller";

const router = Router();

router.use(authenticate);

router.get(
  "/me",
  getMyProfile
);

export default router;