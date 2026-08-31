import { Request, Response } from "express";

import {
  submitWithdrawal,
  getPlayerWithdrawals,
  getAgentPendingWithdrawals,
  getWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
} from "./withdrawal.service";

export const createWithdrawal =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const playerId =
        req.user?.userId;

      if (!playerId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const {
        amount,
        paymentMethod,
        note,
      } = req.body;

      const withdrawal =
        await submitWithdrawal(
          playerId,
          {
            amount,
            paymentMethod,
            note,
          }
        );

      return res.status(201).json({
        success: true,
        message:
          "Withdrawal request submitted successfully",
        data: withdrawal,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to submit withdrawal",
      });
    }
  };

export const getMyWithdrawals =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const playerId =
        req.user?.userId;

      if (!playerId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const withdrawals =
        await getPlayerWithdrawals(
          playerId
        );

      return res.status(200).json({
        success: true,
        data: withdrawals,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve withdrawals",
      });
    }
  };

export const getAgentWithdrawals =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const agentId =
        req.user?.userId;

      if (!agentId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      const withdrawals =
        await getAgentPendingWithdrawals(
          agentId
        );

      return res.status(200).json({
        success: true,
        data: withdrawals,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve withdrawals",
      });
    }
  };

export const getWithdrawalById =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { id } = req.params;

      if (Array.isArray(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal ID",
        });
      }

      const withdrawal =
        await getWithdrawal(id);

      return res.status(200).json({
        success: true,
        data: withdrawal,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Withdrawal not found",
      });
    }
  };

export const approveWithdrawalRequest =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const agentId =
        req.user?.userId;

      const { id } = req.params;

      if (!agentId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      if (Array.isArray(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal ID",
        });
      }

      const result =
        await approveWithdrawal(
          id,
          agentId
        );

      return res.status(200).json({
        success: true,
        message:
          "Withdrawal approved successfully",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to approve withdrawal",
      });
    }
  };

export const rejectWithdrawalRequest =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const agentId =
        req.user?.userId;

      const { id } = req.params;

      if (!agentId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      if (Array.isArray(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal ID",
        });
      }

      const {
        rejectionReason,
      } = req.body;

      const result =
        await rejectWithdrawal(
          id,
          agentId,
          rejectionReason
        );

      return res.status(200).json({
        success: true,
        message:
          "Withdrawal rejected successfully",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to reject withdrawal",
      });
    }
  };