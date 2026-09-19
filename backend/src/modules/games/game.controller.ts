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
  claimBingo, 
  getCurrentGame,
  updateExistingGame,
  getGameWinners,
  cancelWaitingGame,
  cancelActiveGame,
} from "./game.service";
export const createGame =
  async (
    req: Request,
    res: Response
  ) => {
    try {
     const {
  name,
  gameType,
  entryFee,
  maxPlayers,
  winningPattern,
  prizeAmount,
  scheduledStartAt,
  callMode,
  callIntervalSeconds,
} = req.body;
const game =
  await createNewGame({
    name,
    gameType:
      gameType === -1
        ? -1
        : 1,
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

    callIntervalSeconds:
  callIntervalSeconds === undefined
    ? 15
    : Number(
        callIntervalSeconds
      ),

    scheduledStartAt:
      scheduledStartAt ||
      null,
    callMode:
    callMode === "manual"
    ? "manual"
    : "automatic",
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
  callMode,
  gameType,
  callIntervalSeconds,
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

      callIntervalSeconds:
  callIntervalSeconds === undefined
    ? undefined
    : Number(
        callIntervalSeconds
      ),

      scheduledStartAt:
        scheduledStartAt === undefined
          ? undefined
          : scheduledStartAt || null,

      callMode:
  callMode === undefined
    ? undefined
    : callMode === "manual"
    ? "manual"
    : "automatic",
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
/* =========================================================
   CANCEL GAME
========================================================= */

export const cancelGameController =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const {
        id,
      } = req.params;


      if (
        !id ||
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


      const game =
        await cancelWaitingGame(
          id
        );


      return res
        .status(200)
        .json({

          success:
            true,

          message:
            "Game cancelled successfully",

          data:
            game,

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
              : "Failed to cancel game",

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
      /* =========================================
   EXACT CARD
========================================= */

const {
  cardId,
} = req.body;


if (
  typeof cardId !==
    "string" ||
  !cardId.trim()
) {

  return res
    .status(400)
    .json({
      success: false,

      message:
        "Card ID is required",
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
    playerId,
    cardId.trim()
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

  /* =========================================
     BROADCAST FALSE BINGO TO ALL PLAYERS
  ========================================= */

  const io =
    req.app.get("io");

  if (io) {
    io.emit(
      "bingo:blocked",
      {
        gameId:
          id,

        gamePlayerId:
          result.gamePlayerId,

        cardId:
          result.cardId,

        blockedAt:
          result.blockedAt,
      }
    );
  }


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

      /* =========================================
   THIS CARD ALREADY WON
========================================= */

if (
  result.status ===
  "WINNER_ALREADY"
) {
  return res
    .status(409)
    .json({
      success: false,

      code:
        "CARD_ALREADY_WINNER",

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

  /* =========================================
     BROADCAST WINNER TO EVERY VIEWER
  ========================================= */

  const io =
    req.app.get("io");


  if (io) {

    io.emit(
      "bingo:winner",
      {
        gameId:
          id,

        gamePlayerId:
          result.winner
            ?.gamePlayerId,

        cardId:
          result.winner
            ?.cardId,

        cardNumber:
          result.winner
            ?.cardNumber,

        claimedAt:
          result.winner
            ?.claimedAt,
      }
    );

  }


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

  /* =========================================================
   CANCEL ACTIVE GAME
========================================================= */

export const cancelActiveGameController =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const { id } =
        req.params;


      if (
        Array.isArray(id) ||
        !id
      ) {
        return res.status(
          400
        ).json({
          success:
            false,

          message:
            "Invalid game ID",
        });
      }


      const result =
        await cancelActiveGame(
          id
        );


      return res.status(
        200
      ).json({
        success:
          true,

        message:
          "Active game cancelled and players refunded successfully",

        data:
          result,
      });


    } catch (error) {

  console.error(
    "[CANCEL ACTIVE GAME CONTROLLER ERROR]",
    error
  );


  return res.status(
    400
  ).json({
    success:
      false,

    message:
      error instanceof Error
        ? error.message
        : "Failed to cancel active game",
  });

}

};