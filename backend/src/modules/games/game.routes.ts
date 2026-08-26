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
  callNumber,
  getGameStateController,
  checkBingoController,
  claimBingoController,
  getGameWinnersController,
  getCurrentGameController,
  updateGameController,
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

// Admin: call Bingo number
router.post(
  "/:id/call-number",
  authenticate,
  authorize("admin"),
  callNumber
);

// Player: check Bingo
router.post(
  "/:id/check-bingo",
  authenticate,
  authorize("player"),
  checkBingoController
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