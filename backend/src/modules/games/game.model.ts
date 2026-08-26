import mongoose, {
  Document,
  Schema,
} from "mongoose";

import {
  IGame,
  GameStatus,
} from "./game.types";
import {
  WINNING_PATTERNS,
} from "./game.patterns";


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
    winningPattern: {
  type: String,

  required: true,

  enum: WINNING_PATTERNS.map(
    (pattern) =>
      pattern.value
  ),

  default: "3_lines",
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
    joiningWindowSeconds: {
  type: Number,
  default: 120,
  min: 1,
},

callIntervalSeconds: {
  type: Number,
  default: 5,
  min: 1,
},

joiningEndsAt: {
  type: Date,
  default: null,
},

nextCallAt: {
  type: Date,
  default: null,
},

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
    scheduledStartAt: {
  type: Date,
  default: null,
},

prizeAmount: {
  type: Number,
  default: null,
  min: 0,
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