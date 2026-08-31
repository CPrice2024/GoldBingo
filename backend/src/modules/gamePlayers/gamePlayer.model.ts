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
    | "blockedCardIds"
  >,
    Document {

  gameId:
    mongoose.Types.ObjectId;

  playerId:
    mongoose.Types.ObjectId;

  // Legacy card
  cardId?:
    | mongoose.Types.ObjectId
    | null;

  // Current multiple cards
  cardIds:
    mongoose.Types.ObjectId[];

  // Winning card
  winningCardId?:
    | mongoose.Types.ObjectId
    | null;


  /* =========================
     BINGO CLAIM
  ========================= */

  bingoClaimedAt?:
    | Date
    | null;

  bingoBlocked:
    boolean;

  blockedAt?:
    | Date
    | null;

  blockedReason?:
    | string
    | null;

  blockedCardIds:
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

/* =========================
   BINGO CLAIM / FALSE BINGO
========================= */

bingoClaimedAt: {
  type: Date,
  default: null,
},

bingoBlocked: {
  type: Boolean,
  default: false,
},

blockedAt: {
  type: Date,
  default: null,
},

blockedReason: {
  type: String,
  default: null,
},

blockedCardIds: {
  type: [
    {
      type: Schema.Types.ObjectId,
      ref: "Card",
    },
  ],
  default: [],
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
  status: 1,
});

gamePlayerSchema.index({
  gameId: 1,
  bingoBlocked: 1,
});


export const GamePlayer =
  mongoose.model<IGamePlayerDocument>(
    "GamePlayer",
    gamePlayerSchema
  );