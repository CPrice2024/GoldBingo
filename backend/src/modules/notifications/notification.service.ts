import mongoose from "mongoose";

import { User } from "../users/user.model";

import {
  sendPushNotification,
} from "./firebase.service";

import {
  createNotification,
  findUserNotifications,
  countUnreadNotifications,
  findNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "./notification.repository";

import {
  NotificationType,
} from "./notification.types";

export const saveUserFcmToken = async (
  userId: string,
  fcmToken: string
) => {
  if (!fcmToken || !fcmToken.trim()) {
    throw new Error("FCM token is required");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        fcmToken: fcmToken.trim(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("_id fullName phone role fcmToken");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const sendNotificationToUser = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  const user = await User.findById(userId).select(
    "_id fullName phone role fcmToken"
  );

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.fcmToken) {
    throw new Error(
      `User ${userId} does not have an FCM token`
    );
  }

  const messageId =
    await sendPushNotification(
      user.fcmToken,
      title,
      body,
      data
    );

  return {
    userId: user._id.toString(),
    fullName: user.fullName,
    role: user.role,
    messageId,
  };
};
interface CreateNotificationInput {
  userId: string;

  title: string;

  message: string;

  type: NotificationType;

  data?: Record<string, string>;

  sendPush?: boolean;
}

export const createUserNotification = async (
  input: CreateNotificationInput
) => {
  const notification =
    await createNotification({
      userId:
        new mongoose.Types.ObjectId(
          input.userId
        ),

      title: input.title,

      message: input.message,

      type: input.type,

      data: input.data,
    });

  // Send FCM push notification if enabled.
  if (input.sendPush !== false) {
    try {
      const user = await User.findById(
        input.userId
      ).select("fcmToken");

      if (user?.fcmToken) {
        await sendPushNotification(
          user.fcmToken,
          input.title,
          input.message,
          {
            type: input.type,

            notificationId:
              notification._id.toString(),

            ...(input.data || {}),
          }
        );
      }
    } catch (error) {
      // FCM failure should not delete
      // the in-app notification.
      console.error(
        "FCM notification failed:",
        error
      );
    }
  }

  return notification;
};

export const getUserNotifications = async (
  userId: string
) => {
  return findUserNotifications(userId);
};

export const getUserUnreadCount = async (
  userId: string
) => {
  return countUnreadNotifications(userId);
};

export const readUserNotification = async (
  notificationId: string,
  userId: string
) => {
  const notification =
    await findNotificationById(
      notificationId,
      userId
    );

  if (!notification) {
    throw new Error(
      "Notification not found"
    );
  }

  if (!notification.read) {
    return markNotificationAsRead(
      notificationId,
      userId
    );
  }

  return notification;
};

export const readAllUserNotifications =
  async (userId: string) => {
    return markAllNotificationsAsRead(
      userId
    );
  };

export const removeUserNotification = async (
  notificationId: string,
  userId: string
) => {
  const notification =
    await findNotificationById(
      notificationId,
      userId
    );

  if (!notification) {
    throw new Error(
      "Notification not found"
    );
  }

  await deleteNotification(
    notificationId,
    userId
  );

  return {
    notificationId,
  };
};