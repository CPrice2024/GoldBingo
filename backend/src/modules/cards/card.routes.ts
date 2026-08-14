import { Router } from "express";

import {
  createCard,
  generateCard,
  listCards,
  getCardById,
  getCardByCardNumber,
  cardCount,
  updateCardStatus,
} from "./card.controller";

const router = Router();

// Create a card manually
router.post("/", createCard);

// Generate a random Bingo card
router.post("/generate", generateCard);

// List cards
router.get("/", listCards);

// Count cards
router.get("/count", cardCount);

// Get card by card number
router.get(
  "/number/:cardNumber",
  getCardByCardNumber
);

// Get card by MongoDB ID
router.get("/:id", getCardById);

// Update card status
router.patch(
  "/:id/status",
  updateCardStatus
);

export default router;