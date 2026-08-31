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
  updateExistingGame,
  getGameWinners,
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
  winningPattern,
  prizeAmount,
  scheduledStartAt,
} = req.body;


const game =
  await createNewGame({
    name,
    entryFee:
      Number(entryFee),

    maxPlayers:
      Number(maxPlayers),

    winningPattern,

    prizeAmount:
      prizeAmount ===
        undefined
        ? null
        : prizeAmount === null
        ? null
        : Number(
            prizeAmount
          ),

    scheduledStartAt:
      scheduledStartAt ||
      null,
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

/* =========================================================
   UPDATE GAME
========================================================= */

export const updateGameController =
  async (
    req: Request,
    res: Response
  ) => {
    try {

      const {
        id,
      } = req.params;


      /* =========================================
         VALIDATE ID
      ========================================= */

      if (
        !id ||
        Array.isArray(id)
      ) {
        return res.status(
          400
        ).json({
          success: false,
          message:
            "Invalid game ID",
        });
      }


      /* =========================================
         BODY
      ========================================= */

      const {
  name,
  entryFee,
  maxPlayers,
  winningPattern,
  prizeAmount,
  scheduledStartAt,
} = req.body;


      /* =========================================
         UPDATE
      ========================================= */

      const game =
  await updateExistingGame(
    id,
    {
      name:
        name !== undefined
          ? String(name)
          : undefined,

      entryFee:
        entryFee !== undefined
          ? Number(entryFee)
          : undefined,

      maxPlayers:
        maxPlayers !== undefined
          ? Number(maxPlayers)
          : undefined,

      winningPattern:
        winningPattern !== undefined
          ? winningPattern
          : undefined,

      prizeAmount:
        prizeAmount === undefined
          ? undefined
          : prizeAmount === null
          ? null
          : Number(prizeAmount),

      scheduledStartAt:
        scheduledStartAt === undefined
          ? undefined
          : scheduledStartAt || null,
    }
  );


      return res.status(
        200
      ).json({

        success: true,

        message:
          "Game updated successfully",

        data:
          game,

      });

    } catch (error) {

      console.error(
        "Update game error:",
        error
      );


      const message =
        error instanceof Error
          ? error.message
          : "Failed to update game";


      const statusCode =
        message ===
        "Game not found"
          ? 404
          : 400;


      return res.status(
        statusCode
      ).json({

        success: false,

        message,

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
export const claimBingoController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !id ||
        Array.isArray(id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid game ID",
          });
      }


      const playerId =
        (req as any)
          .user?.userId;

      if (!playerId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }


      /*
       * No pattern from frontend anymore.
       *
       * claimBingo() automatically
       * uses game.winningPattern.
       */
      const result =
        await claimBingo(
          id,
          playerId
        );


      /*
       * =========================================
       * FALSE BINGO
       * =========================================
       */
      if (
        result.status ===
        "BLOCKED"
      ) {
        return res
          .status(200)
          .json({
            success: true,

            code:
              "FALSE_BINGO",

            message:
              result.message,

            data:
              result,
          });
      }


      /*
       * =========================================
       * PLAYER ALREADY BLOCKED
       * =========================================
       */
      if (
        result.status ===
        "BLOCKED_ALREADY"
      ) {
        return res
          .status(403)
          .json({
            success: false,

            code:
              "BINGO_BLOCKED",

            message:
              result.message,

            data:
              result,
          });
      }


      /*
       * =========================================
       * SOMEBODY ELSE ALREADY WON
       * =========================================
       */
      if (
        result.status ===
        "GAME_FINISHED"
      ) {
        return res
          .status(409)
          .json({
            success: false,

            code:
              "GAME_FINISHED",

            message:
              result.message,

            data:
              result,
          });
      }


      /*
       * =========================================
       * VALID BINGO
       * =========================================
       */
      if (
        result.status ===
        "WINNER"
      ) {
        return res
          .status(200)
          .json({
            success: true,

            code:
              "BINGO_WIN",

            message:
              "Bingo! Prize collected successfully.",

            data:
              result,
          });
      }


      /*
       * Fallback
       */
      return res
        .status(200)
        .json({
          success: true,

          data:
            result,
        });

    } catch (error) {

      console.error(
        "Claim Bingo error:",
        error
      );

      return res
        .status(400)
        .json({
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

/* =========================================================
   GET WINNERS
========================================================= */

export const getGameWinnersController =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { id } =
        req.params;


      if (
        Array.isArray(id)
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid game ID",
          });
      }


      const playerId =
        (req as any)
          .user?.userId;


      if (!playerId) {
        return res
          .status(401)
          .json({
            success:
              false,

            message:
              "Authentication required",
          });
      }


      const result =
        await getGameWinners(
          id,
          playerId
        );


      return res
        .status(200)
        .json({
          success:
            true,

          data:
            result,
        });

    } catch (error) {

      return res
        .status(400)
        .json({
          success:
            false,

          message:
            error instanceof Error
              ? error.message
              : "Failed to retrieve winner",
        });

    }
  };