import { Router } from "express";

import {
  testPushNotification,
  testFirebaseConnection,
  registerFcmToken,
  testUserNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteMyNotification,
  createTestNotification,
  getMyFcmToken,
} from "./notification.controller";

import { authenticate } from "../auth/auth.middleware";

const router = Router();

router.get(
  "/firebase-status",
  testFirebaseConnection
);

router.post(
  "/test-push",
  testPushNotification
);

// Authentication required for the user's own FCM token
router.patch(
  "/token",
  authenticate,
  registerFcmToken
);

router.post(
  "/test-user",
  testUserNotification
);
router.get(
  "/",
  authenticate,
  getMyNotifications
);

router.post(
  "/test",
  authenticate,
  createTestNotification
);

router.get(
  "/unread-count",
  authenticate,
  getUnreadNotificationCount
);
router.get(
  "/my-token",
  authenticate,
  getMyFcmToken
);

router.patch(
  "/:id/read",
  authenticate,
  markNotificationRead
);

router.patch(
  "/read-all",
  authenticate,
  markAllNotificationsRead
);

router.delete(
  "/:id",
  authenticate,
  deleteMyNotification
);

export default router;