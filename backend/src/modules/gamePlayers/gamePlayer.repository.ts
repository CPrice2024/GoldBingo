import mongoose from "mongoose";

import {
  GamePlayer,
} from "./gamePlayer.model";

import {
  GamePlayerStatus,
} from "./gamePlayer.types";


interface CreateGamePlayerData {
  gameId:
    mongoose.Types.ObjectId;

  playerId:
    mongoose.Types.ObjectId;

  entryFee: number;

  cardIds:
    mongoose.Types.ObjectId[];

  cardCount: number;
}


export const createGamePlayer =
  async (
    data: CreateGamePlayerData,
    session?: mongoose.ClientSession
  ) => {
    const players =
      await GamePlayer.create(
        [
          {
            gameId:
              data.gameId,

            playerId:
              data.playerId,

            entryFee:
              data.entryFee,

            cardIds:
              data.cardIds,

            cardCount:
              data.cardCount,

            status:
              "active",

            prizeAmount: 0,
          },
        ],
        {
          session,
        }
      );

    return players[0];
  };


/* =================================
   FIND PLAYER IN GAME
================================= */

export const findGamePlayer =
  async (
    gameId: string,
    playerId: string,
    session?: mongoose.ClientSession
  ) => {
    return GamePlayer.findOne({
      gameId,
      playerId,
    })
      .populate(
        "playerId",
        "fullName phone"
      )

      // New cards
      .populate(
        "cardIds",
        "cardNumber numbers status"
      )

      // Legacy card
      .populate(
        "cardId",
        "cardNumber numbers status"
      )

      .session(
        session || null
      );
  };


/* =================================
   PLAYERS IN GAME
================================= */

export const findGamePlayers =
  async (
    gameId: string,
    status?: GamePlayerStatus
  ) => {
    const filter: {
      gameId: string;
      status?: GamePlayerStatus;
    } = {
      gameId,
    };

    if (status) {
      filter.status =
        status;
    }

    return GamePlayer.find(
      filter
    )
      .populate(
        "playerId",
        "fullName phone"
      )

      .populate(
        "cardIds",
        "cardNumber numbers status"
      )

      .populate(
        "cardId",
        "cardNumber numbers status"
      )

      .sort({
        joinedAt: 1,
      });
  };


/* =================================
   PLAYER COUNT
================================= */

export const countGamePlayers =
  async (
    gameId: string
  ) => {
    return GamePlayer.countDocuments({
      gameId,

      status: {
        $in: [
          "active",
          "won",
        ],
      },
    });
  };