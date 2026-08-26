import { Request, Response } from "express";

import {
  saveUserFcmToken,
  sendNotificationToUser,
   getUserNotifications,
  getUserUnreadCount,
  readUserNotification,
  readAllUserNotifications,
  removeUserNotification,
  createUserNotification,
} from "./notification.service";

import {
  sendPushNotification,
  verifyFirebaseConnection,
} from "./firebase.service";

export const testPushNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      token,
      title,
      body,
    } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    const messageId =
      await sendPushNotification(
        token,
        title || "BingoHub Test",
        body || "FCM notification is working!",
        {
          type: "test",
        }
      );

    return res.status(200).json({
      success: true,
      message: "Push notification sent successfully",
      data: {
        messageId,
      },
    });
  } catch (error) {
    console.error(
      "FCM error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to send push notification",
    });
  }
};

export const testFirebaseConnection = async (
  req: Request,
  res: Response
) => {
  try {
    const result =
      await verifyFirebaseConnection();

    return res.status(200).json({
      success: true,
      message: "Firebase Admin connection is working",
      data: result,
    });
  } catch (error) {
    console.error(
      "Firebase connection error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Firebase connection failed",
    });
  }
};

export const registerFcmToken = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { fcmToken } = req.body;

    if (
      typeof fcmToken !== "string" ||
      !fcmToken.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    const user = await saveUserFcmToken(
      userId,
      fcmToken
    );

    return res.status(200).json({
      success: true,
      message: "FCM token registered successfully",
      data: {
        userId: user._id,
        role: user.role,
        fcmToken: user.fcmToken,
      },
    });
  } catch (error) {
    console.error(
      "FCM token registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to register FCM token",
    });
  }
};

export const testUserNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.body;

    if (
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result =
      await sendNotificationToUser(
        userId,
        "BingoHub Test",
        "This is a one-to-one FCM test notification.",
        {
          type: "test_user",
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "User notification sent successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "User notification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to send user notification",
    });
  }
};
export const getMyNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const notifications =
      await getUserNotifications(userId);

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve notifications",
    });
  }
};

export const getUnreadNotificationCount =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const count =
        await getUserUnreadCount(userId);

      return res.status(200).json({
        success: true,
        data: {
          count,
        },
      });
    } catch (error) {
      console.error(
        "Unread notification count error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get unread count",
      });
    }
  };

export const markNotificationRead = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const id = String(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });
    }

    const notification =
      await readUserNotification(
        id,
        userId
      );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Notification not found",
    });
  }
};

export const markAllNotificationsRead =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const result =
        await readAllUserNotifications(
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "All notifications marked as read",
        data: {
          modifiedCount:
            result.modifiedCount,
        },
      });
    } catch (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to mark notifications as read",
      });
    }
  };

export const deleteMyNotification =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = req.user?.userId;
      const id = String(req.params.id);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Notification ID is required",
        });
      }

      const result =
        await removeUserNotification(
          id,
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification deleted successfully",
        data: result,
      });
    } catch (error) {
      console.error(
        "Delete notification error:",
        error
      );

      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Notification not found",
      });
    }
  };

  export const createTestNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const notification =
      await createUserNotification({
        userId,
        title: "BingoHub Test",
        message:
          "This is a test in-app notification.",
        type: "system",
        data: {
          source: "test",
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Test notification created successfully",
      data: notification,
    });
  } catch (error) {
    console.error(
      "Create test notification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create test notification",
    });
  }
};