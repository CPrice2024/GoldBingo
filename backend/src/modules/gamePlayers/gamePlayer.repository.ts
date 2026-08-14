import mongoose from "mongoose";

import {
  GamePlayer,
} from "./gamePlayer.model";

import {
  GamePlayerStatus,
} from "./gamePlayer.types";

interface CreateGamePlayerData {
  gameId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  entryFee: number;
  cardId: mongoose.Types.ObjectId;
}

export const createGamePlayer = async (
  data: CreateGamePlayerData,
  session?: mongoose.ClientSession
) => {
  const players =
    await GamePlayer.create(
      [
        {
          gameId: data.gameId,
          playerId: data.playerId,
          entryFee: data.entryFee,
          cardId: data.cardId,
          status: "active",
          prizeAmount: 0,
        },
      ],
      { session }
    );

  return players[0];
};


// Find one player in one game
// and populate their assigned card.
export const findGamePlayer = async (
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
    .populate(
      "cardId",
      "cardNumber numbers status"
    )
    .session(session || null);
};


// Find all players in a game
export const findGamePlayers = async (
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
    filter.status = status;
  }

  return GamePlayer.find(filter)
    .populate(
      "playerId",
      "fullName phone"
    )
    .populate(
      "cardId",
      "cardNumber numbers status"
    )
    .sort({
      joinedAt: 1,
    });
};


// Count active/won players
export const countGamePlayers = async (
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