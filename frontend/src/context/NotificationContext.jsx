import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/notifications.api";

import { listenForMessages } from "../notifications";

import { useAuth } from "./useAuth";

const NotificationContext =
  createContext(null);

export const NotificationProvider = ({
  children,
}) => {
  const { isAuthenticated, user } =
    useAuth();

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  // ========================================
  // LOAD NOTIFICATIONS
  // ========================================

  const loadNotifications = async () => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result =
        await getMyNotifications();

      setNotifications(
        result?.data || []
      );

      const unreadResult =
        await getUnreadNotificationCount();

      setUnreadCount(
        unreadResult?.data?.count || 0
      );
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    loadNotifications();
  }, [isAuthenticated, user]);

  // ========================================
  // FOREGROUND FCM LISTENER
  // ========================================

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const unsubscribe =
      listenForMessages((payload) => {
        console.log(
          "📩 NotificationContext received FCM:",
          payload
        );

        const notification =
          payload.notification;

        const data =
          payload.data || {};

        if (!notification) {
          return;
        }

        const newNotification = {
          _id:
            data.notificationId ||
            `fcm-${Date.now()}`,

          userId: user.id,

          title:
            notification.title ||
            "GoldBingo",

          message:
            notification.body ||
            "You have a new notification.",

          type:
            data.type ||
            "system",

          read: false,

          data,

          createdAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString(),
        };

        setNotifications(
          (current) => [
            newNotification,
            ...current,
          ]
        );

        setUnreadCount(
          (current) => current + 1
        );
      });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, user]);

  // ========================================
  // MARK ONE AS READ
  // ========================================

  const markAsRead = async (
    notificationId
  ) => {
    try {
      const result =
        await markNotificationAsRead(
          notificationId
        );

      setNotifications((current) =>
        current.map((notification) =>
          notification._id ===
          notificationId
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );

      setUnreadCount((current) =>
        current > 0
          ? current - 1
          : 0
      );

      return result;
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );

      throw error;
    }
  };

  // ========================================
  // MARK ALL AS READ
  // ========================================

  const markAllAsRead = async () => {
    try {
      const result =
        await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      setUnreadCount(0);

      return result;
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );

      throw error;
    }
  };

  // ========================================
  // DELETE NOTIFICATION
  // ========================================

  const removeNotification = async (
    notificationId
  ) => {
    try {
      const result =
        await deleteNotification(
          notificationId
        );

      const deletedNotification =
        notifications.find(
          (notification) =>
            notification._id ===
            notificationId
        );

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification._id !==
            notificationId
        )
      );

      if (
        deletedNotification &&
        !deletedNotification.read
      ) {
        setUnreadCount((current) =>
          current > 0
            ? current - 1
            : 0
        );
      }

      return result;
    } catch (error) {
      console.error(
        "Failed to delete notification:",
        error
      );

      throw error;
    }
  };

  // ========================================
  // ADD NOTIFICATION MANUALLY
  // ========================================

  const addNotification = (
    notification
  ) => {
    if (!notification) {
      return;
    }

    setNotifications((current) => [
      notification,
      ...current,
    ]);

    if (!notification.read) {
      setUnreadCount((current) =>
        current + 1
      );
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,

        loadNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context =
    useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
};