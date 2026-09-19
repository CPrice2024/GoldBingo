import { Game } from "./game.model";
import {
  GameStatus,
  GameCallMode,
} from "./game.types";
import type {
  WinningPattern,
} from "./game.patterns";

interface CreateGameData {
  name: string;
  gameType: 1 | -1;
  entryFee: number;
  maxPlayers: number;
  winningPattern:
    WinningPattern;
  callMode:
  GameCallMode;
  prizeAmount?:
    number | null;
  scheduledStartAt?:
    Date | null;
  callIntervalSeconds?: number;
}

export const createGame = async (
  data: CreateGameData
) => {

  return Game.create({

    name:
      data.name,

    gameType:
      data.gameType,

    entryFee:
      data.entryFee,

    maxPlayers:
      data.maxPlayers,

    winningPattern:
      data.winningPattern,
    
    callMode:
      data.callMode,

    callIntervalSeconds:
      data.callIntervalSeconds,

    currentPlayers:
      0,

    prizePool:
      0,

    prizeAmount:
      data.prizeAmount ??
      null,

    scheduledStartAt:
      data.scheduledStartAt ??
      null,

    status:
      "waiting",

    calledNumbers:
      [],

  });

};

export const findGameById = async (
  gameId: string
) => {
  return Game.findById(gameId);
};

export const findGames = async (
  status?: GameStatus
) => {
  const filter = status
    ? { status }
    : {};

  return Game.find(filter).sort({
    createdAt: -1,
  });
};

export const startGame = async (
  gameId: string
) => {
  return Game.findOneAndUpdate(
    {
      _id: gameId,
      status: "waiting",
    },
    {
      $set: {
        status: "active",
        startedAt: new Date(),
      },
    },
    {
      new: true,
    }
  );
};

export const callNumber = async (
  gameId: string,
  number: number,
  expectedNextCallAt:
    Date | null
) => {

  return Game.findOneAndUpdate(
    {
      _id:
        gameId,

      status:
        "active",

      firstWinnerAt:
        null,

      payoutSettledAt:
        null,

      /*
       * DISTRIBUTED CALL LOCK
       *
       * The game must still contain
       * the exact deadline that this
       * caller originally read.
       *
       * If another server already
       * called the number, this value
       * will no longer match.
       */
      nextCallAt:
        expectedNextCallAt,

      calledNumbers: {
        $ne:
          number,
      },
    },
    {
      $push: {
        calledNumbers:
          number,
      },

      /*
       * Consume the current call slot
       * atomically with the number.
       *
       * No second caller can consume
       * the same deadline.
       */
      $set: {
        nextCallAt:
          null,
      },
    },
    {
      new:
        true,
    }
  );

};
export const getGameState = async (
  gameId: string
) => {
  return Game.findById(gameId);
};