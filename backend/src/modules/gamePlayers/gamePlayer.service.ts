import mongoose from "mongoose";

import { User } from "../users/user.model";
import { Game } from "../games/game.model";
import { Wallet } from "../wallet/wallet.model";
import { Transaction } from "../transactions/transaction.model";

import { startJoiningWindow } from "../games/game.autoCaller";

import {
  createGamePlayer,
  findGamePlayer,
  findGamePlayers,
  countGamePlayers,
} from "./gamePlayer.repository";

import {
  findAndAssignAvailableCard,
} from "../cards/card.repository";

export const joinGame = async (
  playerId: string,
  gameId: string
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Verify player
    const player = await User.findOne({
      _id: playerId,
      role: "player",
      status: "active",
    }).session(session);

    if (!player) {
      throw new Error(
        "Player not found or inactive"
      );
    }

    // 2. Verify game
    const game = await Game.findOne({
      _id: gameId,
      status: "waiting",
    }).session(session);

    if (!game) {
      throw new Error(
        "Game is already running or is not accepting players. Please wait for the next game."
      );
    }

    // 3. Check player limit
    if (
      game.currentPlayers >=
      game.maxPlayers
    ) {
      throw new Error(
        "Game is full"
      );
    }

    // 4. Prevent duplicate participation
    const existingPlayer =
      await findGamePlayer(
        gameId,
        playerId
      );

    if (existingPlayer) {
      throw new Error(
        "Player has already joined this game"
      );
    }

    // 5. Get player's wallet
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

    // 6. Calculate available balance
    const availableBalance =
      wallet.balance -
      wallet.reservedBalance;

    // 7. Check sufficient funds
    if (
      availableBalance <
      game.entryFee
    ) {
      throw new Error(
        "Insufficient available balance"
      );
    }

    // 8. Assign available Bingo card
    const card =
      await findAndAssignAvailableCard(
        session
      );

    if (!card) {
      throw new Error(
        "No Bingo cards are currently available"
      );
    }

    // 9. Deduct entry fee
    const balanceBefore =
      wallet.balance;

    const balanceAfter =
      balanceBefore -
      game.entryFee;

    wallet.balance =
      balanceAfter;

    await wallet.save({
      session,
    });

    // 10. Create game participation
    const gamePlayer =
      await createGamePlayer(
        {
          gameId:
            new mongoose.Types.ObjectId(
              gameId
            ),

          playerId:
            new mongoose.Types.ObjectId(
              playerId
            ),

          entryFee:
            game.entryFee,

          cardId: card._id,
        },
        session
      );

    // 11. Update game
    game.currentPlayers += 1;

    game.prizePool +=
      game.entryFee;

    await game.save({
      session,
    });

    // 12. Create transaction
    await Transaction.create(
      [
        {
          userId:
            new mongoose.Types.ObjectId(
              playerId
            ),

          type: "game_entry",

          amount:
            game.entryFee,

          balanceBefore,

          balanceAfter,

          currency: "ETB",

          status: "completed",

          requestId:
            gamePlayer._id,

          description:
            `Bingo entry fee for ${game.name}`,
        },
      ],
      { session }
    );

    // 13. Commit transaction ONCE
    await session.commitTransaction();

    // 14. Start 2-minute joining window
    // ONLY for the first player
    if (game.currentPlayers === 1) {
      startJoiningWindow(gameId);
    }

    return {
      gamePlayer,

      card: {
        id: card._id,
        cardNumber:
          card.cardNumber,
        numbers:
          card.numbers,
      },

      balance:
        balanceAfter,

      reservedBalance:
        wallet.reservedBalance,

      availableBalance:
        balanceAfter -
        wallet.reservedBalance,
    };

  } catch (error) {
    await session.abortTransaction();

    throw error;

  } finally {
    await session.endSession();
  }
};

export const getGamePlayers =
  async (
    gameId: string
  ) => {
    return findGamePlayers(gameId);
  };

export const getPlayerGame =
  async (
    gameId: string,
    playerId: string
  ) => {
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

    return gamePlayer;
  };

export const getGamePlayerCount =
  async (
    gameId: string
  ) => {
    return countGamePlayers(gameId);
  };