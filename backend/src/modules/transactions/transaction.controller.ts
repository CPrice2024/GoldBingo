import { Request, Response } from "express";

import {
  getUserTransactions,
  getAllTransactions,
} from "./transaction.service";
import {
  Transaction,
} from "./transaction.model";


// =========================
// PLAYER
// =========================

// =========================
// PLAYER / AGENT
// =========================

export const getMyTransactions =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const userId =
        req.user?.userId;

      const role =
        req.user?.role;


      if (!userId) {

        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });

      }


      let transactions;


      /* =====================================
         AGENT
      ====================================== */

      if (
        role === "agent"
      ) {

        /*
         * Deposit / withdrawal transactions
         * belong to the PLAYER through userId.
         *
         * The approving agent is stored in
         * processedBy.
         */

        transactions =
          await Transaction.find({
            processedBy:
              userId,
          })
            .populate(
              "userId",
              "fullName phone role"
            )
            .populate(
              "processedBy",
              "fullName phone role"
            )
            .sort({
              createdAt: -1,
            });

      }


      /* =====================================
         PLAYER
      ====================================== */

      else {

        transactions =
          await getUserTransactions(
            userId
          );

      }


      return res
        .status(200)
        .json({
          success: true,
          data:
            transactions,
        });

    } catch (error) {

      console.error(
        "Get my transactions error:",
        error
      );


      return res
        .status(500)
        .json({
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