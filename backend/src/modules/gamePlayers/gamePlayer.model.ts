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
  | "gameId"
  | "playerId"
  | "cardId"
  | "cardIds"
  | "winningCardId"
>,
    Document {

  gameId:
    mongoose.Types.ObjectId;

  playerId:
    mongoose.Types.ObjectId;

  // Legacy
  cardId?:
    mongoose.Types.ObjectId;

  winningCardId?:
  | mongoose.Types.ObjectId
  | null;

  // New
  cardIds:
    mongoose.Types.ObjectId[];

  createdAt: Date;

  updatedAt: Date;
}


const gamePlayerSchema =
  new Schema(
    {
      gameId: {
        type:
          Schema.Types.ObjectId,
        ref: "Game",
        required: true,
        index: true,
      },

      playerId: {
        type:
          Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // Total fee paid
      // for all purchased cards.
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

      /*
       * LEGACY SINGLE CARD
       *
       * Keep temporarily so old
       * game participation records
       * still work.
       */
      cardId: {
        type:
          Schema.Types.ObjectId,

        ref: "Card",

        default: null,
      },

      /*
       * NEW MULTI-CARD LIST
       */
      cardIds: {
        type: [
          {
            type:
              Schema.Types.ObjectId,

            ref: "Card",
          },
        ],

        default: [],
      },

      cardCount: {
        type: Number,

        enum: [
          1,
          2,
          3,
          5,
          10,
        ],

        default: 1,

        required: true,
      },

      prizeAmount: {
        type: Number,

        default: 0,

        min: 0,

        required: true,
      },
      winningCardId: {
  type: Schema.Types.ObjectId,
  ref: "Card",
  default: null,
  index: true,
},

winningPattern: {
  type: String,
  default: null,
},

wonAt: {
  type: Date,
  default: null,
},
    },
    {
      timestamps: true,
    }
  );


/*
 * One player joins one game once,
 * but can buy multiple cards.
 */
gamePlayerSchema.index(
  {
    gameId: 1,
    playerId: 1,
  },
  {
    unique: true,
  }
);


gamePlayerSchema.index({
  gameId: 1,
});


gamePlayerSchema.index({
  status: 1,
});


export const GamePlayer =
  mongoose.model<IGamePlayerDocument>(
    "GamePlayer",
    gamePlayerSchema
  );