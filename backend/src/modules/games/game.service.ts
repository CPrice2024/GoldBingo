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
}

export const createNewGame = async (
  data: CreateGameInput
) => {
  if (!data.name?.trim()) {
    throw new Error("Game name is required");
  }

  if (
    typeof data.entryFee !== "number" ||
    data.entryFee < 0
  ) {
    throw new Error(
      "Entry fee must be a valid non-negative number"
    );
  }

  if (
    typeof data.maxPlayers !== "number" ||
    data.maxPlayers <= 0
  ) {
    throw new Error(
      "Maximum players must be greater than zero"
    );
  }

  return createGame({
    name: data.name.trim(),
    entryFee: data.entryFee,
    maxPlayers: data.maxPlayers,
  });
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
    `[BINGO] Game ${game.name} completed`
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

  return {
    game: {
      id: game._id,
      name: game.name,
      entryFee: game.entryFee,
      maxPlayers: game.maxPlayers,
      currentPlayers:
        game.currentPlayers,
      prizePool: game.prizePool,
      status: game.status,
      calledNumbers:
        game.calledNumbers,
      startedAt:
        game.startedAt,
      completedAt:
        game.completedAt,
    },

    players,
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
  if (game.status !== "active") {
    throw new Error(
      "Game is not active"
    );
  }

  // 3. Validate pattern
  const validPatterns: BingoPattern[] = [
    "row",
    "column",
    "diagonal",
    "four_corners",
    "x",
    "blackout",
  ];

  if (
    !validPatterns.includes(pattern)
  ) {
    throw new Error(
      "Invalid Bingo pattern"
    );
  }

  // 4. Find player's game participation
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
    gamePlayer.status !== "active"
  ) {
    throw new Error(
      "Player is not active in this game"
    );
  }

 // 5. Get assigned card
const card = await Card.findById(
  gamePlayer.cardId
);

if (!card) {
  throw new Error(
    "No Bingo card assigned to this player"
  );
}

  // 6. Card must be assigned
  if (card.status !== "assigned") {
    throw new Error(
      "Bingo card is not active"
    );
  }

  // 7. Check pattern
  const hasBingo =
    isPatternMatched(
      card.numbers,
      game.calledNumbers,
      pattern
    );

  return {
    hasBingo,
    pattern,

    card: {
      id: card._id,
      cardNumber:
        card.cardNumber,
      numbers:
        card.numbers,
    },

    calledNumbers:
      game.calledNumbers,
  };
};
export const claimBingo = async (
  gameId: string,
  playerId: string,
  pattern: BingoPattern
) => {
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

    // 2. Validate pattern
    const validPatterns: BingoPattern[] = [
      "row",
      "column",
      "diagonal",
      "four_corners",
      "x",
      "blackout",
    ];

    if (
      !validPatterns.includes(pattern)
    ) {
      throw new Error(
        "Invalid Bingo pattern"
      );
    }

    // 3. Find player inside transaction
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

    // 4. Player must be active
    if (
      gamePlayer.status !== "active"
    ) {
      throw new Error(
        "Player is not active in this game"
      );
    }

    // 5. Get player's card
const card = await Card.findById(
  gamePlayer.cardId
).session(session);

if (!card) {
  throw new Error(
    "No Bingo card assigned to this player"
  );
}

    if (
      card.status !== "assigned"
    ) {
      throw new Error(
        "Bingo card is not active"
      );
    }

    // 6. Verify Bingo
    const hasBingo =
      isPatternMatched(
        card.numbers,
        game.calledNumbers,
        pattern
      );

    if (!hasBingo) {
      throw new Error(
        "Bingo pattern has not been completed"
      );
    }

    // 7. Get prize
    const prizeAmount =
      game.prizePool;

    if (prizeAmount <= 0) {
      throw new Error(
        "Game has no prize available"
      );
    }

    // 8. Get winner wallet
    const wallet =
      await Wallet.findOne({
        userId: playerId,
        status: "active",
      }).session(session);

    if (!wallet) {
      throw new Error(
        "Player wallet not found or inactive"
      );
    }

    // 9. Credit winner
    const balanceBefore =
      wallet.balance;

    const balanceAfter =
      balanceBefore +
      prizeAmount;

    wallet.balance =
      balanceAfter;

    await wallet.save({
      session,
    });

    // 10. Mark winner
    gamePlayer.status = "won";

    gamePlayer.prizeAmount =
      prizeAmount;

    await gamePlayer.save({
      session,
    });

    // 11. Mark winner card as used
    const winnerCardUpdate =
      await Card.updateOne(
        {
          _id: card._id,
          status: "assigned",
        },
        {
          $set: {
            status: "used",
          },
        },
        {
          session,
        }
      );

    if (
      winnerCardUpdate.modifiedCount !== 1
    ) {
      throw new Error(
        "Failed to mark winning card as used"
      );
    }

    // 12. Mark other active players as lost
    await GamePlayer.updateMany(
      {
        gameId: game._id,
        _id: {
          $ne: gamePlayer._id,
        },
        status: "active",
      },
      {
        $set: {
          status: "lost",
          prizeAmount: 0,
        },
      },
      {
        session,
      }
    );

  
const otherPlayers =
  await GamePlayer.find(
    {
      gameId: game._id,
      _id: {
        $ne: gamePlayer._id,
      },
      cardId: {
        $ne: null,
      },
    },
    {
      cardId: 1,
    }
  ).session(session);

const otherCardIds =
  otherPlayers
    .map((player) => player.cardId)
    .filter(
      (
        cardId
      ): cardId is mongoose.Types.ObjectId =>
        Boolean(cardId)
    );

// 14. Mark other assigned cards as used
if (otherCardIds.length > 0) {
  await Card.updateMany(
    {
      _id: {
        $in: otherCardIds,
      },
      status: "assigned",
    },
    {
      $set: {
        status: "used",
      },
    },
    {
      session,
    }
  );
}

    // 14. Complete game
    game.status = "completed";

    game.completedAt =
      new Date();

    await game.save({
      session,
    });

    // 15. Create winner transaction
    await Transaction.create(
      [
        {
          userId:
            new mongoose.Types.ObjectId(
              playerId
            ),

          type: "game_win",

          amount:
            prizeAmount,

          balanceBefore,

          balanceAfter,

          currency: "ETB",

          status: "completed",

          requestId:
            gamePlayer._id,

          description:
            `Bingo prize for ${game.name} - ${pattern}`,
        },
      ],
      {
        session,
      }
    );

    // 16. Commit everything
await session.commitTransaction();

// Stop the automatic caller for the completed game
stopAutomaticCaller(gameId);

// Schedule the next Bingo game
await scheduleNextGame(game);

return {
      game: {
        id: game._id,
        name: game.name,
        status: game.status,
        prizePool:
          game.prizePool,
        completedAt:
          game.completedAt,
      },

      winner: {
        playerId,
        gamePlayerId:
          gamePlayer._id,
        cardNumber:
          card.cardNumber,
        pattern,
        prizeAmount,
      },

      wallet: {
        balanceBefore,
        balanceAfter,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const getCurrentGame = async () => {
  const game = await Game.findOne({
    status: {
      $in: ["waiting", "active"],
    },
  }).sort({
    createdAt: -1,
  });

  if (!game) {
    throw new Error(
      "No Bingo game available"
    );
  }

  return game;
};