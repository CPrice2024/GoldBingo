import {
  Request,
  Response,
} from "express";

import {
  createNewCard,
  generateNewCard,
  getCard,
  getCardByNumber,
  getCards,
  getCardCount,
  changeCardStatus,
} from "./card.service";

export const createCard = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      cardNumber,
      numbers,
    } = req.body;

    const card =
      await createNewCard({
        cardNumber,
        numbers,
      });

    return res.status(201).json({
      success: true,
      message:
        "Card created successfully",
      data: card,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create card",
    });
  }
};

export const generateCard = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      cardNumber,
    } = req.body;

    const card =
      await generateNewCard(
        cardNumber
      );

    return res.status(201).json({
      success: true,
      message:
        "Bingo card generated successfully",
      data: card,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate card",
    });
  }
};

export const listCards = async (
  req: Request,
  res: Response
) => {
  try {
    const status =
      typeof req.query.status ===
      "string"
        ? req.query.status
        : undefined;

    const cards =
      await getCards(
        status as any
      );

    return res.status(200).json({
      success: true,
      data: cards,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve cards",
    });
  }
};

export const getCardById =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { id } =
        req.params;

      if (Array.isArray(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid card ID",
        });
      }

      const card =
        await getCard(id);

      return res.status(200).json({
        success: true,
        data: card,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Card not found",
      });
    }
  };

export const getCardByCardNumber =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { cardNumber } =
        req.params;

      if (
        Array.isArray(cardNumber)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid card number",
        });
      }

      const card =
        await getCardByNumber(
          cardNumber
        );

      return res.status(200).json({
        success: true,
        data: card,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Card not found",
      });
    }
  };

export const cardCount =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const status =
        typeof req.query.status ===
        "string"
          ? req.query.status
          : undefined;

      const count =
        await getCardCount(
          status as any
        );

      return res.status(200).json({
        success: true,
        data: {
          count,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to count cards",
      });
    }
  };

export const updateCardStatus =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { id } =
        req.params;

      const { status } =
        req.body;

      if (Array.isArray(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid card ID",
        });
      }

      const card =
        await changeCardStatus(
          id,
          status
        );

      return res.status(200).json({
        success: true,
        message:
          "Card status updated successfully",
        data: card,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update card status",
      });
    }
  };