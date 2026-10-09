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

import {
  listenForMessages,
} from "../notifications";

import {
  useAuth,
} from "./useAuth";

const NotificationContext =
  createContext(null);

export const NotificationProvider = ({
  children,
}) => {
  const {
    isAuthenticated,
    user,
    authReady,
    accessToken,
  } = useAuth();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  // ========================================
  // LOAD NOTIFICATIONS
  // ========================================

  const loadNotifications =
    async () => {
      /*
       * Do not make protected requests
       * until authentication restoration
       * has completely finished.
       */
      if (
        !authReady ||
        !isAuthenticated ||
        !user ||
        !accessToken
      ) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      /*
       * Remember which token started
       * this request.
       *
       * If logout/login happens while
       * requests are running, we ignore
       * the old response.
       */
      const tokenAtStart =
        accessToken;

      try {
        setLoading(true);
        setError(null);

        /*
         * IMPORTANT:
         * Run both requests together.
         *
         * Previously:
         *
         * notifications request
         *      ↓ wait
         * unread-count request
         *
         * If logout happened during
         * the wait, unread-count was
         * sent without a token -> 401.
         */
        const [
          result,
          unreadResult,
        ] = await Promise.all([
          getMyNotifications(),
          getUnreadNotificationCount(),
        ]);

        /*
         * Session may have changed
         * while requests were running.
         */
        const currentToken =
          localStorage.getItem(
            "accessToken"
          );

        if (
          !currentToken ||
          currentToken !==
            tokenAtStart
        ) {
          console.log(
            "[NOTIFICATIONS] Ignoring stale response"
          );

          return;
        }

        setNotifications(
          result?.data || []
        );

        setUnreadCount(
          unreadResult?.data?.count ??
            0
        );
      } catch (error) {
        /*
         * If the user logged out or
         * changed session while the
         * request was running, don't
         * show an authentication error.
         */
        const currentToken =
          localStorage.getItem(
            "accessToken"
          );

        if (
          !currentToken ||
          currentToken !==
            tokenAtStart
        ) {
          console.log(
            "[NOTIFICATIONS] Request cancelled by session change"
          );

          return;
        }

        console.error(
          "Failed to load notifications:",
          error
        );

        setError(
          error?.response?.data
            ?.message ||
            "Failed to load notifications"
        );
      } finally {
        /*
         * Only update loading state
         * for the same active session.
         */
        const currentToken =
          localStorage.getItem(
            "accessToken"
          );

        if (
          currentToken ===
          tokenAtStart
        ) {
          setLoading(false);
        }
      }
    };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    /*
     * Wait until AuthContext has
     * completely restored the session.
     */
    if (!authReady) {
      return;
    }

    /*
     * Logged out state.
     */
    if (
      !isAuthenticated ||
      !user ||
      !accessToken
    ) {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setLoading(false);

      return;
    }

    loadNotifications();
  }, [
    authReady,
    isAuthenticated,
    accessToken,
    user?.id,
  ]);

  // ========================================
  // FOREGROUND FCM LISTENER
  // ========================================

  useEffect(() => {
    /*
     * Don't start notification
     * listener before auth restoration.
     */
    if (
      !authReady ||
      !isAuthenticated ||
      !user ||
      !accessToken
    ) {
      return;
    }

    const unsubscribe =
      listenForMessages(
        (payload) => {
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

            userId:
              user.id,

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
              new Date()
                .toISOString(),

            updatedAt:
              new Date()
                .toISOString(),
          };

          setNotifications(
            (current) => [
              newNotification,
              ...current,
            ]
          );

          setUnreadCount(
            (current) =>
              current + 1
          );
        }
      );

    return () => {
      if (
        typeof unsubscribe ===
        "function"
      ) {
        unsubscribe();
      }
    };
  }, [
    authReady,
    isAuthenticated,
    accessToken,
    user?.id,
  ]);

  // ========================================
  // MARK ONE AS READ
  // ========================================

  const markAsRead = async (
    notificationId
  ) => {
    if (
      !isAuthenticated ||
      !accessToken
    ) {
      return;
    }

    try {
      const result =
        await markNotificationAsRead(
          notificationId
        );

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification._id ===
              notificationId
                ? {
                    ...notification,
                    read: true,
                  }
                : notification
          )
      );

      setUnreadCount(
        (current) =>
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

  const markAllAsRead =
    async () => {
      if (
        !isAuthenticated ||
        !accessToken
      ) {
        return;
      }

      try {
        const result =
          await markAllNotificationsAsRead();

        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                read: true,
              })
            )
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

  const removeNotification =
    async (
      notificationId
    ) => {
      if (
        !isAuthenticated ||
        !accessToken
      ) {
        return;
      }

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

        setNotifications(
          (current) =>
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
          setUnreadCount(
            (current) =>
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

    setNotifications(
      (current) => [
        notification,
        ...current,
      ]
    );

    if (!notification.read) {
      setUnreadCount(
        (current) =>
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

export const useNotifications =
  () => {
    const context =
      useContext(
        NotificationContext
      );

    if (!context) {
      throw new Error(
        "useNotifications must be used inside NotificationProvider"
      );
    }

    return context;
  };