import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Inbox,
  X,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationContext";

function Notifications() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    
  } = useNotifications();
  const { t } = useLanguage();

  const [actionLoading, setActionLoading] =
    useState(null);

  const handleMarkAsRead = async (id) => {
    try {
      setActionLoading(id);
      await markAsRead(id);
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionLoading(id);
      await removeNotification(id);
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading("all");
      await markAllAsRead();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "deposit":
        return "↓";

      case "withdrawal":
        return "↑";

      case "game":
        return "🎮";

      case "wallet":
        return "◈";

      default:
        return "!";
    }
  };

  const formatDate = (date) => {
  if (!date) {
    return "";
  }

  const notificationDate = new Date(date);
  const now = new Date();

  const diff =
    now.getTime() -
    notificationDate.getTime();

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return t("notifications.time.justNow");
  }

  if (minutes < 60) {
    return `${minutes}${t(
      "notifications.time.minutesAgo"
    )}`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}${t(
      "notifications.time.hoursAgo"
    )}`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}${t(
      "notifications.time.daysAgo"
    )}`;
  }

  return notificationDate.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};

  return (
    <div className="player-notifications-page">
      <div className="notifications-header">
        <div className="notifications-title">
          <div className="notifications-title-icon">
            <Bell size={22} />
          </div>

          <div>
            <h1>
  {t("notifications.title")}
</h1>

<p>
  {t("notifications.subtitle")}
</p>
          </div>
        </div>

        <div className="notifications-actions">
          <button
            type="button"
            className="notification-refresh-btn"
            onClick={loadNotifications}
            disabled={loading}
            title={t("notifications.refresh")}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "notification-spin"
                  : ""
              }
            />
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
              disabled={
                actionLoading === "all"
              }
            >
              <CheckCheck size={17} />
              {actionLoading === "all"
  ? t("notifications.marking")
  : t("notifications.markAllRead")}
            </button>
          )}
        </div>
      </div>

      <div className="notifications-summary">
        <div className="notification-summary-item">
         <span className="summary-label">
  {t("notifications.total")}
</span>

          <strong>
            {notifications.length}
          </strong>
        </div>

        <div className="notification-summary-divider" />

        <div className="notification-summary-item">
          <span className="summary-label">
  {t("notifications.unread")}
</span>

          <strong className="unread-number">
            {unreadCount}
          </strong>
        </div>
      </div>

      {error && (
        <div className="notifications-error">
          <X size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading &&
      notifications.length === 0 ? (
        <div className="notifications-loading">
          <RefreshCw
            size={24}
            className="notification-spin"
          />

          <p>
            {t("notifications.loading")}
          </p>
        </div>
      ) : notifications.length ===
        0 ? (
        <div className="notifications-empty">
          <div className="notifications-empty-icon">
            <Inbox size={36} />
          </div>

          <h2>
            {t("notifications.emptyTitle")}
          </h2>

          <p>
            {t("notifications.emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(
            (notification) => (
              <div
                key={notification._id}
                className={`notification-card ${
                  notification.read
                    ? "notification-read"
                    : "notification-unread"
                }`}
              >
                {!notification.read && (
                  <div className="notification-unread-dot" />
                )}

                <div
                  className={`notification-type-icon notification-type-${notification.type}`}
                >
                  {getNotificationIcon(
                    notification.type
                  )}
                </div>

                <div className="notification-content">
                  <div className="notification-top">
                    <div>
                      <h3>
                        {notification.title}
                      </h3>

                      <span className="notification-type-label">
  {t(
    `notifications.types.${
      notification.type || "system"
    }`
  )}
</span>
                    </div>

                    <span className="notification-time">
                      {formatDate(
                        notification.createdAt
                      )}
                    </span>
                  </div>

                  <p>
                    {notification.message}
                  </p>

                  <div className="notification-card-actions">
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() =>
                          handleMarkAsRead(
                            notification._id
                          )
                        }
                        disabled={
                          actionLoading ===
                          notification._id
                        }
                        className="notification-action-btn"
                      >
                        <Check size={15} />

                       {actionLoading === notification._id
  ? t("notifications.updating")
  : t("notifications.markAsRead")}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          notification._id
                        )
                      }
                      disabled={
                        actionLoading ===
                        notification._id
                      }
                      className="notification-delete-btn"
                    >
                     <Trash2 size={15} />
{t("notifications.delete")}
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;