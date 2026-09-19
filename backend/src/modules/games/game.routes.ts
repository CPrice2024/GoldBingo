import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../auth/auth.middleware";

import {
  createGame,
  listGames,
  getGameById,
  startGameController,
  cancelGameController,
  callNumber,
  getGameStateController,
  claimBingoController,
  getGameWinnersController,
  getCurrentGameController,
  updateGameController,
  cancelActiveGameController,
} from "./game.controller";

const router = Router();

// Public: list games
router.get(
  "/",
  listGames
);

// Public: get current active Bingo game
// MUST be before /:id
router.get(
  "/current",
  getCurrentGameController
);

// Admin: create a game
router.post(
  "/",
  authenticate,
  authorize("admin"),
  createGame
);
// Admin: update waiting game
/* Player: winner information */
router.post(
  "/:id/cancel-active",
  authenticate,
  authorize("admin"),
  cancelActiveGameController
);
router.get(
  "/:id/winners",
  authenticate,
  authorize("player"),
  getGameWinnersController
);
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  updateGameController
);

// Admin: start a game
router.post(
  "/:id/start",
  authenticate,
  authorize("admin"),
  startGameController
);
router.post(
  "/:id/cancel",
  authenticate,
  authorize("admin"),
  cancelGameController
);
router.post(
  "/:id/call-number",
  authenticate,
  authorize("admin"),
  callNumber
);


// Player: claim Bingo
router.post(
  "/:id/claim-bingo",
  authenticate,
  authorize("player"),
  claimBingoController
);

// Public: get game state
router.get(
  "/:id/state",
  getGameStateController
);

// Public: get one game
router.get(
  "/:id",
  getGameById
);

export default router;