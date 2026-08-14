import { Request, Response } from "express";

import {
  getUserTransactions,
  getAllTransactions,
} from "./transaction.service";


// =========================
// PLAYER
// =========================

export const getMyTransactions = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const transactions =
      await getUserTransactions(userId);

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve transactions",
    });
  }
};


// =========================
// ADMIN
// =========================

export const getAllTransactionsController =
async (
  req: Request,
  res: Response
) => {
  try {
    const transactions =
      await getAllTransactions();

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error(
      "[ADMIN] Get transactions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve transactions",
    });
  }
};