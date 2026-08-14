import mongoose, {
  Document,
  Schema,
} from "mongoose";

import {
  IGame,
  GameStatus,
} from "./game.types";

export interface IGameDocument
  extends IGame,
    Document {
  createdAt: Date;
  updatedAt: Date;
}

const gameSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    entryFee: {
      type: Number,
      required: true,
      min: 0,
    },

    maxPlayers: {
      type: Number,
      required: true,
      min: 1,
    },

    currentPlayers: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    prizePool: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "active",
        "completed",
        "cancelled",
      ] satisfies GameStatus[],
      default: "waiting",
      required: true,
      index: true,
    },

    calledNumbers: {
      type: [Number],
      default: [],
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

gameSchema.index({
  status: 1,
  createdAt: -1,
});

export const Game =
  mongoose.model<IGameDocument>(
    "Game",
    gameSchema
  );