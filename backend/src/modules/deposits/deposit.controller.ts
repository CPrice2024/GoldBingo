import { Request, Response } from "express";

import {
  submitDeposit,
  getPlayerDeposits,
  getAgentPendingDeposits,
  getPlayerPaymentSettings,
  approveDeposit,
} from "./deposit.service";

export const createDepositRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const playerId = req.user?.userId;

    if (!playerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user?.role !== "player") {
      return res.status(403).json({
        success: false,
        message:
          "Only players can create deposit requests",
      });
    }

    const {
      amount,
      paymentMethod,
      reference,
      note,
    } = req.body;

    if (
      typeof amount !== "number" ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message:
          "amount and paymentMethod are required",
      });
    }

    const deposit = await submitDeposit(
      playerId,
      {
        amount,
        paymentMethod,
        reference,
        note,
      }
    );

    return res.status(201).json({
      success: true,
      message:
        "Deposit request submitted successfully",
      data: deposit,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create deposit request",
    });
  }
};

export const getMyDeposits = async (
  req: Request,
  res: Response
) => {
  try {
    const playerId = req.user?.userId;

    if (!playerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const deposits =
      await getPlayerDeposits(playerId);

    return res.status(200).json({
      success: true,
      data: deposits,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve deposits",
    });
  }
};
export const getMyPaymentSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const playerId = req.user?.userId;

    if (!playerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user?.role !== "player") {
      return res.status(403).json({
        success: false,
        message:
          "Only players can access payment settings",
      });
    }

    const settings =
      await getPlayerPaymentSettings(playerId);

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve payment settings",
    });
  }
};

export const getPendingAgentDeposits = async (
  req: Request,
  res: Response
) => {
  try {
    const agentId = req.user?.userId;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user?.role !== "agent") {
      return res.status(403).json({
        success: false,
        message:
          "Only agents can access pending deposits",
      });
    }

    const deposits =
      await getAgentPendingDeposits(agentId);

    return res.status(200).json({
      success: true,
      data: deposits,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve pending deposits",
    });
  }
};

export const approveDepositRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const agentId = req.user?.userId;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user?.role !== "agent") {
      return res.status(403).json({
        success: false,
        message:
          "Only agents can approve deposits",
      });
    }

   const id = req.params.id;

if (typeof id !== "string") {
  return res.status(400).json({
    success: false,
    message: "Invalid deposit ID",
  });
}

const result = await approveDeposit(
  id,
  agentId
);

    return res.status(200).json({
      success: true,
      message:
        "Deposit approved successfully",
      data: {
        deposit: result.deposit,
        balanceBefore:
          result.balanceBefore,
        balanceAfter:
          result.balanceAfter,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to approve deposit",
    });
  }
};