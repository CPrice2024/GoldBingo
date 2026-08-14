import { Request, Response } from "express";

import {
  getAgentProfile,
  getAgentPlayers,
  getAgentStats,
} from "./agent.service";

export const getMyProfile = async (
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

    const agent = await getAgentProfile(agentId);

    return res.status(200).json({
      success: true,
      data: agent,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Agent not found",
    });
  }
};

export const getMyPlayers = async (
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

    const players = await getAgentPlayers(agentId);

    return res.status(200).json({
      success: true,
      data: players,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve players",
    });
  }
};

export const getMyStats = async (
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

    const stats = await getAgentStats(agentId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve statistics",
    });
  }
};