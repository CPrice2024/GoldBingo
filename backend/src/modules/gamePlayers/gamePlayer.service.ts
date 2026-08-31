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
  findAndAssignAvailableCards,
} from "../cards/card.repository";

export const joinGame =
  async (
    playerId: string,
    gameId: string,
    cardCount: number = 1
  ) => {
    const allowedCardCounts = [
      1,
      2,
      3,
      5,
      10,
    ];

    if (
      !allowedCardCounts.includes(
        cardCount
      )
    ) {
      throw new Error(
        "Card count must be 1, 2, 3, 5, or 10"
      );
    }


    const session =
      await mongoose.startSession();

    try {
      session.startTransaction();


      /* =========================
         1. PLAYER
      ========================= */

      const player =
        await User.findOne({
          _id: playerId,
          role: "player",
          status: "active",
        }).session(session);

      if (!player) {
        throw new Error(
          "Player not found or inactive"
        );
      }


      /* =========================
         2. GAME
      ========================= */

      const game =
        await Game.findOne({
          _id: gameId,
          status: "waiting",
        }).session(session);

      if (!game) {
        throw new Error(
          "Game is already running or is not accepting players. Please wait for the next game."
        );
      }


      /* =========================
         3. PLAYER LIMIT
      ========================= */

      if (
        game.currentPlayers >=
        game.maxPlayers
      ) {
        throw new Error(
          "Game is full"
        );
      }


      /* =========================
         4. DUPLICATE JOIN
      ========================= */

      const existingPlayer =
        await findGamePlayer(
          gameId,
          playerId,
          session
        );

      if (existingPlayer) {
        throw new Error(
          "Player has already joined this game"
        );
      }


      /* =========================
         5. WALLET
      ========================= */

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

/* =========================
   6. TOTAL ENTRY COST
========================= */

const totalEntryFee =
  game.entryFee *
  cardCount;


/* =========================
   WALLET BALANCES
========================= */

/*
 * Deposit money.
 */
const depositBalanceBefore =
  Number(
    wallet.balance || 0
  );


/*
 * Money won from Bingo.
 */
const winningBalanceBefore =
  Number(
    wallet.winningBalance || 0
  );


/*
 * Reserved deposit money.
 */
const reservedDepositBalance =
  Number(
    wallet.reservedBalance || 0
  );


/*
 * Winning money currently
 * reserved for withdrawal.
 */
const reservedWinningBalance =
  Number(
    wallet.reservedWinningBalance ||
    0
  );


/* =========================
   AVAILABLE WINNINGS
========================= */

const availableWinningBalance =
  Math.max(
    0,
    winningBalanceBefore -
      reservedWinningBalance
  );


/* =========================
   AVAILABLE DEPOSIT
========================= */

const availableDepositBalance =
  Math.max(
    0,
    depositBalanceBefore -
      reservedDepositBalance
  );


/* =========================
   TOTAL PLAYABLE BALANCE
========================= */

const totalPlayableBalance =
  availableWinningBalance +
  availableDepositBalance;


if (
  totalPlayableBalance <
  totalEntryFee
) {
  throw new Error(
    `Insufficient balance. ${cardCount} cards cost ${totalEntryFee} ETB. Available to play: ${totalPlayableBalance.toFixed(
      2
    )} ETB.`
  );
}


      /* =========================
         7. ASSIGN CARDS
      ========================= */

      const cards =
        await findAndAssignAvailableCards(
          cardCount,
          session
        );

      if (
        cards.length !==
        cardCount
      ) {
        throw new Error(
          "Failed to assign requested cards"
        );
      }


      const cardIds =
        cards.map(
          (card) =>
            card._id
        );


 /* =========================
   8. DEDUCT BALANCE

   PRIORITY:
   1. WINNINGS
   2. DEPOSIT
========================= */


/*
 * First take as much as possible
 * from withdrawable winnings.
 */
const amountFromWinning =
  Math.min(
    totalEntryFee,
    availableWinningBalance
  );


/*
 * Whatever remains comes
 * from deposit balance.
 */
const amountFromDeposit =
  totalEntryFee -
  amountFromWinning;


/* =========================
   UPDATE WINNING BALANCE
========================= */

wallet.winningBalance =
  winningBalanceBefore -
  amountFromWinning;


/* =========================
   UPDATE DEPOSIT BALANCE
========================= */

wallet.balance =
  depositBalanceBefore -
  amountFromDeposit;


await wallet.save({
  session,
});


/* =========================
   BALANCE AFTER
========================= */

const depositBalanceAfter =
  Number(
    wallet.balance || 0
  );


const winningBalanceAfter =
  Number(
    wallet.winningBalance || 0
  );


const totalBalanceBefore =
  depositBalanceBefore +
  winningBalanceBefore;


const totalBalanceAfter =
  depositBalanceAfter +
  winningBalanceAfter;


/*
 * Remaining winnings that can
 * still be withdrawn or played.
 */
const withdrawableWinningBalanceAfter =
  Math.max(
    0,
    winningBalanceAfter -
      reservedWinningBalance
  );


/*
 * Remaining deposit balance
 * that can be played.
 */
const availableDepositBalanceAfter =
  Math.max(
    0,
    depositBalanceAfter -
      reservedDepositBalance
  );


/*
 * Total money currently
 * available for another game.
 */
const availableBalanceAfter =
  withdrawableWinningBalanceAfter +
  availableDepositBalanceAfter;


      /* =========================
         9. GAME PARTICIPATION
      ========================= */

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
              totalEntryFee,

            cardIds:
              cardIds as mongoose.Types.ObjectId[],

            cardCount,
          },
          session
        );


      /* =========================
         10. UPDATE GAME
      ========================= */

      // One PLAYER joined,
      // regardless of card quantity.
      game.currentPlayers += 1;

      // Every purchased card
      // contributes entry fee.
      game.prizePool +=
        totalEntryFee;

      await game.save({
        session,
      });


      /* =========================
         11. TRANSACTION
      ========================= */

      await Transaction.create(
        [
          {
            userId:
              new mongoose.Types.ObjectId(
                playerId
              ),

            type:
              "game_entry",

            amount:
              totalEntryFee,

            balanceBefore:
              totalBalanceBefore,

            balanceAfter:
              totalBalanceAfter,

            currency:
              "ETB",

            status:
              "completed",

            requestId:
              gamePlayer._id,

            description:
  `Entry fee for ${cardCount} card(s) in ${game.name}. Used ${amountFromWinning.toFixed(
    2
  )} ETB winnings and ${amountFromDeposit.toFixed(
    2
  )} ETB deposit.`,
          },
        ],
        {
          session,
        }
      );


      /* =========================
         12. COMMIT
      ========================= */

      await session.commitTransaction();


      /*
       * Start joining timer only
       * when first PLAYER joins.
       */
      if (
        game.currentPlayers === 1
      ) {
        startJoiningWindow(
          gameId
        );
      }


      return {
        gamePlayer,

        cardCount,

        cards:
          cards.map(
            (card) => ({
              id:
                card._id,

              cardNumber:
                card.cardNumber,

              numbers:
                card.numbers,
            })
          ),

        totalEntryFee,


/* DEPOSIT */

balance:
  depositBalanceAfter,

depositBalance:
  depositBalanceAfter,

reservedBalance:
  reservedDepositBalance,

availableDepositBalance:
  availableDepositBalanceAfter,


/* WINNINGS */

winningBalance:
  winningBalanceAfter,

reservedWinningBalance:
  reservedWinningBalance,

withdrawableWinningBalance:
  withdrawableWinningBalanceAfter,


/* TOTAL */

totalBalance:
  totalBalanceAfter,

availableBalance:
  availableBalanceAfter,


/* ENTRY SOURCE */

amountFromWinning,

amountFromDeposit,
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