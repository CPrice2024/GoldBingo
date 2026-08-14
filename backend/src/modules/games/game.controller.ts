import {
  Request,
  Response,
} from "express";

import {
  createNewGame,
  getGames,
  getGame,
  startGame,
  callGameNumber,
  getGameState,
  checkBingo,
  claimBingo,
  getCurrentGame,
} from "./game.service";

export const createGame =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        name,
        entryFee,
        maxPlayers,
      } = req.body;

      const game =
        await createNewGame({
          name,
          entryFee,
          maxPlayers,
        });

      return res.status(201).json({
        success: true,
        message:
          "Game created successfully",
        data: game,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create game",
      });
    }
  };

export const listGames =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const status =
        typeof req.query.status === "string"
          ? req.query.status
          : undefined;

      const games =
        await getGames(status as any);

      return res.status(200).json({
        success: true,
        data: games,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve games",
      });
    }
  };

export const getGameById =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { id } = req.params;

      if (Array.isArray(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid game ID",
        });
      }

      const game =
        await getGame(id);

      return res.status(200).json({
        success: true,
        data: game,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Game not found",
      });
    }
  };
  export const startGameController =
async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID",
      });
    }

    const game =
      await startGame(id);

    return res.status(200).json({
      success: true,
      message:
        "Game started successfully",
      data: game,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to start game",
    });
  }
};

export const callNumber =
async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID",
      });
    }

    const { number } = req.body;

const result =
  await callGameNumber(
    id,
    number
  );

    return res.status(200).json({
      success: true,
      message:
        "Bingo number called successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to call Bingo number",
    });
  }
};

export const getGameStateController =
async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID",
      });
    }

    const state =
      await getGameState(id);

    return res.status(200).json({
      success: true,
      data: state,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Game not found",
    });
  }
};

export const checkBingoController =
async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID",
      });
    }

    const playerId =
      (req as any).user?.userId;

    if (!playerId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const { pattern } = req.body;

    const result =
      await checkBingo(
        id,
        playerId,
        pattern
      );

    return res.status(200).json({
      success: true,
      message:
        result.hasBingo
          ? "Bingo pattern matched"
          : "Bingo pattern not matched",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to check Bingo",
    });
  }
};

export const claimBingoController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID",
      });
    }

    const playerId =
      (req as any).user?.userId;

    if (!playerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { pattern } = req.body;

    const result = await claimBingo(
      id,
      playerId,
      pattern
    );

    return res.status(200).json({
      success: true,
      message: "Bingo claimed successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to claim Bingo",
    });
  }
};

export const getCurrentGameController = async (
  req: Request,
  res: Response
) => {
  try {
    const game = await getCurrentGame();

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "No active Bingo game available",
      });
    }

    return res.status(200).json({
      success: true,
      data: game,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve current game",
    });
  }
};