import { Game } from "./game.model";
import { GameStatus } from "./game.types";
import type {
  WinningPattern,
} from "./game.patterns";

interface CreateGameData {
  name: string;

  entryFee: number;

  maxPlayers: number;

  winningPattern:
    WinningPattern;

  prizeAmount?:
    number | null;

  scheduledStartAt?:
    Date | null;
}

export const createGame = async (
  data: CreateGameData
) => {

  return Game.create({

    name:
      data.name,

    entryFee:
      data.entryFee,

    maxPlayers:
      data.maxPlayers,

    winningPattern:
      data.winningPattern,

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
  number: number
) => {
  return Game.findOneAndUpdate(
    {
      _id: gameId,
      status: "active",
      calledNumbers: {
        $ne: number,
      },
    },
    {
      $push: {
        calledNumbers: number,
      },
    },
    {
      new: true,
    }
  );
};
export const getGameState = async (
  gameId: string
) => {
  return Game.findById(gameId);
};