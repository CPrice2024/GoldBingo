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
import { Card } from "../cards/card.model";

import {
  GamePlayer,
} from "./gamePlayer.model";

export const joinGame =
  async (
    playerId: string,
    gameId: string,
    cardId: string
  ) => {


    /* =========================
       VALIDATE CARD ID
    ========================= */

    if (
      !mongoose.Types.ObjectId.isValid(
        cardId
      )
    ) {
      throw new Error(
        "Invalid card ID"
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
          _id:
            playerId,

          role:
            "player",

          status:
            "active",
        }).session(
          session
        );


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
          _id:
            gameId,

          status:
            "waiting",
        }).session(
          session
        );


      if (!game) {
        throw new Error(
          "Game is already running or is not accepting players. Please wait for the next game."
        );
      }
      /* =========================
   GAME TYPE

   1  = NORMAL
   -1 = BONUS
========================= */

const gameType:
  1 | -1 =
    Number(
      game.gameType ?? 1
    ) === -1
      ? -1
      : 1;


const isBonusGame =
  gameType === -1;


/*
 * Normal:
 * max 25 cards
 *
 * Bonus:
 * max 2 cards
 */
const maxCardsForGame =
  isBonusGame
    ? 2
    : 25;


      /* =========================
         3. EXISTING PARTICIPATION
      ========================= */

      const existingPlayer =
        await GamePlayer.findOne({
          gameId:
            gameId,

          playerId:
            playerId,
        }).session(
          session
        );


      const isNewPlayer =
        !existingPlayer;


      /*
       * Player limit only applies
       * when this is a NEW player.
       *
       * A player already inside the
       * game may still add cards.
       */
      if (
        isNewPlayer &&
        Number(
          game.currentPlayers ||
            0
        ) >=
          Number(
            game.maxPlayers ||
              0
          )
      ) {

        throw new Error(
          "Game is full"
        );
      }


      /* =========================
         4. CURRENT CARD COUNT
      ========================= */

      let existingCardCount =
        0;


      if (existingPlayer) {

        if (
          Array.isArray(
            existingPlayer.cardIds
          ) &&
          existingPlayer.cardIds
            .length > 0
        ) {

          existingCardCount =
            existingPlayer.cardIds
              .length;

        } else if (
          existingPlayer.cardId
        ) {

          /*
           * Legacy one-card records.
           */
          existingCardCount =
            1;

        } else {

          existingCardCount =
            Number(
              existingPlayer.cardCount ||
                0
            );
        }


       if (
  existingCardCount >=
  maxCardsForGame
) {

  throw new Error(
    isBonusGame
      ? "Bonus games allow a maximum of 2 cards per player"
      : "Maximum 25 cards allowed per player"
  );

}

/*
 * CLOSE:
 * if (existingPlayer)
 */
}


/* =========================
   5. DUPLICATE CARD CHECK
========================= */

      if (existingPlayer) {

        const ownedCardIds =
          new Set<string>();


        if (
          Array.isArray(
            existingPlayer.cardIds
          )
        ) {

          existingPlayer.cardIds.forEach(
            (
              item: any
            ) => {

              ownedCardIds.add(
                String(
                  item?._id ??
                    item
                )
              );

            }
          );
        }


        if (
          existingPlayer.cardId
        ) {

          ownedCardIds.add(
            String(
              (
                existingPlayer.cardId as any
              )?._id ??
                existingPlayer.cardId
            )
          );
        }


        if (
          ownedCardIds.has(
            String(
              cardId
            )
          )
        ) {

          throw new Error(
            "You already joined this card"
          );
        }
      }


      /* =========================
         6. WALLET
      ========================= */

      const wallet =
        await Wallet.findOne({
          userId:
            playerId,

          status:
            "active",
        }).session(
          session
        );


      if (!wallet) {

        throw new Error(
          "Player wallet not found or inactive"
        );
      }


      /* =========================
         7. ONE CARD ENTRY COST
      ========================= */

      const totalEntryFee =
  isBonusGame
    ? 0
    : Number(
        game.entryFee ||
          0
      );


      /* =========================
         WALLET BALANCES
      ========================= */

      const depositBalanceBefore =
        Number(
          wallet.balance ||
            0
        );


      const winningBalanceBefore =
        Number(
          wallet.winningBalance ||
            0
        );


      const reservedDepositBalance =
        Number(
          wallet.reservedBalance ||
            0
        );


      const reservedWinningBalance =
        Number(
          wallet
            .reservedWinningBalance ||
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
         TOTAL PLAYABLE
      ========================= */

      const totalPlayableBalance =
        availableWinningBalance +
        availableDepositBalance;


      if (
        totalPlayableBalance <
        totalEntryFee
      ) {

        throw new Error(
          `Insufficient balance. This card costs ${totalEntryFee} ETB. Available to play: ${totalPlayableBalance.toFixed(
            2
          )} ETB.`
        );
      }


      /* =========================
         8. ASSIGN EXACT CARD
      ========================= */

      /*
       * Atomic update:
       *
       * The card must STILL be
       * available when we purchase it.
       *
       * If another player got it first,
       * this returns null.
       */
      const card =
        await Card.findOneAndUpdate(
          {
            _id:
              new mongoose.Types.ObjectId(
                cardId
              ),

            status:
              "available",
          },
          {
            $set: {
              status:
                "assigned",
            },
          },
          {
            new:
              true,

            session,
          }
        );


      if (!card) {

        throw new Error(
          "This Bingo card is no longer available. Please choose another card."
        );
      }


      /* =========================
         9. DEDUCT BALANCE

         PRIORITY:
         1. WINNINGS
         2. DEPOSIT
      ========================= */

      /* =========================
   9. DEDUCT BALANCE

   NORMAL:
   deduct card entry fee.

   BONUS:
   card is completely free.
========================= */

let amountFromWinning =
  0;

let amountFromDeposit =
  0;


if (
  totalEntryFee > 0
) {

  amountFromWinning =
    Math.min(
      totalEntryFee,
      availableWinningBalance
    );


  amountFromDeposit =
    totalEntryFee -
    amountFromWinning;


  wallet.winningBalance =
    winningBalanceBefore -
    amountFromWinning;


  wallet.balance =
    depositBalanceBefore -
    amountFromDeposit;


  await wallet.save({
    session,
  });

}


      /* =========================
         BALANCE AFTER
      ========================= */

      const depositBalanceAfter =
        Number(
          wallet.balance ||
            0
        );


      const winningBalanceAfter =
        Number(
          wallet.winningBalance ||
            0
        );


      const totalBalanceBefore =
        depositBalanceBefore +
        winningBalanceBefore;


      const totalBalanceAfter =
        depositBalanceAfter +
        winningBalanceAfter;


      const withdrawableWinningBalanceAfter =
        Math.max(
          0,

          winningBalanceAfter -
            reservedWinningBalance
        );


      const availableDepositBalanceAfter =
        Math.max(
          0,

          depositBalanceAfter -
            reservedDepositBalance
        );


      const availableBalanceAfter =
        withdrawableWinningBalanceAfter +
        availableDepositBalanceAfter;


      /* =========================
         10. GAME PARTICIPATION
      ========================= */

      let gamePlayer:
        any;


      if (existingPlayer) {

        /*
         * Existing player:
         *
         * Keep ONE GamePlayer document
         * and append the new card.
         */

        if (
          !Array.isArray(
            existingPlayer.cardIds
          )
        ) {

          existingPlayer.cardIds =
            [];
        }


        /*
         * Convert legacy cardId into
         * cardIds if necessary.
         */
        if (
          existingPlayer.cardIds
            .length === 0 &&
          existingPlayer.cardId
        ) {

          existingPlayer.cardIds.push(
            existingPlayer.cardId as any
          );
        }


        existingPlayer.cardIds.push(
          card._id as mongoose.Types.ObjectId
        );


        existingPlayer.cardCount =
          existingPlayer.cardIds
            .length;


        /*
         * entryFee now represents total
         * amount paid by this player for
         * this game.
         */
        existingPlayer.entryFee =
          Number(
            existingPlayer.entryFee ||
              0
          ) +
          totalEntryFee;


        await existingPlayer.save({
          session,
        });


        gamePlayer =
          existingPlayer;

      } else {

        /*
         * First card:
         * create participation.
         */
        gamePlayer =
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

              cardIds: [
                card._id as mongoose.Types.ObjectId,
              ],

              cardCount:
                1,
            },
            session
          );

      }


      /* =========================
         11. UPDATE GAME
      ========================= */

      /*
       * currentPlayers counts PEOPLE,
       * not cards.
       */
      if (isNewPlayer) {

        game.currentPlayers =
          Number(
            game.currentPlayers ||
              0
          ) + 1;
      }


      /*
       * Every individual card adds
       * one entry fee to prize pool.
       */
      game.prizePool =
        Number(
          game.prizePool ||
            0
        ) +
        totalEntryFee;


      await game.save({
        session,
      });


      /* =========================
         12. TRANSACTION
      ========================= */

      if (
  totalEntryFee > 0
) {

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
          `Entry fee for Bingo card ${card.cardNumber} in ${game.name}. Used ${amountFromWinning.toFixed(
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

}


      /* =========================
         13. COMMIT
      ========================= */

      await session.commitTransaction();


      /*
       * Start joining timer only when
       * the very first PLAYER joins.
       *
       * Card #2, #3, etc. must NOT
       * restart the joining timer.
       */
      if (
        isNewPlayer &&
        game.currentPlayers ===
          1
      ) {

        startJoiningWindow(
          gameId
        );
      }


      /* =========================
         RESULT
      ========================= */

      return {

        gamePlayer,

        cardCount:
          Number(
            gamePlayer.cardCount ||
              1
          ),

        card: {
          id:
            card._id,

          cardNumber:
            card.cardNumber,

          numbers:
            card.numbers,
        },

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