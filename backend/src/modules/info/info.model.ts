import mongoose, {
  Document,
  Schema,
} from "mongoose";

import {
  InfoCategory,
} from "./info.types";


export interface IInfoDocument
  extends Document {

  title: string;

  content: string;

  category: InfoCategory;

  isPublished: boolean;

  createdBy:
    mongoose.Types.ObjectId;

  publishedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}


const infoSchema =
  new Schema<IInfoDocument>(
    {
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000,
      },

      category: {
        type: String,
        enum: [
          "general",
          "promotion",
          "maintenance",
          "game",
          "important",
        ] satisfies InfoCategory[],
        default: "general",
        required: true,
      },

      isPublished: {
        type: Boolean,
        default: false,
        index: true,
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      publishedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );


/* =========================
   INDEXES
========================= */

infoSchema.index({
  isPublished: 1,
  publishedAt: -1,
});

infoSchema.index({
  createdAt: -1,
});


export const Info =
  mongoose.model<IInfoDocument>(
    "Info",
    infoSchema
  );