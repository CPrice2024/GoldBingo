import {
  createGame,
  findGameById,
  findGames,
  startGame as startGameRepository,
  callNumber as callNumberRepository,
} from "./game.repository";
import {
  sendNewGameNotification,
} from "../notifications/firebase.service";
import {
  startAutomaticCaller,
  stopAutomaticCaller,
  stopGameTimers,
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
  WinningPattern,
  isValidWinningPattern,
  getWinningPatternLabel,
} from "./game.patterns";

import {
  GameStatus,
  GameCallMode,
} from "./game.types";

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

  gameType?: 1 | -1;

  entryFee: number;

  maxPlayers: number;

  winningPattern?:
    WinningPattern;

  callMode?:
  GameCallMode;

  scheduledStartAt?:
    string | Date | null;

  prizeAmount?:
    number | null;

  callIntervalSeconds?: number;
}


interface UpdateGameInput {
  name?: string;

   gameType?: 1 | -1;

  entryFee?: number;

  maxPlayers?: number;

  winningPattern?:
    WinningPattern;

  callMode?:
  GameCallMode;

  scheduledStartAt?:
    string | Date | null;

  prizeAmount?:
    number | null;

  callIntervalSeconds?: number;
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
  const gameType:
  1 | -1 =
    data.gameType === -1
      ? -1
      : 1;


const effectiveEntryFee =
  gameType === -1
    ? 0
    : data.entryFee;

  if (
  typeof effectiveEntryFee !==
    "number" ||
  !Number.isFinite(
    effectiveEntryFee
  ) ||
  effectiveEntryFee < 0
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
/* =========================================
   BONUS GAME PRIZE
========================================= */

if (
  gameType === -1 &&
  (
    prizeAmount === null ||
    !Number.isFinite(
      prizeAmount
    ) ||
    prizeAmount <= 0
  )
) {
  throw new Error(
    "Bonus games require a prize amount greater than zero"
  );
}

const callMode:
  GameCallMode =
    data.callMode ??
    "automatic";


if (
  callMode !== "automatic" &&
  callMode !== "manual"
) {
  throw new Error(
    "Invalid number call mode"
  );
}
const callIntervalSeconds =
  Number(
    data.callIntervalSeconds ??
      15
  );


if (
  !Number.isFinite(
    callIntervalSeconds
  ) ||
  callIntervalSeconds < 1
) {
  throw new Error(
    "Call interval must be at least 1 second"
  );
}
const game =
  await createGame({
    name:
      data.name.trim(),

    gameType,

    entryFee:
      effectiveEntryFee,

    maxPlayers:
      data.maxPlayers,

    winningPattern,

    callMode,

    callIntervalSeconds,

    scheduledStartAt,

    prizeAmount,
  });


/* =========================================
   PUSH NOTIFICATION IMMEDIATELY
   WHEN NEW GAME IS CREATED
========================================= */

console.log(
  `[FCM] New game created | name=${game.name} | status=${game.status} | id=${game._id}`
);

try {
  const messageId =
    await sendNewGameNotification(
      game
    );

  console.log(
    `[FCM] Players notified immediately about new game ${game.name}`,
    messageId
  );
} catch (error) {
  console.error(
    `[FCM] Failed to notify players about new game ${game._id}:`,
    error
  );
}


/* =========================================
   SCHEDULE GAME START
========================================= */

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
   GAME TYPE
========================================= */

const currentGameType:
  1 | -1 =
    Number(
      game.gameType ?? 1
    ) === -1
      ? -1
      : 1;


const nextGameType:
  1 | -1 =
    data.gameType ===
      undefined
      ? currentGameType
      : data.gameType === -1
      ? -1
      : 1;


/*
 * Do not change game type
 * after players have joined.
 */
if (
  game.currentPlayers > 0 &&
  nextGameType !==
    currentGameType
) {
  throw new Error(
    "Game type cannot be changed after players have joined"
  );
}


game.gameType =
  nextGameType;

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
   BONUS GAME MUST HAVE PRIZE
========================================= */

const finalPrizeAmount =
  Number(
    game.prizeAmount ?? 0
  );


if (
  nextGameType === -1 &&
  (
    !Number.isFinite(
      finalPrizeAmount
    ) ||
    finalPrizeAmount <= 0
  )
) {
  throw new Error(
    "Bonus games require a prize amount greater than zero"
  );
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

   NORMAL = configured price
   BONUS  = always FREE
========================================= */

if (
  nextGameType === -1
) {

  game.entryFee = 0;

} else if (
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
   NUMBER CALL MODE
========================================= */

if (
  data.callMode !==
  undefined
) {

  if (
    data.callMode !==
      "automatic" &&
    data.callMode !==
      "manual"
  ) {

    throw new Error(
      "Invalid number call mode"
    );

  }


  game.callMode =
    data.callMode;

}

/* =========================================
   CALL INTERVAL
========================================= */

if (
  data.callIntervalSeconds !==
  undefined
) {

  const callIntervalSeconds =
    Number(
      data.callIntervalSeconds
    );


  if (
    !Number.isFinite(
      callIntervalSeconds
    ) ||
    callIntervalSeconds < 1
  ) {
    throw new Error(
      "Call interval must be at least 1 second"
    );
  }


  game.callIntervalSeconds =
    callIntervalSeconds;

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

/* =========================================================
   CANCEL WAITING GAME
========================================================= */

export const cancelWaitingGame =
  async (
    gameId: string
  ) => {

    const game =
      await findGameById(
        gameId
      );


    if (!game) {

      throw new Error(
        "Game not found"
      );

    }


    /* Only waiting games */

    if (
      game.status !==
      "waiting"
    ) {

      throw new Error(
        "Only waiting games can be cancelled"
      );

    }


    /*
     * Safe first version:
     * don't cancel games that already
     * collected player money.
     */

    if (
      Number(
        game.currentPlayers || 0
      ) > 0
    ) {

      throw new Error(
        "Cannot cancel a game after players have joined"
      );

    }


    /* Stop every local timer */

    stopGameTimers(
      gameId
    );


    /* Cancel game */

    game.status =
      "cancelled";

    game.joiningEndsAt =
      null;

    game.nextCallAt =
      null;


    await game.save();


    console.log(
      `[BINGO] ${game.name} cancelled by Admin`
    );


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

  /* =========================================
   NUMBER CALL MODE
========================================= */

const callMode =
  startedGame.callMode ??
  "automatic";


if (
  callMode === "manual"
) {

  /*
   * Manual calling uses the
   * same interval/countdown
   * as automatic calling.
   */
  const intervalSeconds =
    Math.max(
      1,
      Number(
        startedGame
          .callIntervalSeconds ??
          15
      )
    );


  startedGame.nextCallAt =
    new Date(
      Date.now() +
        intervalSeconds *
          1000
    );


  await startedGame.save();


  console.log(
    `[BINGO] ${startedGame.name} started in MANUAL call mode`
  );

} else {

  /*
   * Existing automatic behavior.
   */
  startAutomaticCaller(
    gameId
  );

}


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


/* =========================================
   WINNER WINDOW = FREEZE NUMBERS
========================================= */

if (game.firstWinnerAt) {
  throw new Error(
    "Bingo number calling is stopped while the winner claim window is open"
  );
}

/* =========================================
   CALL MODE
========================================= */

const callMode =
  game.callMode ??
  "automatic";


/* =========================================
   MANUAL MODE
========================================= */

if (
  callMode === "manual"
) {

  /*
   * Admin must choose a number.
   */
  if (
    requestedNumber ===
    undefined
  ) {

    throw new Error(
      "Please select a Bingo number"
    );

  }


  /*
   * Enforce the same countdown
   * on the backend.
   */
  const nextCallTime =
    game.nextCallAt
      ? new Date(
          game.nextCallAt
        ).getTime()
      : 0;


  const now =
    Date.now();


  if (
    nextCallTime >
    now
  ) {

    const remainingSeconds =
      Math.ceil(
        (
          nextCallTime -
          now
        ) / 1000
      );


    throw new Error(
      `Please wait ${remainingSeconds} second${
        remainingSeconds === 1
          ? ""
          : "s"
      } before calling the next number`
    );

  }

}

/* =========================================
   AUTOMATIC MODE
========================================= */

if (
  callMode ===
  "automatic"
) {

  /*
   * Automatic games must never
   * accept a manually selected number.
   */
  if (
    requestedNumber !==
    undefined
  ) {

    throw new Error(
      "Manual number selection is disabled for automatic games"
    );

  }


  /* =========================================
     VERIFY CALL DEADLINE

     This is important when several
     Node processes are running.

     A process may call a number only
     when the persisted DB deadline
     has actually arrived.
  ========================================= */

  const scheduledCallTime =
    game.nextCallAt
      ? new Date(
          game.nextCallAt
        ).getTime()
      : 0;


  if (
    !Number.isFinite(
      scheduledCallTime
    ) ||
    scheduledCallTime <= 0
  ) {

    throw new Error(
      "Automatic number call is not scheduled"
    );

  }


  const now =
    Date.now();


  /*
   * Small 500ms tolerance handles
   * normal timer/clock differences.
   */
  if (
    scheduledCallTime >
    now + 500
  ) {

    throw new Error(
      "Automatic number call is not due yet"
    );

  }

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

  /* =========================================
   EXACT CALL SLOT

   MongoDB compares this value before
   accepting the number.
========================================= */

const expectedNextCallAt =
  game.nextCallAt
    ? new Date(
        game.nextCallAt
      )
    : null;


const updatedGame =
  await callNumberRepository(
    gameId,
    number,
    expectedNextCallAt
  );

if (!updatedGame) {
  throw new Error(
    "Failed to call Bingo number. Please try again."
  );
}


/* =========================================
   ALL 75 NUMBERS CALLED
   COMPLETE GAME
========================================= */

if (
  updatedGame.calledNumbers.length >= 75
) {

  const completedGame =
    await completeGame(
      gameId
    );


  if (completedGame) {

    await scheduleNextGame(
      completedGame
    );

  }


  return {
    number,

    calledNumbers:
      updatedGame.calledNumbers,

    game:
      completedGame ??
      updatedGame,
  };
}


/* =========================================
   RESET MANUAL COUNTDOWN
========================================= */

if (
  callMode === "manual"
) {

  const intervalSeconds =
    Math.max(
      1,
      Number(
        updatedGame
          .callIntervalSeconds ??
          game.callIntervalSeconds ??
          15
      )
    );


  updatedGame.nextCallAt =
    new Date(
      Date.now() +
        intervalSeconds *
          1000
    );


  await updatedGame.save();

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

  const session =
    await mongoose.startSession();


  try {

    session.startTransaction();


    const game =
      await Game.findOne({
        _id: gameId,

        status:
          "active",
      }).session(
        session
      );


    if (!game) {

      await session.abortTransaction();

      return null;

    }


    const completedAt =
      new Date();


    /* =========================================
       GET GAME PARTICIPANTS
    ========================================= */

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
      ).session(
        session
      );


    /* =========================================
       GET ALL CARDS USED BY THIS GAME
    ========================================= */

    const allGameCardIds =
      participants.flatMap(
        (participant: any) =>
          getParticipationCardIds(
            participant
          )
      );


    /* =========================================
       MARK ACTIVE PLAYERS AS LOST
       NO WINNER AFTER 75 NUMBERS
    ========================================= */

    await GamePlayer.updateMany(
      {
        gameId:
          game._id,

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


    /* =========================================
       RELEASE CARDS BACK TO POOL
    ========================================= */

    if (
      allGameCardIds.length > 0
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
              "available",
          },
        },
        {
          session,
        }
      );

    }


    /* =========================================
       COMPLETE GAME
    ========================================= */

    game.status =
      "completed";

    game.completedAt =
      completedAt;

    game.nextCallAt =
      null;


    await game.save({
      session,
    });


    await session.commitTransaction();


    stopAutomaticCaller(
      gameId
    );


    console.log(
      `[BINGO] ${game.name} completed after all 75 numbers were called`
    );


    return game;

  } catch (error) {

    if (
      session.inTransaction()
    ) {

      await session.abortTransaction();

    }


    throw error;

  } finally {

    await session.endSession();

  }

};

/* =========================================================
   COMPLETE GAME IF EVERY CARD IS BLOCKED

   Rules:
   - game must still be active
   - no winner window may already exist
   - every joined card must be blocked
   - stop caller
   - complete game
   - schedule next game
========================================================= */

const completeGameIfAllCardsBlocked =
  async (
    gameId: string
  ): Promise<boolean> => {

    try {

      const liveGame =
        await Game.findOne({
          _id:
            gameId,

          status:
            "active",
        }).select(
          "_id name status firstWinnerAt"
        );


      if (!liveGame) {
        return false;
      }


      /*
       * A winner already exists.
       *
       * In that case the normal
       * winner settlement flow owns
       * game completion.
       */
      if (
        liveGame.firstWinnerAt
      ) {
        return false;
      }


      const participants =
        await GamePlayer.find({
          gameId:
            liveGame._id,
        })
          .select(
            "cardIds cardId blockedCardIds"
          )
          .lean();


      if (
        participants.length === 0
      ) {
        return false;
      }


      const allCardIds =
        new Set<string>();


      const allBlockedCardIds =
        new Set<string>();


      for (
        const participant of
        participants as any[]
      ) {

        /*
         * Every card originally joined
         * by this participation.
         */
        const participationCards =
          getParticipationCardIds(
            participant
          );


        for (
          const cardId of
          participationCards
        ) {

          const normalizedId =
            String(
              (cardId as any)?._id ??
                cardId
            );


          if (
            normalizedId
          ) {
            allCardIds.add(
              normalizedId
            );
          }

        }


        /*
         * Cards blocked by false /
         * missed Bingo.
         */
        const blockedCards =
          Array.isArray(
            participant.blockedCardIds
          )
            ? participant.blockedCardIds
            : [];


        for (
          const blockedId of
          blockedCards
        ) {

          const normalizedId =
            String(
              (blockedId as any)?._id ??
                blockedId
            );


          if (
            normalizedId
          ) {
            allBlockedCardIds.add(
              normalizedId
            );
          }

        }

      }


      if (
        allCardIds.size === 0
      ) {
        return false;
      }


      const everyCardBlocked =
        Array.from(
          allCardIds
        ).every(
          (cardId) =>
            allBlockedCardIds.has(
              cardId
            )
        );


      if (
        !everyCardBlocked
      ) {
        return false;
      }


      console.log(
        `[BINGO] Every card in ${liveGame.name} is blocked. Completing game.`
      );


      /* =========================================
         STOP NUMBER CALLING IMMEDIATELY
      ========================================= */

      stopGameTimers(
        gameId
      );


      /* =========================================
         NORMAL NO-WINNER COMPLETION

         This already:
         - marks active players lost
         - releases cards
         - sets status completed
      ========================================= */

      const completedGame =
        await completeGame(
          gameId
        );


      if (
        !completedGame
      ) {
        return false;
      }


      /* =========================================
         NEXT GAME
      ========================================= */

      await scheduleNextGame(
        completedGame
      );


      console.log(
        `[BINGO] ${completedGame.name} completed because no claimable cards remain`
      );


      return true;


    } catch (error) {

      console.error(
        "[BINGO] Failed to check all-blocked game:",
        error
      );


      /*
       * False Bingo itself was already
       * saved, so do not convert that
       * successful claim request into 400.
       */
      return false;

    }

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

    blockedCardIds: {
      $exists:
        true,

      $ne:
        [],
    },
  })
    .populate({
      path:
        "playerId",

      select:
        "fullName phone",
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

  phone:
    row.playerId?.phone ??
    null,
},

      blockedAt:
        row.blockedAt,

      blockedReason:
        row.blockedReason ??
        "False Bingo",

        blockedCardClaims:
  Array.isArray(
    row.blockedCardClaims
  )
    ? row.blockedCardClaims.map(
        (claim: any) => ({
          cardId:
            claim?.cardId?._id ??
            claim?.cardId,

          calledNumber:
            claim?.calledNumber ??
            null,

          blockedAt:
            claim?.blockedAt ??
            null,

          reason:
            claim?.reason ??
            "False Bingo",
        })
      )
    : [],

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

/* =========================================
   PUBLIC BLOCKED CARDS
   ONE RECORD PER BLOCKED CARD
========================================= */

const blockedCards =
  blockedPlayers.flatMap(
    (blockedPlayer: any) => {

      const cards =
        Array.isArray(
          blockedPlayer.cards
        )
          ? blockedPlayer.cards
          : [];

      return cards.map(
  (card: any) => {

    const claim =
      Array.isArray(
        blockedPlayer
          ?.blockedCardClaims
      )
        ? blockedPlayer
            .blockedCardClaims
            .find(
              (item: any) =>
                String(
                  item?.cardId?._id ??
                  item?.cardId
                ) ===
                String(
                  card?.id ??
                  card?._id
                )
            )
        : null;


    return {
      gamePlayerId:
        blockedPlayer.gamePlayerId,

      player:
        blockedPlayer.player,

      blockedAt:
        claim?.blockedAt ??
        blockedPlayer.blockedAt,

      blockedReason:
        claim?.reason ??
        blockedPlayer.blockedReason,

      calledNumber:
        claim?.calledNumber ??
        null,

      card: {
        id:
          card.id,

        cardNumber:
          card.cardNumber,

        numbers:
          card.numbers,
      },
    };

  }
);
    }
  );
/* =========================================
   PUBLIC WINNER CARDS

   Visible to:
   - joined players
   - non-joined players
   - spectators

   Do NOT expose phone number here.
========================================= */

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
  path:
    "winningCardIds",

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


/* =========================================
   ONE PUBLIC RECORD PER WINNING CARD
========================================= */

const publicWinnerEntries =
  winnerRows.flatMap(
    (row: any) => {

      let cards:
        any[] = [];


      /*
       * New multi-card winners.
       */
      if (
        Array.isArray(
          row.winningCardIds
        ) &&
        row.winningCardIds.length > 0
      ) {

        cards =
          row.winningCardIds;

      } else {

        /*
         * Legacy fallback.
         */
        const legacyCard =
          row.winningCardId ||
          row.cardId;

        if (legacyCard) {
          cards = [
            legacyCard,
          ];
        }
      }


      return cards.map(
        (card: any) => ({
          row,
          card,
        })
      );
    }
  );


/* =========================================
   CALCULATE PRIZE PER WINNING CARD
========================================= */

const publicWinnerCount =
  publicWinnerEntries.length;


const publicTotalPrize =
  Number(
    game.prizeAmount ??
    game.prizePool ??
    0
  );


const publicTotalCents =
  Math.round(
    publicTotalPrize * 100
  );


const publicBaseCents =
  publicWinnerCount > 0
    ? Math.floor(
        publicTotalCents /
        publicWinnerCount
      )
    : 0;


const publicRemainderCents =
  publicWinnerCount > 0
    ? publicTotalCents -
      publicBaseCents *
        publicWinnerCount
    : 0;


/* =========================================
   PUBLIC WINNERS
========================================= */

const publicWinners =
  publicWinnerEntries.map(
    (
      entry: any,
      index: number
    ) => {

      const row =
        entry.row;

      const card =
        entry.card;


      /*
       * During claim window payout
       * is still pending.
       */
      const cardPrizeAmount =
        game.payoutSettledAt
          ? (
              publicBaseCents +
              (
                index <
                publicRemainderCents
                  ? 1
                  : 0
              )
            ) / 100
          : 0;


      return {
        gamePlayerId:
          row._id,

        player: {
          id:
            row.playerId?._id ??
            null,

          fullName:
            row.playerId
              ?.fullName ??
            "Player",

          phone:
            row.playerId
              ?.phone ??
            null,
        },

        card: {
          id:
            card._id,

          cardNumber:
            card.cardNumber,

          numbers:
            card.numbers,
        },

        pattern:
          row.winningPattern ||
          game.winningPattern ||
          null,

        /*
         * Prize belonging to THIS card.
         */
        prizeAmount:
          cardPrizeAmount,

        /*
         * Total amount earned by this
         * player from all winning cards.
         */
        playerTotalPrizeAmount:
          Number(
            row.prizeAmount ||
            0
          ),

        prizePending:
          !game.payoutSettledAt,

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

gameType:
  Number(
    game.gameType ?? 1
  ) === -1
    ? -1
    : 1,

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

callMode:
  game.callMode ??
  "automatic",

joiningEndsAt:
  game.joiningEndsAt,

nextCallAt:
  game.nextCallAt,

    startedAt:
  game.startedAt,

completedAt:
  game.completedAt,

/* =========================================
   MULTI-WINNER WINDOW
========================================= */

firstWinnerAt:
  game.firstWinnerAt,

winnerClaimEndsAt:
  game.winnerClaimEndsAt,

winnerCount:
  game.winnerCount ?? 0,

maxWinners:
  MAX_GAME_WINNERS,

payoutSettledAt:
  game.payoutSettledAt,
  },

  players,

  blockedPlayers,
  blockedCards,
  publicWinners,
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
/* =========================================================
   MULTI-WINNER SETTINGS
========================================================= */

const WINNER_CLAIM_WINDOW_MS =
  30 * 1000;

const MAX_GAME_WINNERS =
  10;
const WINNER_FINALIZATION_RETRY_MS =
  5 * 1000;
const winnerClaimTimers =
  new Map<
    string,
    NodeJS.Timeout
  >();


/* =========================================================
   CLEAR WINNER TIMER
========================================================= */

const clearWinnerClaimTimer = (
  gameId: string
) => {
  const timer =
    winnerClaimTimers.get(
      gameId
    );

  if (timer) {
    clearTimeout(timer);

    winnerClaimTimers.delete(
      gameId
    );
  }
};


/* =========================================================
   SCHEDULE WINNER SETTLEMENT
========================================================= */

export const scheduleWinnerClaimFinalization =
  async (
    gameId: string
  ) => {

    /*
     * Always replace an old local
     * timer with the DB deadline.
     */
    clearWinnerClaimTimer(
      gameId
    );

    const game =
      await Game.findById(
        gameId
      ).select(
        [
          "status",
          "winnerClaimEndsAt",
          "payoutSettledAt",
        ].join(" ")
      );

    if (!game) {
      return;
    }

    if (
      game.status !==
      "active"
    ) {
      return;
    }

    if (
      game.payoutSettledAt
    ) {
      return;
    }

    if (
      !game.winnerClaimEndsAt
    ) {
      return;
    }

    const remainingMs =
      Math.max(
        0,
        new Date(
          game.winnerClaimEndsAt
        ).getTime() -
          Date.now()
      );

   const settle =
  async () => {

    winnerClaimTimers.delete(
      gameId
    );


    try {

      const result =
        await finalizeWinnerWindow(
          gameId
        );


      /*
       * null normally means:
       *
       * - another request already finalized
       * - game was cancelled
       * - game is no longer active
       *
       * Nothing else to retry.
       */
      if (!result) {

        console.log(
          `[BINGO] Winner finalization no longer required for ${gameId}`
        );

        return;
      }


      console.log(
        `[BINGO] Winner finalization completed for ${gameId}`
      );


    } catch (error) {

      console.error(
        `[BINGO] Failed to finalize winner window for ${gameId}:`,
        error
      );


      /* =========================================
         RECHECK DATABASE BEFORE RETRYING

         Never retry settlement blindly.
      ========================================= */

      const latestGame =
        await Game.findById(
          gameId
        ).select(
          [
            "status",
            "firstWinnerAt",
            "winnerClaimEndsAt",
            "payoutSettledAt",
          ].join(" ")
        );


      if (!latestGame) {

        console.log(
          `[BINGO] Finalization retry stopped. Game ${gameId} no longer exists.`
        );

        return;
      }


      /*
       * Game already finished/cancelled.
       */
      if (
        latestGame.status !==
        "active"
      ) {

        console.log(
          `[BINGO] Finalization retry stopped. Game ${gameId} is ${latestGame.status}.`
        );

        return;
      }


      /*
       * Prize already paid.
       */
      if (
        latestGame.payoutSettledAt
      ) {

        console.log(
          `[BINGO] Finalization retry stopped. Game ${gameId} is already settled.`
        );

        return;
      }


      /*
       * No winner means there is
       * nothing to settle.
       */
      if (
        !latestGame.firstWinnerAt
      ) {

        console.log(
          `[BINGO] Finalization retry stopped. Game ${gameId} has no winner lock.`
        );

        return;
      }


      /* =========================================
         RETRY AFTER 5 SECONDS

         Important:
         Do NOT resume number calling.
         The game stays frozen until
         settlement succeeds.
      ========================================= */

      console.warn(
        `[BINGO] Retrying winner finalization for ${gameId} in ${
          WINNER_FINALIZATION_RETRY_MS /
          1000
        } seconds`
      );


      const retryTimer =
        setTimeout(
          () => {

            winnerClaimTimers.delete(
              gameId
            );


            void scheduleWinnerClaimFinalization(
              gameId
            );

          },
          WINNER_FINALIZATION_RETRY_MS
        );


      winnerClaimTimers.set(
        gameId,
        retryTimer
      );

    }

  };

    /*
     * Deadline already passed.
     */
    if (
      remainingMs <= 0
    ) {
      await settle();
      return;
    }

    console.log(
      `[BINGO] Winner claim window: ${Math.ceil(
        remainingMs / 1000
      )} seconds remaining`
    );

    const timer =
      setTimeout(
        () => {
          void settle();
        },
        remainingMs
      );

    winnerClaimTimers.set(
      gameId,
      timer
    );
  };


/* =========================================================
   FINALIZE MULTI-WINNER GAME
========================================================= */

export const finalizeWinnerWindow =
  async (
    gameId: string,
    retryAttempt = 0
  ): Promise<{
    game: any;
    winnerCount: number;
    totalPrize: number;
  } | null> => {

    const session =
      await mongoose.startSession();

    try {
      session.startTransaction();

      const settledAt =
        new Date();

      /*
       * Settlement lock.
       *
       * payoutSettledAt must still
       * be null. This prevents the
       * prize being paid twice.
       */
      const game =
        await Game.findOneAndUpdate(
          {
            _id:
              gameId,

            status:
              "active",

            firstWinnerAt: {
              $ne: null,
            },

            payoutSettledAt:
              null,
          },
          {
            $set: {
              payoutSettledAt:
                settledAt,
            },
          },
          {
            new: true,
            session,
          }
        );

      /*
       * Already settled or game
       * no longer active.
       */
      if (!game) {
        await session.abortTransaction();

        clearWinnerClaimTimer(
          gameId
        );

        return null;
      }

      /*
       * Winners were accepted during
       * the 30-second claim window.
       */
      const winnerRows =
  await GamePlayer.find({
    gameId:
      game._id,

    status:
      "won",
  })
    .sort({
      wonAt: 1,
      _id: 1,
    })
    .session(
      session
    );


/* =========================================
   ONE ENTRY = ONE WINNING CARD
========================================= */

const winningCardEntries =
  winnerRows.flatMap(
    (winner: any) => {

      const cardIds:
        any[] = [];


      /*
       * New multi-card winners.
       */
      if (
        Array.isArray(
          winner.winningCardIds
        ) &&
        winner.winningCardIds.length > 0
      ) {

        cardIds.push(
          ...winner.winningCardIds
        );

      } else if (
        winner.winningCardId
      ) {

        /*
         * Legacy fallback.
         */
        cardIds.push(
          winner.winningCardId
        );
      }


      return cardIds.map(
        (cardId: any) => ({
          winner,

          cardId:
            cardId?._id ??
            cardId,
        })
      );
    }
  )
  .filter(
    (entry: any) =>
      Boolean(
        entry.cardId
      )
  );


if (
  winningCardEntries.length === 0
) {
  throw new Error(
    "Cannot finalize game without a winning card"
  );
}


if (
  winningCardEntries.length >
  MAX_GAME_WINNERS
) {
  throw new Error(
    `Winning card count exceeds maximum of ${MAX_GAME_WINNERS}`
  );
}

      const totalPrize =
        Number(
          game.prizeAmount ??
            game.prizePool
        );

      if (
        !Number.isFinite(
          totalPrize
        ) ||
        totalPrize <= 0
      ) {
        throw new Error(
          "Game has no prize available"
        );
      }

      /*
       * Work in cents so the total
       * distributed prize always
       * equals the original prize.
       *
       * Example:
       * 1000 / 3
       * 333.34
       * 333.33
       * 333.33
       */
      const totalCents =
        Math.round(
          totalPrize * 100
        );

      const totalWinningCards =
  winningCardEntries.length;

const baseCents =
  Math.floor(
    totalCents /
      totalWinningCards
  );


const remainderCents =
  totalCents -
  baseCents *
    totalWinningCards;


   /* =========================================
   CALCULATE PAYOUT PER PLAYER

   Prize is divided PER WINNING CARD,
   then combined for each player's wallet.
========================================= */

const payoutByPlayer =
  new Map<
    string,
    {
      winner: any;
      totalCents: number;
      winningCardCount: number;
    }
  >();


for (
  let index = 0;
  index <
  winningCardEntries.length;
  index++
) {

  const entry =
    winningCardEntries[index];


  /*
   * Each winning card receives
   * one equal prize share.
   */
  const cardPrizeCents =
    baseCents +
    (
      index <
      remainderCents
        ? 1
        : 0
    );


  const playerKey =
    String(
      entry.winner._id
    );


  const existing =
    payoutByPlayer.get(
      playerKey
    );


  if (existing) {

    existing.totalCents +=
      cardPrizeCents;

    existing.winningCardCount +=
      1;

  } else {

    payoutByPlayer.set(
      playerKey,
      {
        winner:
          entry.winner,

        totalCents:
          cardPrizeCents,

        winningCardCount:
          1,
      }
    );

  }
}


/* =========================================
   CREDIT PLAYER WALLETS
========================================= */

for (
  const payout of
  payoutByPlayer.values()
) {

  const winner =
    payout.winner;


  const winnerPrize =
    payout.totalCents /
    100;


  const wallet =
    await Wallet.findOne({
      userId:
        winner.playerId,

      status:
        "active",
    }).session(
      session
    );


  if (!wallet) {
    throw new Error(
      `Winner wallet not found for ${winner.playerId}`
    );
  }


  const balanceBefore =
    Number(
      wallet.winningBalance ??
        0
    );


  const balanceAfter =
    balanceBefore +
    winnerPrize;


  wallet.winningBalance =
    balanceAfter;


  await wallet.save({
    session,
  });


  /*
   * prizeAmount now means:
   *
   * total prize won by this player
   * from all winning cards.
   */
  winner.prizeAmount =
    winnerPrize;


  await winner.save({
    session,
  });


  await Transaction.create(
    [
      {
        userId:
          winner.playerId,

        type:
          "game_win",

        amount:
          winnerPrize,

        balanceBefore,

        balanceAfter,

        currency:
          "ETB",

        status:
          "completed",

        requestId:
          winner._id,

        description:
          `Prize for ${game.name} - ${payout.winningCardCount} winning card${
            payout.winningCardCount === 1
              ? ""
              : "s"
          } out of ${winningCardEntries.length} total winning cards`,
      },
    ],
    {
      session,
    }
  );
}
      /* =========================================
         MARK NON-WINNERS LOST
      ========================================= */

      await GamePlayer.updateMany(
        {
          gameId:
            game._id,

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


      /* =========================================
         GET ALL GAME CARDS
      ========================================= */

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
        ).session(
          session
        );

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

            /*
             * Legacy card support.
             */
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


      /* =========================================
         RELEASE CARDS
      ========================================= */

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
                "available",
            },
          },
          {
            session,
          }
        );
      }


      /* =========================================
         COMPLETE GAME
      ========================================= */

      game.status =
        "completed";

      game.completedAt =
        settledAt;

      game.winnerCount =
  winningCardEntries.length;

      game.payoutSettledAt =
        settledAt;

      game.nextCallAt =
        null;

      await game.save({
        session,
      });

      await session.commitTransaction();

      clearWinnerClaimTimer(
        gameId
      );

      stopAutomaticCaller(
        gameId
      );

      console.log(
  `[BINGO] ${game.name} finalized with ${winningCardEntries.length} winning card${
    winningCardEntries.length === 1
      ? ""
      : "s"
  }`
);

      console.log(
  `[BINGO] Prize ${totalPrize} ETB divided between ${winningCardEntries.length} winning card${
    winningCardEntries.length === 1
      ? ""
      : "s"
  }`
);

      /*
       * Only after settlement is
       * committed create next game.
       */
      await scheduleNextGame(
        game
      );

      return {
  game,

  winnerCount:
    winningCardEntries.length,

  totalPrize,
};

    } catch (error: any) {

      if (
        session.inTransaction()
      ) {
        await session.abortTransaction();
      }

      /*
       * Same write-conflict protection
       * already used by claimBingo().
       */
      if (
        isRetryableTransactionError(
          error
        ) &&
        retryAttempt < 5
      ) {
        await wait(
          50 *
            (
              retryAttempt +
              1
            )
        );

        return finalizeWinnerWindow(
          gameId,
          retryAttempt + 1
        );
      }

      throw error;

    } finally {
      await session.endSession();
    }
  };
/* =========================================
   CLAIM BINGO
========================================= */

export const claimBingo = async (
  gameId: string,
  playerId: string,
  cardId: string,
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
  gamePlayer.status !== "active" &&
  gamePlayer.status !== "won"
) {
  throw new Error(
    "Player is not eligible to claim Bingo in this game"
  );
}


/* =========================================
   EXACT CARD VALIDATION
========================================= */

if (
  !mongoose.Types.ObjectId.isValid(
    cardId
  )
) {
  throw new Error(
    "Invalid Bingo card ID"
  );
}


/* =========================================
   GET PLAYER CARDS
========================================= */

const assignedCardIds =
  getParticipationCardIds(
    gamePlayer
  );


if (
  assignedCardIds.length === 0
) {
  throw new Error(
    "No Bingo cards assigned to this player"
  );
}


/* =========================================
   VERIFY CARD OWNERSHIP
========================================= */

const ownsCard =
  assignedCardIds.some(
    (assignedId: any) =>
      String(
        assignedId?._id ??
          assignedId
      ) ===
      String(cardId)
  );


if (!ownsCard) {

  await session.abortTransaction();

  throw new Error(
    "This Bingo card does not belong to this player"
  );
}
/* =========================================
   CHECK IF THIS CARD ALREADY WON
========================================= */

const currentWinningCardIds =
  Array.isArray(
    gamePlayer.winningCardIds
  )
    ? gamePlayer.winningCardIds
    : [];


const cardAlreadyWon =
  currentWinningCardIds.some(
    (winningId: any) =>
      String(
        winningId?._id ??
          winningId
      ) ===
      String(cardId)
  );


if (cardAlreadyWon) {

  await session.abortTransaction();

  return {
    status:
      "WINNER_ALREADY",

    message:
      "This Bingo card has already been accepted as a winner.",

    playerId,

    gamePlayerId:
      gamePlayer._id,

    cardId,
  };
}

/* =========================================
   CHECK IF THIS CARD IS ALREADY BLOCKED
========================================= */

const currentBlockedCardIds =
  Array.isArray(
    gamePlayer.blockedCardIds
  )
    ? gamePlayer.blockedCardIds
    : [];


const cardAlreadyBlocked =
  currentBlockedCardIds.some(
    (blockedId: any) =>
      String(
        blockedId?._id ??
          blockedId
      ) ===
      String(cardId)
  );


if (cardAlreadyBlocked) {

  await session.abortTransaction();

  return {
    status:
      "BLOCKED_ALREADY",

    message:
      "This Bingo card is already blocked.",

    playerId,

    gamePlayerId:
      gamePlayer._id,

    cardId,
  };
}


/* =========================================
   LOAD EXACT CLICKED CARD
========================================= */

const card =
  await Card.findOne({
    _id:
      cardId,

    status:
      "assigned",
  }).session(
    session
  );


if (!card) {

  throw new Error(
    "This Bingo card is not active"
  );
}


/* =========================================
   CHECK ONLY THIS CARD
========================================= */

/* =========================================
   STRICT BINGO CALL VALIDATION
========================================= */

const calledNumbers =
  Array.isArray(
    game.calledNumbers
  )
    ? game.calledNumbers
        .map((number: any) =>
          Number(number)
        )
        .filter((number: number) =>
          Number.isFinite(number)
        )
    : [];


const currentCallIndex =
  calledNumbers.length - 1;


const currentCallNumber =
  currentCallIndex >= 0
    ? calledNumbers[
        currentCallIndex
      ]
    : null;


/*
 * Find the FIRST call where
 * this card became a valid winner.
 */
let firstWinningCallIndex =
  -1;

let firstWinningCallNumber:
  number | null = null;


for (
  let index = 0;
  index < calledNumbers.length;
  index += 1
) {

  const callsAtThatMoment =
    calledNumbers.slice(
      0,
      index + 1
    );


  const callNumber =
    calledNumbers[index];


  const wonAtThisCall =
    isPatternMatched(
      card.numbers,
      callsAtThatMoment,
      pattern,
      callNumber
    );


  if (wonAtThisCall) {

    firstWinningCallIndex =
      index;

    firstWinningCallNumber =
      callNumber;

    break;
  }
}


/*
 * Bingo is valid only on the exact
 * call that FIRST completed the pattern.
 */
const matched =
  firstWinningCallIndex >= 0 &&
  firstWinningCallIndex ===
    currentCallIndex;


/*
 * Card was already a winner,
 * but player allowed another call.
 */
const missedWinningCall =
  firstWinningCallIndex >= 0 &&
  firstWinningCallIndex <
    currentCallIndex;

/* =========================================
   FALSE BINGO
   BLOCK ONLY THIS CARD
========================================= */

if (!matched) {

  const now =
    new Date();

  const blockReason =
  missedWinningCall
    ? `Missed Bingo. Winning call ${firstWinningCallNumber} has already passed.`
    : "False Bingo";
    /* =========================================
   SAVE EXACT NUMBER WHEN FALSE BINGO HAPPENED
========================================= */

const blockedCallNumber =
  currentCallNumber !== null &&
  Number.isFinite(
    currentCallNumber
  )
    ? currentCallNumber
    : null;


  gamePlayer.bingoClaimedAt =
    now;

  gamePlayer.blockedAt =
    now;

  gamePlayer.blockedReason =
  blockReason;

  /*
   * Keep every previously blocked
   * card and append only this one.
   */
  const blockedIds =
    Array.isArray(
      gamePlayer.blockedCardIds
    )
      ? gamePlayer.blockedCardIds
      : [];


  const alreadyExists =
    blockedIds.some(
      (blockedId: any) =>
        String(
          blockedId?._id ??
            blockedId
        ) ===
        String(
          card._id
        )
    );


  if (!alreadyExists) {

    blockedIds.push(
      card._id as mongoose.Types.ObjectId
    );

  }


  gamePlayer.blockedCardIds =
    blockedIds;
    
  /* =========================================
   SAVE PER-CARD FALSE BINGO DETAILS
========================================= */

const blockedClaims =
  Array.isArray(
    gamePlayer.blockedCardClaims
  )
    ? gamePlayer.blockedCardClaims
    : [];


const claimAlreadyExists =
  blockedClaims.some(
    (claim: any) =>
      String(
        claim?.cardId?._id ??
        claim?.cardId
      ) ===
      String(
        card._id
      )
  );


if (!claimAlreadyExists) {

  blockedClaims.push({
    cardId:
      card._id as
        mongoose.Types.ObjectId,

    calledNumber:
      blockedCallNumber,

    blockedAt:
      now,

    reason:
      blockReason,
  });

}

gamePlayer.blockedCardClaims =
  blockedClaims;

  /*
   * Legacy player-level flag becomes
   * true only if ALL of this player's
   * cards have been blocked.
   */
  const uniqueBlockedCards =
    new Set(
      blockedIds.map(
        (blockedId: any) =>
          String(
            blockedId?._id ??
              blockedId
          )
      )
    );


  gamePlayer.bingoBlocked =
    uniqueBlockedCards.size >=
    assignedCardIds.length;


  await gamePlayer.save({
    session,
  });


  await session.commitTransaction();


/* =========================================
   CHECK IF ANY CLAIMABLE CARD REMAINS
========================================= */

const gameCompletedBecauseAllCardsBlocked =
  await completeGameIfAllCardsBlocked(
    gameId
  );


return {
  status:
    "BLOCKED",

  gameCompleted:
    gameCompletedBecauseAllCardsBlocked,

    message:
  missedWinningCall
    ? `Missed Bingo. Card ${card.cardNumber} became a winner on call ${firstWinningCallNumber}, but the game already advanced to call ${currentCallNumber}. This card has been blocked.`
    : `False Bingo. Card ${card.cardNumber} has been blocked.`,
    blockedAt:
      now,

    playerId,

    gamePlayerId:
      gamePlayer._id,

    cardId:
      card._id,

    cardIds: [
      card._id,
    ],

    cards: [
      {
        id:
          card._id,

        cardNumber:
          card.cardNumber,

        numbers:
          card.numbers,
      },
    ],
  };
}

/* =========================================
   ACCEPT VALID BINGO
   MULTI-WINNER WINDOW
========================================= */

const winTime =
  new Date();

const firstWinner =
  !game.firstWinnerAt;

let claimedGame:
  any = null;


/* =========================================
   FIRST WINNER
========================================= */

if (firstWinner) {

  const claimEndsAt =
    new Date(
      winTime.getTime() +
        WINNER_CLAIM_WINDOW_MS
    );

  claimedGame =
    await Game.findOneAndUpdate(
      {
        _id:
          gameId,

        status:
          "active",

        payoutSettledAt:
          null,

        firstWinnerAt:
          null,
      },
      {
        $set: {
          firstWinnerAt:
            winTime,

          winnerClaimEndsAt:
            claimEndsAt,

          nextCallAt:
            null,
        },

        $inc: {
          winnerCount:
            1,
        },
      },
      {
        new:
          true,

        session,
      }
    );


  if (!claimedGame) {

    await session.abortTransaction();

    if (
      retryAttempt < 5
    ) {
      await wait(
        25 *
          (
            retryAttempt +
            1
          )
      );

      return claimBingo(
  gameId,
  playerId,
  cardId,
  retryAttempt + 1
);
    }

    return {
      status:
        "GAME_FINISHED",

      message:
        "Unable to register Bingo. Please try again.",
    };
  }

} else {

  /* =========================================
     ADDITIONAL WINNER
  ========================================= */

  const claimEndsAt =
    game.winnerClaimEndsAt
      ? new Date(
          game.winnerClaimEndsAt
        )
      : null;


  if (
    !claimEndsAt ||
    winTime.getTime() >
      claimEndsAt.getTime()
  ) {

    await session.abortTransaction();

    return {
      status:
        "GAME_FINISHED",

      message:
        "The 30-second Bingo winner window has closed.",
    };
  }


  claimedGame =
    await Game.findOneAndUpdate(
      {
        _id:
          gameId,

        status:
          "active",

        payoutSettledAt:
          null,

        firstWinnerAt: {
          $ne:
            null,
        },

        winnerClaimEndsAt: {
          $gt:
            winTime,
        },

        winnerCount: {
          $lt:
            MAX_GAME_WINNERS,
        },
      },
      {
        $inc: {
          winnerCount:
            1,
        },

        $set: {
          nextCallAt:
            null,
        },
      },
      {
        new:
          true,

        session,
      }
    );


  if (!claimedGame) {

    await session.abortTransaction();

    return {
      status:
        "GAME_FINISHED",

     message:
  "The Bingo winner window is closed or the maximum of 10 winning cards has been reached.",
    };
  }
}


/* =========================================
   MARK THIS CARD AS WINNER
========================================= */

gamePlayer.status =
  "won";

gamePlayer.prizeAmount =
  0;


/*
 * Store every winning card.
 */
const winningIds =
  Array.isArray(
    gamePlayer.winningCardIds
  )
    ? gamePlayer.winningCardIds
    : [];


const winningCardAlreadyExists =
  winningIds.some(
    (winningId: any) =>
      String(
        winningId?._id ??
          winningId
      ) ===
      String(
        card._id
      )
  );


if (
  !winningCardAlreadyExists
) {
  winningIds.push(
    card._id as
      mongoose.Types.ObjectId
  );
}


gamePlayer.winningCardIds =
  winningIds;


/*
 * Keep legacy winningCardId.
 *
 * Important:
 * only set it for the FIRST
 * winning card.
 */
if (
  !gamePlayer.winningCardId
) {
  gamePlayer.winningCardId =
    card._id as
      mongoose.Types.ObjectId;
}


gamePlayer.winningPattern =
  String(
    game.winningPattern ||
      pattern
  );


gamePlayer.bingoClaimedAt =
  winTime;


/*
 * Keep first winning time.
 */
if (
  !gamePlayer.wonAt
) {
  gamePlayer.wonAt =
    winTime;
}


await gamePlayer.save({
  session,
});


/* =========================================
   COMMIT WINNER
========================================= */

await session.commitTransaction();


/*
 * Stop calling numbers as soon
 * as the first valid Bingo exists.
 */
stopAutomaticCaller(
  gameId
);


const winnerCount =
  Number(
    claimedGame.winnerCount ||
      0
  );


/* =========================================
   MAX 10 WINNERS
========================================= */

if (
  winnerCount >=
  MAX_GAME_WINNERS
) {

  console.log(
    `[BINGO] Maximum ${MAX_GAME_WINNERS} winners reached. Finalizing game immediately.`
  );

  await finalizeWinnerWindow(
    gameId
  );

} else {

  /*
   * Use the original first-winner
   * 30-second deadline.
   */
  await scheduleWinnerClaimFinalization(
    gameId
  );
}


/* =========================================
   RESPONSE
========================================= */

return {
  status:
    "WINNER",

  message:
    firstWinner
      ? "Bingo accepted. The 30-second winner window is now open."
      : "Bingo accepted within the winner window.",

  game: {
    id:
      claimedGame._id,

    name:
      claimedGame.name,

    status:
      claimedGame.status,

    prizePool:
      claimedGame.prizePool,

    firstWinnerAt:
      claimedGame.firstWinnerAt,

    winnerClaimEndsAt:
      claimedGame.winnerClaimEndsAt,

    winnerCount:
      claimedGame.winnerCount,

    maxWinners:
      MAX_GAME_WINNERS,
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

    prizeAmount:
      0,

    prizePending:
      true,

    claimedAt:
      winTime,
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
  cardId,
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
    "prizeAmount",
    "firstWinnerAt",
    "winnerClaimEndsAt",
    "winnerCount",
    "payoutSettledAt",
    "completedAt",
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
    /* =========================================
   ONE WINNER ENTRY PER WINNING CARD
========================================= */

const winnerEntries =
  winnerRows.flatMap(
    (row: any) => {

      let cards:
        any[] = [];


      /*
       * New multi-card winners.
       */
      if (
        Array.isArray(
          row.winningCardIds
        ) &&
        row.winningCardIds.length > 0
      ) {

        cards =
          row.winningCardIds;

      } else {

        /*
         * Legacy fallback.
         */
        const legacyCard =
          row.winningCardId ||
          row.cardId;


        if (legacyCard) {
          cards = [
            legacyCard,
          ];
        }
      }


      return cards.map(
        (card: any) => ({
          row,
          card,
        })
      );
    }
  );


/* =========================================
   PRIZE PER WINNING CARD
========================================= */

const totalWinningCards =
  winnerEntries.length;


const totalPrize =
  Number(
    game.prizeAmount ??
    game.prizePool ??
    0
  );


const totalCents =
  Math.round(
    totalPrize * 100
  );


const baseCents =
  totalWinningCards > 0
    ? Math.floor(
        totalCents /
        totalWinningCards
      )
    : 0;


const remainderCents =
  totalWinningCards > 0
    ? totalCents -
      baseCents *
        totalWinningCards
    : 0;


/* =========================================
   WINNERS RESPONSE
========================================= */

const winners =
  winnerEntries.map(
    (
      entry: any,
      index: number
    ) => {

      const row =
        entry.row;

      const card =
        entry.card;

      const player =
        row.playerId;


      /*
       * Only show final card prize
       * after payout settlement.
       */
      const cardPrizeAmount =
        game.payoutSettledAt
          ? (
              baseCents +
              (
                index <
                remainderCents
                  ? 1
                  : 0
              )
            ) / 100
          : 0;


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

        card: {
          id:
            card._id,

          cardNumber:
            card.cardNumber,

          numbers:
            card.numbers,
        },

        pattern:
          row.winningPattern ||
          game.winningPattern ||
          null,

        /*
         * Prize for THIS winning card.
         */
        prizeAmount:
          cardPrizeAmount,

        /*
         * Total prize earned by this player
         * from all of their winning cards.
         */
        playerTotalPrizeAmount:
          Number(
            row.prizeAmount ||
            0
          ),

        prizePending:
          !game.payoutSettledAt,

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

  prizeAmount:
    game.prizeAmount,

  winningPattern:
    game.winningPattern,

  calledNumbers:
    game.calledNumbers ||
    [],

  firstWinnerAt:
    game.firstWinnerAt,

  winnerClaimEndsAt:
    game.winnerClaimEndsAt,

  winnerCount:
    game.winnerCount ?? 0,

  maxWinners:
    MAX_GAME_WINNERS,

  payoutSettledAt:
    game.payoutSettledAt,

  completedAt:
    game.completedAt,
},

      winnerCount:
        winners.length,

      winners,
    };
  };

/* =========================================================
   CANCEL ACTIVE GAME

   IMPORTANT ORDER:
   1. Stop all timers
   2. Immediately mark game cancelled
   3. Refund players
   4. Release cards
   5. Cancel GamePlayer records
========================================================= */

export const cancelActiveGame = async (
  gameId: string
) => {

  if (
    !mongoose.Types.ObjectId.isValid(
      gameId
    )
  ) {
    throw new Error(
      "Invalid game ID"
    );
  }


  const gameObjectId =
    new mongoose.Types.ObjectId(
      gameId
    );


  /* =========================================
     1. FIND GAME BEFORE TRANSACTION
  ========================================= */

  const existingGame =
    await Game.findById(
      gameObjectId
    );


  if (!existingGame) {
    throw new Error(
      "Game not found"
    );
  }


  /*
   * Never undo an already-paid game.
   */
  if (
    existingGame.payoutSettledAt
  ) {
    throw new Error(
      "This game has already been settled and cannot be cancelled"
    );
  }


  if (
    existingGame.status !==
      "active" &&
    existingGame.status !==
      "cancelled"
  ) {
    throw new Error(
      "Only an active game can be cancelled"
    );
  }


  /* =========================================
     2. STOP EVERY TIMER FIRST
  ========================================= */

  clearWinnerClaimTimer(
    gameId
  );


  stopGameTimers(
    gameId
  );


  /* =========================================
     3. IMMEDIATELY CANCEL GAME

     Do this OUTSIDE the refund transaction.

     This prevents automatic caller
     write-conflict with the refund process.
  ========================================= */

  let cancelledGame =
    existingGame;


  if (
    existingGame.status ===
    "active"
  ) {

    const updatedGame =
      await Game.findOneAndUpdate(
        {
          _id:
            gameObjectId,

          status:
            "active",

          payoutSettledAt:
            null,
        },

        {
          $set: {
            status:
              "cancelled",

            completedAt:
              new Date(),

            nextCallAt:
              null,

            joiningEndsAt:
              null,

            firstWinnerAt:
              null,

            winnerClaimEndsAt:
              null,

            currentPlayers:
              0,

            prizePool:
              0,
          },
        },

        {
          returnDocument:
            "after",
        }
      );


    if (!updatedGame) {

      const latestGame =
        await Game.findById(
          gameObjectId
        );


      if (
        !latestGame ||
        latestGame.status !==
          "cancelled"
      ) {
        throw new Error(
          "Failed to cancel active game"
        );
      }


      cancelledGame =
        latestGame;

    } else {

      cancelledGame =
        updatedGame;

    }

  }


  console.log(
    `[BINGO] ${cancelledGame.name} status changed to CANCELLED`
  );


  /* =========================================
     4. START REFUND TRANSACTION

     Game is already cancelled,
     therefore caller cannot continue.
  ========================================= */

  const session =
    await mongoose.startSession();


  let totalRefunded =
    0;

  let refundedEntries =
    0;

  let cardsReleased =
    0;

  let playersCancelled =
    0;


  try {

    session.startTransaction();


    /* =========================================
       5. GET ALL PARTICIPATIONS
    ========================================= */

    const gamePlayers =
      await GamePlayer.find({
        gameId:
          gameObjectId,
      }).session(
        session
      );


    const gamePlayerIds =
      gamePlayers.map(
        (player) =>
          player._id
      );


    /* =========================================
       6. FIND UNREFUNDED GAME ENTRY PAYMENTS

       Only "completed" transactions are
       refunded.

       After refund we change them to
       "reversed", preventing double refund.
    ========================================= */

    const entryTransactions =
      gamePlayerIds.length > 0
        ? await Transaction.find({
            type:
              "game_entry",

            requestId: {
              $in:
                gamePlayerIds,
            },

            status:
              "completed",
          }).session(
            session
          )
        : [];


    /* =========================================
       7. REFUND EACH PLAYER
    ========================================= */

    for (
      const entryTransaction of
      entryTransactions
    ) {

      const refundAmount =
        Number(
          entryTransaction.amount ||
            0
        );


      if (
        !Number.isFinite(
          refundAmount
        ) ||
        refundAmount <= 0
      ) {
        continue;
      }


      const wallet =
        await Wallet.findOne({
          userId:
            entryTransaction.userId,

          status:
            "active",
        }).session(
          session
        );


      if (!wallet) {
        throw new Error(
          `Player wallet not found for ${entryTransaction.userId}`
        );
      }


      /* =========================================
         DETERMINE ORIGINAL PAYMENT SOURCE

         Current join transaction contains:

         Used X ETB winnings and
         Y ETB deposit.
      ========================================= */

      let amountFromWinning =
        0;

      let amountFromDeposit =
        refundAmount;


      const transactionAny =
        entryTransaction as any;


      const storedWinning =
        Number(
          transactionAny
            .amountFromWinning
        );


      const storedDeposit =
        Number(
          transactionAny
            .amountFromDeposit
        );


      const storedSourceValid =
        Number.isFinite(
          storedWinning
        ) &&
        Number.isFinite(
          storedDeposit
        ) &&
        storedWinning >= 0 &&
        storedDeposit >= 0 &&
        Math.abs(
          storedWinning +
            storedDeposit -
            refundAmount
        ) <= 0.01;


      if (
        storedSourceValid
      ) {

        amountFromWinning =
          storedWinning;

        amountFromDeposit =
          storedDeposit;

      } else {

        const description =
          String(
            entryTransaction
              .description ||
              ""
          );


        const fundingMatch =
          description.match(
            /Used\s+([\d.]+)\s+ETB winnings and\s+([\d.]+)\s+ETB deposit/i
          );


        if (
          fundingMatch
        ) {

          const parsedWinning =
            Number(
              fundingMatch[1]
            );

          const parsedDeposit =
            Number(
              fundingMatch[2]
            );


          const parsedValid =
            Number.isFinite(
              parsedWinning
            ) &&
            Number.isFinite(
              parsedDeposit
            ) &&
            parsedWinning >= 0 &&
            parsedDeposit >= 0 &&
            Math.abs(
              parsedWinning +
                parsedDeposit -
                refundAmount
            ) <= 0.01;


          if (
            parsedValid
          ) {

            amountFromWinning =
              parsedWinning;

            amountFromDeposit =
              parsedDeposit;

          }

        }

      }


      /* =========================================
         8. RESTORE WALLET
      ========================================= */

      const depositBefore =
        Number(
          wallet.balance ||
            0
        );


      const winningsBefore =
        Number(
          wallet.winningBalance ||
            0
        );


      wallet.balance =
        depositBefore +
        amountFromDeposit;


      wallet.winningBalance =
        winningsBefore +
        amountFromWinning;


      await wallet.save({
        session,
      });


      /* =========================================
         9. MARK ORIGINAL ENTRY REVERSED

         For now DO NOT create another
         game_entry_reversal document.

         This removes another possible
         runtime validation failure and
         prevents double refund.
      ========================================= */

      const reversed =
        await Transaction.updateOne(
          {
            _id:
              entryTransaction._id,

            status:
              "completed",
          },

          {
            $set: {
              status:
                "reversed",

              description:
                `${entryTransaction.description || "Game entry"} | REFUNDED because ${cancelledGame.name} was cancelled.`,
            },
          },

          {
            session,
          }
        );


      if (
        reversed.modifiedCount !==
        1
      ) {
        throw new Error(
          `Failed to reverse game entry transaction ${entryTransaction._id}`
        );
      }


      totalRefunded +=
        refundAmount;


      refundedEntries +=
        1;


      console.log(
        `[BINGO] Refunded ${refundAmount} ETB to ${entryTransaction.userId}`
      );

    }


    /* =========================================
       10. COLLECT ASSIGNED CARDS
    ========================================= */

    const participationCardIds =
      gamePlayers.flatMap(
        (player) =>
          getParticipationCardIds(
            player
          )
      );


    const uniqueCardIds =
      [
        ...new Map(
          participationCardIds
            .filter(Boolean)
            .map(
              (cardId: any) => {

                const realId =
                  cardId?._id ??
                  cardId;


                return [
                  String(
                    realId
                  ),

                  realId,
                ];

              }
            )
        ).values(),
      ];


    /* =========================================
       11. RELEASE CARDS
    ========================================= */

    if (
      uniqueCardIds.length > 0
    ) {

      const cardResult =
        await Card.updateMany(
          {
            _id: {
              $in:
                uniqueCardIds,
            },

            status:
              "assigned",
          },

          {
            $set: {
              status:
                "available",
            },
          },

          {
            session,
          }
        );


      cardsReleased =
        cardResult.modifiedCount;

    }


    /* =========================================
       12. CANCEL GAME PLAYERS
    ========================================= */

    const playerResult =
      await GamePlayer.updateMany(
        {
          gameId:
            gameObjectId,

          status: {
            $ne:
              "cancelled",
          },
        },

        {
          $set: {
            status:
              "cancelled",

            prizeAmount:
              0,
          },
        },

        {
          session,
        }
      );


    playersCancelled =
      playerResult.modifiedCount;


    /* =========================================
       13. COMMIT REFUND
    ========================================= */

    await session.commitTransaction();


    console.log(
      `[BINGO] ACTIVE GAME CANCEL COMPLETE`
    );


    console.log(
      `[BINGO] Refunded: ${totalRefunded} ETB`
    );


    console.log(
      `[BINGO] Cards released: ${cardsReleased}`
    );


    console.log(
      `[BINGO] Players cancelled: ${playersCancelled}`
    );


  } catch (error) {

    if (
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }


    console.error(
      "[BINGO] CANCEL ACTIVE GAME REFUND ERROR:",
      error
    );


    throw error;


  } finally {

    await session.endSession();

  }


  /* =========================================
     14. CREATE NEXT GAME IF AUTO MODE IS ON
  ========================================= */

  await scheduleNextGame(
    cancelledGame
  );


  return {
    game: {
      id:
        cancelledGame._id,

      name:
        cancelledGame.name,

      status:
        "cancelled",
    },

    refund: {
      totalRefunded,

      refundedEntries,
    },

    cardsReleased,

    playersCancelled,
  };

};