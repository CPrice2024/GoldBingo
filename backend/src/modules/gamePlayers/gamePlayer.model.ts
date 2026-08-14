import mongoose, {
  Document,
  Schema,
} from "mongoose";

import {
  IGamePlayer,
  GamePlayerStatus,
} from "./gamePlayer.types";

export interface IGamePlayerDocument
  extends Omit<
    IGamePlayer,
    "gameId" | "playerId" | "cardId"
  >,
    Document {
  gameId: mongoose.Types.ObjectId;

  playerId: mongoose.Types.ObjectId;

  cardId?: mongoose.Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

const gamePlayerSchema = new Schema(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },

    playerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    entryFee: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "active",
        "won",
        "lost",
        "cancelled",
      ] satisfies GamePlayerStatus[],
      default: "active",
      required: true,
      index: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    cardId: {
      type: Schema.Types.ObjectId,
      ref: "Card",
      default: null,
    },

    prizeAmount: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// A player can only join a game once.
gamePlayerSchema.index(
  {
    gameId: 1,
    playerId: 1,
  },
  {
    unique: true,
  }
);

// Useful for retrieving all players in a game.
gamePlayerSchema.index({
  gameId: 1,
  status: 1,
});

export const GamePlayer =
  mongoose.model<IGamePlayerDocument>(
    "GamePlayer",
    gamePlayerSchema
  );