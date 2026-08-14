import mongoose, {
  Document,
  Schema,
} from "mongoose";

import {
  ICard,
  CardStatus,
} from "./card.types";

export interface ICardDocument
  extends ICard,
    Document {
  createdAt: Date;
  updatedAt: Date;
}

const cardSchema = new Schema(
  {
    cardNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    numbers: {
      type: [[Number]],
      required: true,
      validate: {
        validator: (value: number[][]) => {
          return (
            Array.isArray(value) &&
            value.length === 5 &&
            value.every(
              (row) =>
                Array.isArray(row) &&
                row.length === 5
            )
          );
        },
        message:
          "Card must contain a 5x5 number grid",
      },
    },

    status: {
      type: String,
      enum: [
        "available",
        "assigned",
        "used",
      ] satisfies CardStatus[],
      default: "available",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

cardSchema.index({
  status: 1,
  createdAt: -1,
});

export const Card =
  mongoose.model<ICardDocument>(
    "Card",
    cardSchema
  );