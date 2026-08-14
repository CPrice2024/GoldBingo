import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../auth/auth.middleware";

import {
  getMyProfile,
  getMyPlayers,
  getMyStats,
} from "./agent.controller";

const router = Router();

router.use(
  authenticate,
  authorize("agent")
);

router.get("/me", getMyProfile);

router.get("/players", getMyPlayers);

router.get("/stats", getMyStats);

export default router;