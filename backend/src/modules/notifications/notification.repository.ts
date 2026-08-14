import mongoose from "mongoose";

import { Notification } from "./notification.model";

import {
  NotificationType,
} from "./notification.types";

interface CreateNotificationData {
  userId: mongoose.Types.ObjectId;

  title: string;

  message: string;

  type: NotificationType;

  data?: Record<string, string>;
}

export const createNotification = async (
  data: CreateNotificationData
) => {
  return Notification.create({
    ...data,
    read: false,
  });
};

export const findUserNotifications = async (
  userId: string
) => {
  return Notification.find({
    userId,
  }).sort({
    createdAt: -1,
  });
};

export const countUnreadNotifications = async (
  userId: string
) => {
  return Notification.countDocuments({
    userId,
    read: false,
  });
};

export const findNotificationById = async (
  notificationId: string,
  userId: string
) => {
  return Notification.findOne({
    _id: notificationId,
    userId,
  });
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
) => {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      userId,
    },
    {
      $set: {
        read: true,
      },
    },
    {
      new: true,
    }
  );
};

export const markAllNotificationsAsRead = async (
  userId: string
) => {
  return Notification.updateMany(
    {
      userId,
      read: false,
    },
    {
      $set: {
        read: true,
      },
    }
  );
};

export const deleteNotification = async (
  notificationId: string,
  userId: string
) => {
  return Notification.findOneAndDelete({
    _id: notificationId,
    userId,
  });
};