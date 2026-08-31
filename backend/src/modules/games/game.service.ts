import {
  createGame,
  findGameById,
  findGames,
  startGame as startGameRepository,
  callNumber as callNumberRepository,
} from "./game.repository";

import {
  startAutomaticCaller,
  stopAutomaticCaller,
  scheduleNextGame,
  scheduleAdminGameStart,
} from "./game.autoCaller";

import {
  getGamePlayers,
} from "../gamePlayers/gamePlayer.service";

import {
  findGamePlayer,
} from "../gamePlayers/gamePlayer.repository";

import {
  isPatternMatched,
  BingoPattern,
  WinningPattern,
  isValidWinningPattern,
  getWinningPatternLabel,
} from "./game.patterns";

import { GameStatus } from "./game.types";

import {
  GamePlayer,
} from "../gamePlayers/gamePlayer.model";

import mongoose from "mongoose";

import { Game } from "./game.model";

import { Card } from "../cards/card.model";

import { Wallet } from "../wallet/wallet.model";

import { Transaction } from "../transactions/transaction.model";

interface CreateGameInput {
  name: string;

  entryFee: number;

  maxPlayers: number;

  winningPattern?:
    WinningPattern;

  scheduledStartAt?:
    string | Date | null;

  prizeAmount?:
    number | null;
}


interface UpdateGameInput {
  name?: string;

  entryFee?: number;

  maxPlayers?: number;

  winningPattern?:
    WinningPattern;

  scheduledStartAt?:
    string | Date | null;

  prizeAmount?:
    number | null;
}


const getParticipationCardIds = (
  gamePlayer: any
) => {
  const ids: any[] = [];

  if (
    Array.isArray(
      gamePlayer.cardIds
    )
  ) {
    ids.push(
      ...gamePlayer.cardIds
    );
  }

  // Legacy support
  if (gamePlayer.cardId) {
    ids.push(
      gamePlayer.cardId
    );
  }

  return ids
    .map(
      (item) =>
        item?._id ??
        item
    )
    .filter(Boolean);
};
export const createNewGame = async (
  data: CreateGameInput
) => {
  if (!data.name?.trim()) {
    throw new Error(
      "Game name is required"
    );
  }

  if (
    typeof data.entryFee !==
      "number" ||
    data.entryFee < 0
  ) {
    throw new Error(
      "Entry fee must be a valid non-negative number"
    );
  }

  if (
    typeof data.maxPlayers !==
      "number" ||
    data.maxPlayers <= 0
  ) {
    throw new Error(
      "Maximum players must be greater than zero"
    );
  }

  const winningPattern =
    data.winningPattern ??
    "3_lines";

  if (
    !isValidWinningPattern(
      winningPattern
    )
  ) {
    throw new Error(
      "Invalid winning pattern"
    );
  }
  let scheduledStartAt:
  Date | null = null;


if (
  data.scheduledStartAt
) {

  const parsedDate =
    new Date(
      data.scheduledStartAt
    );


  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    throw new Error(
      "Invalid scheduled start time"
    );
  }


  if (
    parsedDate.getTime() <=
    Date.now()
  ) {
    throw new Error(
      "Scheduled start time must be in the future"
    );
  }


  scheduledStartAt =
    parsedDate;
}


let prizeAmount:
  number | null = null;


if (
  data.prizeAmount !==
    undefined &&
  data.prizeAmount !== null
) {

  prizeAmount =
    Number(
      data.prizeAmount
    );


  if (
    !Number.isFinite(
      prizeAmount
    ) ||
    prizeAmount < 0
  ) {
    throw new Error(
      "Prize amount must be a valid non-negative number"
    );
  }

}

 const game =
  await createGame({
    name:
      data.name.trim(),

    entryFee:
      data.entryFee,

    maxPlayers:
      data.maxPlayers,

    winningPattern,

    scheduledStartAt,

    prizeAmount,
  });


if (
  game.scheduledStartAt
) {
  await scheduleAdminGameStart(
    game._id.toString()
  );
}


return game;
};
/* =========================================================
   UPDATE EXISTING GAME
========================================================= */

export const updateExistingGame =
  async (
    gameId: string,
    data: UpdateGameInput
  ) => {

    const game =
      await findGameById(
        gameId
      );


    /* =========================================
       GAME EXISTS
    ========================================= */

    if (!game) {
      throw new Error(
        "Game not found"
      );
    }

    /* =========================================
   PRIZE AMOUNT
========================================= */

if (
  data.prizeAmount !==
  undefined
) {

  if (
    data.prizeAmount ===
    null
  ) {

    game.prizeAmount =
      null;

  } else {

    const prizeAmount =
      Number(
        data.prizeAmount
      );


    if (
      !Number.isFinite(
        prizeAmount
      ) ||
      prizeAmount < 0
    ) {
      throw new Error(
        "Prize amount must be a valid non-negative number"
      );
    }


    game.prizeAmount =
      prizeAmount;

  }

}


/* =========================================
   SCHEDULED START
========================================= */

if (
  data.scheduledStartAt !==
  undefined
) {

  if (
    !data.scheduledStartAt
  ) {

    game.scheduledStartAt =
      null;

  } else {

    const parsedDate =
      new Date(
        data.scheduledStartAt
      );


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      throw new Error(
        "Invalid scheduled start time"
      );
    }


    if (
      parsedDate.getTime() <=
      Date.now()
    ) {
      throw new Error(
        "Scheduled start time must be in the future"
      );
    }


    game.scheduledStartAt =
      parsedDate;

  }

}
if (
  game.currentPlayers > 0 &&
  data.entryFee !== undefined &&
  data.entryFee !== game.entryFee
) {
  throw new Error(
    "Entry fee cannot be changed after players have joined"
  );
}


    /* =========================================
       NAME
    ========================================= */

    if (
      data.name !==
      undefined
    ) {

      const name =
        data.name.trim();

      if (!name) {
        throw new Error(
          "Game name is required"
        );
      }

      game.name =
        name;
    }


    /* =========================================
       ENTRY FEE
    ========================================= */

    if (
      data.entryFee !==
      undefined
    ) {

      if (
        !Number.isFinite(
          data.entryFee
        ) ||
        data.entryFee < 0
      ) {
        throw new Error(
          "Entry fee must be a valid non-negative number"
        );
      }

      game.entryFee =
        data.entryFee;
    }


    /* =========================================
       MAX PLAYERS
    ========================================= */

    if (
      data.maxPlayers !==
      undefined
    ) {

      if (
        !Number.isFinite(
          data.maxPlayers
        ) ||
        data.maxPlayers <= 0
      ) {
        throw new Error(
          "Maximum players must be greater than zero"
        );
      }


      if (
        data.maxPlayers <
        game.currentPlayers
      ) {
        throw new Error(
          `Maximum players cannot be lower than current players (${game.currentPlayers})`
        );
      }


      game.maxPlayers =
        Math.floor(
          data.maxPlayers
        );
    }


    /* =========================================
       WINNING PATTERN
    ========================================= */

    if (
      data.winningPattern !==
      undefined
    ) {

      if (
        !isValidWinningPattern(
          data.winningPattern
        )
      ) {
        throw new Error(
          "Invalid winning pattern"
        );
      }


      game.winningPattern =
        data.winningPattern;
    }


    /* =========================================
       SAVE
    ========================================= */

    await game.save();


/*
 * Re-create the scheduled-start timer
 * whenever Admin edits the game.
 *
 * scheduleAdminGameStart() also clears
 * the previous timer first.
 */
await scheduleAdminGameStart(
  game._id.toString()
);


return game;
  };

export const getGames = async (
  status?: GameStatus
) => {
  return findGames(status);
};

export const getGame = async (
  gameId: string
) => {
  const game = await findGameById(gameId);

  if (!game) {
    throw new Error("Game not found");
  }

  return game;
};

export const startGame = async (
  gameId: string
) => {
  const game =
    await findGameById(gameId);

  if (!game) {
    throw new Error(
      "Game not found"
    );
  }

  /* =========================================
   ONLY WAITING GAME CAN BE EDITED
========================================= */

if (
  game.status !== "waiting"
) {
  throw new Error(
    "Only waiting games can be edited"
  );
}

  if (game.status !== "waiting") {
    throw new Error(
      "Game is not in waiting status"
    );
  }

  if (game.currentPlayers <= 0) {
    throw new Error(
      "Cannot start a game without players"
    );
  }

  const startedGame =
    await startGameRepository(
      gameId
    );

  if (!startedGame) {
    throw new Error(
      "Failed to start game"
    );
  }

  // Start automatic Bingo number caller
  startAutomaticCaller(
    gameId
  );

  return startedGame;
};

export const callGameNumber = async (
  gameId: string,
  requestedNumber?: number
) => {
  const game =
    await findGameById(gameId);

  if (!game) {
    throw new Error(
      "Game not found"
    );
  }

  if (game.status !== "active") {
    throw new Error(
      "Game is not active"
    );
  }

  if (game.calledNumbers.length >= 75) {
    throw new Error(
      "All Bingo numbers have already been called"
    );
  }

  // Generate or use a requested Bingo number
let number: number;

if (requestedNumber !== undefined) {
  if (
    !Number.isInteger(requestedNumber) ||
    requestedNumber < 1 ||
    requestedNumber > 75
  ) {
    throw new Error(
      "Bingo number must be an integer between 1 and 75"
    );
  }

  if (
    game.calledNumbers.includes(requestedNumber)
  ) {
    throw new Error(
      "This Bingo number has already been called"
    );
  }

  number = requestedNumber;
} else {
  const availableNumbers: number[] = [];

  for (let n = 1; n <= 75; n++) {
    if (!game.calledNumbers.includes(n)) {
      availableNumbers.push(n);
    }
  }

  const randomIndex =
    Math.floor(
      Math.random() *
        availableNumbers.length
    );

  number = availableNumbers[randomIndex];
}

  const updatedGame =
    await callNumberRepository(
      gameId,
      number
    );

  if (!updatedGame) {
    throw new Error(
      "Failed to call Bingo number. Please try again."
    );
  }

  return {
    number,
    calledNumbers:
      updatedGame.calledNumbers,
    game: updatedGame,
  };
};

export const completeGame = async (
  gameId: string
) => {
  const game = await Game.findOne({
    _id: gameId,
    status: "active",
  });

  if (!game) {
    return null;
  }

  game.status = "completed";
  game.completedAt = new Date();

  await game.save();

  console.log(
    `[ID] Game ${game.name} completed`
  );

  return game;
};

export const getGameState = async (
  gameId: string
) => {
  const game =
    await findGameById(gameId);

  if (!game) {
    throw new Error(
      "Game not found"
    );
  }

  const players =
    await getGamePlayers(gameId);

  /* =========================================
   BLOCKED / FALSE BINGO PLAYERS
========================================= */

const blockedRows =
  await GamePlayer.find({
    gameId:
      game._id,

    bingoBlocked:
      true,
  })
    .populate({
      path:
        "playerId",

      select:
        "fullName",
    })
    .populate({
      path:
        "blockedCardIds",

      select:
        "cardNumber numbers",
    })
    .sort({
      blockedAt: -1,
    });

    const blockedPlayers =
  blockedRows.map(
    (row: any) => ({
      gamePlayerId:
        row._id,

      player: {
        id:
          row.playerId?._id ??
          null,

        fullName:
          row.playerId?.fullName ??
          "Player",
      },

      blockedAt:
        row.blockedAt,

      blockedReason:
        row.blockedReason ??
        "False Bingo",

      cards:
        Array.isArray(
          row.blockedCardIds
        )
          ? row.blockedCardIds.map(
              (card: any) => ({
                id:
                  card._id,

                cardNumber:
                  card.cardNumber,

                numbers:
                  card.numbers,
              })
            )
          : [],
    })
  );

return {
  game: {
    id:
      game._id,

    name:
      game.name,

    winningPattern:
      game.winningPattern ??
      "3_lines",

    winningPatternLabel:
      getWinningPatternLabel(
        game.winningPattern ??
          "3_lines"
      ),

    entryFee:
      game.entryFee,

    maxPlayers:
      game.maxPlayers,

    currentPlayers:
      game.currentPlayers,

    prizePool:
      game.prizePool,

    prizeAmount:
      game.prizeAmount,

    scheduledStartAt:
      game.scheduledStartAt,

    status:
      game.status,

    calledNumbers:
      game.calledNumbers,

    joiningWindowSeconds:
      game.joiningWindowSeconds,

    callIntervalSeconds:
      game.callIntervalSeconds,

    joiningEndsAt:
      game.joiningEndsAt,

    nextCallAt:
      game.nextCallAt,

    startedAt:
      game.startedAt,

    completedAt:
      game.completedAt,
  },

  players,

  blockedPlayers,
};
};

export const checkBingo = async (
  gameId: string,
  playerId: string,
  pattern: BingoPattern
) => {
  // 1. Find game
  const game =
    await findGameById(gameId);

  if (!game) {
    throw new Error(
      "Game not found"
    );
  }

  // 2. Game must be active
  if (
    game.status !== "active"
  ) {
    throw new Error(
      "Game is not active"
    );
  }

  // 3. Validate pattern
  const validPatterns:
    BingoPattern[] = [
      "row",
      "column",
      "diagonal",
      "four_corners",
      "x",
      "blackout",
    ];

  if (
    !validPatterns.includes(
      pattern
    )
  ) {
    throw new Error(
      "Invalid Bingo pattern"
    );
  }

  // 4. Find participation
  const gamePlayer =
    await findGamePlayer(
      gameId,
      playerId
    );

  if (!gamePlayer) {
    throw new Error(
      "Player has not joined this game"
    );
  }

  if (
  gamePlayer.status !==
  "active"
) {
  throw new Error(
    "Player is not active in this game"
  );
}





// 4. Get all player's cards
const assignedCardIds =
  getParticipationCardIds(
    gamePlayer
  );

  if (
    assignedCardIds.length ===
    0
  ) {
    throw new Error(
      "No Bingo cards assigned to this player"
    );
  }

  // 6. Load all active cards
  const cards =
    await Card.find({
      _id: {
        $in:
          assignedCardIds,
      },

      status:
        "assigned",
    });

  if (
    cards.length === 0
  ) {
    throw new Error(
      "No active Bingo cards assigned to this player"
    );
  }

  // 7. Check every card
  const winningCard =
    cards.find(
      (card) =>
        isPatternMatched(
          card.numbers,
          game.calledNumbers,
          pattern
        )
    );

  const hasBingo =
    Boolean(
      winningCard
    );

  return {
    hasBingo,

    pattern,

    cardsChecked:
      cards.length,

    card:
      winningCard
        ? {
            id:
              winningCard._id,

            cardNumber:
              winningCard.cardNumber,

            numbers:
              winningCard.numbers,
          }
        : null,

    calledNumbers:
      game.calledNumbers,
  };
};
/* =========================================
   MONGODB TRANSACTION RETRY
========================================= */

const isRetryableTransactionError = (
  error: any
): boolean => {

  return (
    error?.code === 112 ||
    error?.codeName ===
      "WriteConflict" ||
    error?.hasErrorLabel?.(
      "TransientTransactionError"
    ) === true ||
    String(
      error?.message || ""
    ).includes(
      "Write conflict"
    )
  );
};


const wait = (
  ms: number
) =>
  new Promise<void>(
    (resolve) =>
      setTimeout(
        resolve,
        ms
      )
  );

/* =========================================
   CLAIM BINGO
========================================= */

export const claimBingo = async (
  gameId: string,
  playerId: string,
  retryAttempt = 0
): Promise<any> => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Get active game
    const game =
      await Game.findOne({
        _id: gameId,
        status: "active",
      }).session(session);

    if (!game) {
      throw new Error(
        "Game not found or is no longer active"
      );
    }
    /* =========================================
   GAME WINNING PATTERN
========================================= */

const pattern:
  WinningPattern =
  (
    game.winningPattern ??
    "3_lines"
  ) as WinningPattern;


/*
 * Pattern is controlled by
 * the game/admin, not frontend.
 */
if (
  !isValidWinningPattern(
    pattern
  )
) {
  throw new Error(
    "Game has an invalid winning pattern"
  );
}

    // 3. Find participation
    const gamePlayer =
      await findGamePlayer(
        gameId,
        playerId,
        session
      );

    if (!gamePlayer) {
      throw new Error(
        "Player has not joined this game"
      );
    }

    if (
  gamePlayer.status !==
  "active"
) {
  throw new Error(
    "Player is not active in this game"
  );
}


/* =========================================
   BLOCK REPEATED BINGO CLICK
========================================= */

if (
  gamePlayer.bingoBlocked ===
  true
) {
  await session.abortTransaction();

  return {
    status:
      "BLOCKED_ALREADY",

    message:
      "Your Bingo button is blocked for this game.",

    playerId,

    gamePlayerId:
      gamePlayer._id,

    blockedAt:
      gamePlayer.blockedAt,

    blockedReason:
      gamePlayer.blockedReason,
  };
}


/* =========================================
   GET ALL PLAYER CARDS
========================================= */

const assignedCardIds =
  getParticipationCardIds(
    gamePlayer
  );

    if (
      assignedCardIds.length ===
      0
    ) {
      throw new Error(
        "No Bingo cards assigned to this player"
      );
    }

    const cards =
      await Card.find({
        _id: {
          $in:
            assignedCardIds,
        },

        status:
          "assigned",
      }).session(session);

    if (
      cards.length === 0
    ) {
      throw new Error(
        "No active Bingo cards assigned to this player"
      );
    }

   /* =========================================
   CHECK EVERY CARD INDEPENDENTLY
========================================= */

const cardResults =
  cards.map(
    (candidate) => {

      const matched =
        isPatternMatched(
          candidate.numbers,
          game.calledNumbers,
          pattern
        );


      return {
        card:
          candidate,

        matched,
      };

    }
  );


/* =========================================
   FIND ALL WINNING CARDS
========================================= */

const winningCards =
  cardResults
    .filter(
      (result) =>
        result.matched
    )
    .map(
      (result) =>
        result.card
    );


/*
 * One winning card is enough.
 */
const card =
  winningCards.length > 0
    ? winningCards[0]
    : null;


/* =========================================
   FALSE BINGO

   Block ONLY when NONE
   of the player's cards wins.
========================================= */

if (!card) {
  const now =
    new Date();

  gamePlayer.bingoBlocked =
    true;

  gamePlayer.bingoClaimedAt =
    now;

  gamePlayer.blockedAt =
    now;

  gamePlayer.blockedReason =
    "False Bingo";

  gamePlayer.blockedCardIds =
    assignedCardIds;

  await gamePlayer.save({
    session,
  });

  await session.commitTransaction();

  return {
    status: "BLOCKED",

    message:
      "False Bingo. Your Bingo button has been blocked for this game.",

    blockedAt:
      gamePlayer.blockedAt,

    playerId,

    gamePlayerId:
      gamePlayer._id,

    cardIds:
      assignedCardIds,

    cards:
      cards.map(
        (item) => ({
          id:
            item._id,

          cardNumber:
            item.cardNumber,

          numbers:
            item.numbers,
        })
      ),
  };
}

/* =========================================
   LOCK GAME FOR FIRST VALID BINGO
========================================= */

const winTime =
  new Date();

const claimedGame =
  await Game.findOneAndUpdate(
    {
      _id: gameId,

      // Game must still be running
      status: "active",

      // No previous completion
      completedAt: null,
    },
    {
      $set: {
        status: "completed",

        completedAt:
          winTime,
      },
    },
    {
      new: true,

      session,
    }
  );


/*
 * If null is returned,
 * another player already
 * completed/claimed the game.
 */
if (!claimedGame) {
  await session.abortTransaction();

  return {
    status:
      "GAME_FINISHED",

    message:
      "Another player already won this game.",
  };
}

    // 6. Prize
    const prizeAmount =
  Number(
    claimedGame.prizeAmount ??
    claimedGame.prizePool
  );

    if (
      prizeAmount <= 0
    ) {
      throw new Error(
        "Game has no prize available"
      );
    }

    // 7. Winner wallet
    const wallet =
      await Wallet.findOne({
        userId:
          playerId,

        status:
          "active",
      }).session(session);

    if (!wallet) {
      throw new Error(
        "Player wallet not found or inactive"
      );
    }

    // 8. Credit winner
    const winningBalanceBefore =
      wallet.winningBalance ??
      0;

    const winningBalanceAfter =
      winningBalanceBefore +
      prizeAmount;

    wallet.winningBalance =
      winningBalanceAfter;

    await wallet.save({
      session,
    });

    // 9. Mark winner
    gamePlayer.status =
  "won";

gamePlayer.prizeAmount =
  prizeAmount;


/*
 * Save the exact card
 * that produced Bingo.
 */
gamePlayer.winningCardId =
  card._id;


/*
 * Keep the winning rule
 * used for this result.
 */
gamePlayer.winningPattern =
  String(
    game.winningPattern ||
      pattern
  );


gamePlayer.bingoClaimedAt =
  winTime;

gamePlayer.wonAt =
  winTime;


await gamePlayer.save({
  session,
});

    // 10. Mark other players lost
    await GamePlayer.updateMany(
      {
        gameId:
          game._id,

        _id: {
          $ne:
            gamePlayer._id,
        },

        status:
          "active",
      },
      {
        $set: {
          status:
            "lost",

          prizeAmount:
            0,
        },
      },
      {
        session,
      }
    );

    // 11. Get every card used
    // in this game
    const participants =
      await GamePlayer.find(
        {
          gameId:
            game._id,
        },
        {
          cardIds: 1,
          cardId: 1,
        }
      ).session(session);

    const allGameCardIds =
      participants.flatMap(
        (
          participant: any
        ) => {
          const ids:
            any[] = [];

          if (
            Array.isArray(
              participant.cardIds
            )
          ) {
            ids.push(
              ...participant.cardIds
            );
          }

          // Legacy support
          if (
            participant.cardId
          ) {
            ids.push(
              participant.cardId
            );
          }

          return ids
            .map(
              (item) =>
                item?._id ??
                item
            )
            .filter(
              Boolean
            );
        }
      );

    // 12. Mark ALL cards
    // in completed game used
    if (
      allGameCardIds.length >
      0
    ) {
      await Card.updateMany(
        {
          _id: {
            $in:
              allGameCardIds,
          },

          status:
            "assigned",
        },
        {
          $set: {
            status:
              "used",
          },
        },
        {
          session,
        }
      );
    }



    // 14. Winner transaction
    await Transaction.create(
      [
        {
          userId:
            new mongoose.Types.ObjectId(
              playerId
            ),

          type:
            "game_win",

          amount:
            prizeAmount,

          balanceBefore:
            winningBalanceBefore,

          balanceAfter:
            winningBalanceAfter,

          currency:
            "ETB",

          status:
            "completed",

          requestId:
            gamePlayer._id,

          description:
           `Prize for ${claimedGame.name} - ${pattern}`,
        },
      ],
      {
        session,
      }
    );

    // 15. Commit
    await session.commitTransaction();

    // Game is already committed.
    // These happen afterward.
    stopAutomaticCaller(
      gameId
    );

    await scheduleNextGame(
  claimedGame
);

    return {
  status:
    "WINNER",

  game: {
    id:
      claimedGame._id,

    name:
      claimedGame.name,

    status:
      claimedGame.status,

    prizePool:
      claimedGame.prizePool,

    completedAt:
      claimedGame.completedAt,
  },

      winner: {
        playerId,

        gamePlayerId:
          gamePlayer._id,

        cardId:
          card._id,

        cardNumber:
          card.cardNumber,

        pattern,

        prizeAmount,
      },

      wallet: {
        winningBalanceBefore,
        winningBalanceAfter,
      },
    };

 } catch (error: any) {

  if (
    session.inTransaction()
  ) {
    await session.abortTransaction();
  }


  /* =========================================
     RETRY MONGODB WRITE CONFLICT
  ========================================= */

  if (
    isRetryableTransactionError(
      error
    ) &&
    retryAttempt < 5
  ) {

    console.warn(
      `[BINGO] Write conflict. Retrying claim ${
        retryAttempt + 1
      }/5`
    );


    /*
     * Short increasing delay:
     *
     * 50ms
     * 100ms
     * 150ms
     * ...
     */
    await wait(
      50 *
        (
          retryAttempt +
          1
        )
    );


    return claimBingo(
      gameId,
      playerId,
      retryAttempt + 1
    );
  }


  throw error;

} finally {

  await session.endSession();

}
};

export const getCurrentGame = async () => {

  const game =
    await Game.findOne({
      status: {
        $in: [
          "waiting",
          "active",
        ],
      },
    }).sort({
      createdAt: -1,
    });


  /*
   * No current game is a normal state,
   * especially when Automatic Mode is OFF.
   */
  return game;
};

/* =========================================================
   GET GAME WINNERS
========================================================= */

export const getGameWinners =
  async (
    gameId: string,
    requesterId: string
  ) => {

    /*
     * 1. Game must exist
     */
    const game =
      await Game.findById(
        gameId
      ).select(
        [
          "name",
          "status",
          "calledNumbers",
          "winningPattern",
          "prizePool",
        ].join(" ")
      );


    if (!game) {
      throw new Error(
        "Game not found"
      );
    }


    /*
     * 2. Only somebody who actually
     * participated in the game may
     * inspect the winner.
     *
     * This is important because the
     * response contains phone number.
     */
    const requester =
      await GamePlayer.findOne({
        gameId:
          game._id,

        playerId:
          requesterId,
      }).select("_id");


    if (!requester) {
      throw new Error(
        "Only players who participated in this game can view winner details"
      );
    }


    /*
     * 3. Find winner(s)
     *
     * Array is used so the frontend
     * remains ready if multiple-winner
     * support is added later.
     */
    const winnerRows =
      await GamePlayer.find({
        gameId:
          game._id,

        status:
          "won",
      })
        .populate({
          path:
            "playerId",

          select:
            "fullName phone",
        })
        .populate({
          path:
            "winningCardId",

          select:
            "cardNumber numbers",
        })
        .populate({
          /*
           * Legacy fallback
           */
          path:
            "cardId",

          select:
            "cardNumber numbers",
        })
        .sort({
          wonAt: 1,
          createdAt: 1,
        });


    /*
     * 4. Shape safe response
     */
    const winners =
      winnerRows.map(
        (
          row: any
        ) => {

          const player =
            row.playerId;

          /*
           * Prefer the exact persisted
           * winning card.
           *
           * cardId is only fallback for
           * older game records.
           */
          const card =
            row.winningCardId ||
            row.cardId;


          return {
            gamePlayerId:
              row._id,

            player: {
              id:
                player?._id ||
                null,

              fullName:
                player?.fullName ||
                "Player",

              phone:
                player?.phone ||
                "",
            },

            card: card
              ? {
                  id:
                    card._id,

                  cardNumber:
                    card.cardNumber,

                  numbers:
                    card.numbers,
                }
              : null,

            pattern:
              row.winningPattern ||
              game.winningPattern ||
              null,

            prizeAmount:
              Number(
                row.prizeAmount ||
                  0
              ),

            wonAt:
              row.wonAt ||
              row.updatedAt,
          };
        }
      );


    return {
      game: {
        id:
          game._id,

        name:
          game.name,

        status:
          game.status,

        prizePool:
          game.prizePool,

        winningPattern:
          game.winningPattern,

        calledNumbers:
          game.calledNumbers ||
          [],
      },

      winnerCount:
        winners.length,

      winners,
    };
  };