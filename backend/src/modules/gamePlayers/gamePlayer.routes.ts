import { Router } from "express";

import { authenticate } from "../auth/auth.middleware";

import {
  joinGameController,
  listGamePlayers,
  getMyGame,
  getGamePlayerCountController,
} from "./gamePlayer.controller";

const router = Router();

router.use(authenticate);

// Player joins a game
router.post(
  "/join",
  joinGameController
);

// List players in a game
router.get(
  "/game/:gameId",
  listGamePlayers
);

// Get current player's participation
router.get(
  "/game/:gameId/me",
  getMyGame
);

// Count players in a game
router.get(
  "/game/:gameId/count",
  getGamePlayerCountController
);

export default router;