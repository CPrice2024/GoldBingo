import mongoose, {
  Document,
  Schema,
} from "mongoose";

import {
  INotification,
  NotificationType,
} from "./notification.types";

export interface INotificationDocument
  extends Omit<INotification, "userId">,
    Document {
  userId: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: [
        "deposit",
        "withdrawal",
        "game",
        "wallet",
        "system",
      ] satisfies NotificationType[],
      required: true,
      index: true,
    },

    read: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },

    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  userId: 1,
  read: 1,
  createdAt: -1,
});

notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

export const Notification =
  mongoose.model<INotificationDocument>(
    "Notification",
    notificationSchema
  );