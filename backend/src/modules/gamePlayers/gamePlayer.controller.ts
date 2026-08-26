import {
  Request,
  Response,
} from "express";

import {
  joinGame,
  getGamePlayers,
  getPlayerGame,
  getGamePlayerCount,
} from "./gamePlayer.service";

export const joinGameController =
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
  gameId,
  cardCount = 1,
} = req.body;
const parsedCardCount =
  Number(cardCount);

const allowedCardCounts = [
  1,
  2,
  3,
  5,
  10,
];

if (
  !allowedCardCounts.includes(
    parsedCardCount
  )
) {
  return res.status(400).json({
    success: false,
    message:
      "Card count must be 1, 2, 3, 5, or 10",
  });
}

      if (
        typeof gameId !== "string" ||
        !gameId.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Game ID is required",
        });
      }

      const result =
  await joinGame(
    playerId,
    gameId,
    parsedCardCount
  );

      return res.status(201).json({
        success: true,
        message:
          "Joined game successfully",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to join game",
      });
    }
  };

export const listGamePlayers =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { gameId } =
        req.params;

      if (
        Array.isArray(gameId) ||
        !gameId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid game ID",
        });
      }

      const players =
        await getGamePlayers(
          gameId
        );

      return res.status(200).json({
        success: true,
        data: players,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve game players",
      });
    }
  };

export const getMyGame =
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

      const { gameId } =
        req.params;

      if (
        Array.isArray(gameId) ||
        !gameId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid game ID",
        });
      }

      const gamePlayer =
        await getPlayerGame(
          gameId,
          playerId
        );

      return res.status(200).json({
        success: true,
        data: gamePlayer,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Game participation not found",
      });
    }
  };

export const getGamePlayerCountController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { gameId } =
        req.params;

      if (
        Array.isArray(gameId) ||
        !gameId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid game ID",
        });
      }

      const count =
        await getGamePlayerCount(
          gameId
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
            : "Failed to count players",
      });
    }
  };