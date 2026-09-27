import mongoose from "mongoose";
import {
  createHash,
  randomBytes,
} from "crypto";

import type {
  TrustedDevicePlatform,
} from "../users/user.types";
import { User } from "../users/user.model";

import {
  sendPushNotification,
  subscribePlayerToNotifications,
  unsubscribePlayerFromNotifications,
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

export const saveUserFcmToken =
  async (
    userId: string,
    fcmToken: string,
    deviceId?: string,
    platform?: TrustedDevicePlatform
  ) => {
    if (
      !fcmToken ||
      !fcmToken.trim()
    ) {
      throw new Error(
        "FCM token is required"
      );
    }

    const cleanToken =
      fcmToken.trim();

    const cleanDeviceId =
      typeof deviceId === "string"
        ? deviceId.trim()
        : "";

    const cleanPlatform:
      TrustedDevicePlatform =
        platform === "android"
          ? "android"
          : "web";

    const user =
      await User.findById(
        userId
      ).select(
        "_id phone role fcmToken trustedDevices"
      );

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    let deviceCredential:
      string | null = null;

    let deviceCreated =
      false;

    let previousDeviceToken:
      string | null = null;

    /*
     * New trusted-device registration.
     *
     * If deviceId is not supplied,
     * we keep legacy behavior so the
     * current frontend does not break
     * during deployment.
     */
    if (cleanDeviceId) {
      const devices =
        user.trustedDevices || [];

      const existingDevice =
        devices.find(
          (device) =>
            device.deviceId ===
            cleanDeviceId
        );

      if (existingDevice) {
        /*
         * Same browser/app.
         * Keep the device identity.
         * Only refresh its FCM token.
         */
        previousDeviceToken =
          existingDevice.fcmToken ||
          null;

        existingDevice.fcmToken =
          cleanToken;

        existingDevice.platform =
          cleanPlatform;

        existingDevice.lastSeenAt =
          new Date();
      } else {
        /*
         * First successful login
         * from this browser/app.
         */
        deviceCredential =
          randomBytes(32)
            .toString("hex");

        const deviceCredentialHash =
          createHash("sha256")
            .update(
              deviceCredential
            )
            .digest("hex");

        devices.push({
          deviceId:
            cleanDeviceId,

          deviceCredentialHash,

          platform:
            cleanPlatform,

          fcmToken:
            cleanToken,

          createdAt:
            new Date(),

          lastSeenAt:
            new Date(),
        });

        user.trustedDevices =
          devices;

        deviceCreated =
          true;
      }
    }

    /*
     * Keep old single-token field
     * during migration.
     *
     * Existing notification code
     * still depends on this field.
     */
    user.fcmToken =
      cleanToken;

    await user.save();

    /*
     * Subscribe current token to
     * GoldBingo player notifications.
     */
    if (
      user.role ===
      "player"
    ) {
      try {
        /*
         * Only unsubscribe if the
         * SAME trusted device received
         * a replacement FCM token.
         *
         * Do not unsubscribe another
         * trusted device.
         */
        if (
          previousDeviceToken &&
          previousDeviceToken !==
            cleanToken
        ) {
          await unsubscribePlayerFromNotifications(
            previousDeviceToken
          );
        }

        await subscribePlayerToNotifications(
          cleanToken
        );

        console.log(
          `[FCM] Player ${user._id} registered notification device`
        );
      } catch (error) {
        /*
         * Firebase failure should
         * not make login fail.
         */
        console.error(
          "[FCM] Player topic subscription failed:",
          error
        );
      }
    }

    return {
      user,

      trustedDeviceRegistered:
        Boolean(cleanDeviceId),

      deviceCreated,

      /*
       * Returned only when this
       * device is created for the
       * first time.
       */
      deviceCredential,
    };
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
export const getUserFcmToken =
  async (userId: string) => {

    const user =
      await User.findById(
        userId
      ).select(
        "_id phone role fcmToken"
      );

    if (!user) {
      throw new Error(
        "User not found"
      );
    }

    return {
      userId:
        user._id.toString(),

      phone:
        user.phone,

      role:
        user.role,

      fcmToken:
        user.fcmToken || null,
    };
  };