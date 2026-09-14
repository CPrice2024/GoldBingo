import {
  getToken,
  onMessage,
} from "firebase/messaging";
import {
  Capacitor,
} from "@capacitor/core";
import { messaging } from "./firebase";

const VAPID_KEY =
  "BHw0vbHQF2KjjeM5yOJvkoZGo3Ozy1QIz3umHHNwicFOXwRncV6DDzKNNxwJMXcjsJtAVZcljPM8NEVD6xSBnDM";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

export const requestFcmToken = async (
  accessToken
) => {

  /*
   * Firebase Web Messaging is only
   * for the browser version.
   *
   * Android Capacitor uses
   * @capacitor/push-notifications.
   */
  if (
    Capacitor.isNativePlatform()
  ) {
    console.log(
      "[FCM WEB] Skipped on native platform"
    );

    return null;
  }

  try {
    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {
      console.log(
        "Notification permission denied"
      );

      return null;
    }

    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    console.log(
      "FCM service worker registered:",
      registration
    );

    const token =
      await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration:
          registration,
      });

    if (!token) {
      console.log(
        "No FCM registration token available"
      );

      return null;
    }

    console.log(
      "REAL FCM TOKEN generated:",
      token
    );

    const response = await fetch(
      `${API_URL}/notifications/token`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },

        body: JSON.stringify({
          fcmToken: token,
        }),
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
          "Failed to register FCM token"
      );
    }

    console.log(
      "FCM token registered:",
      result
    );

    return token;
  } catch (error) {
    console.error(
      "FCM setup error:",
      error
    );

    throw error;
  }
};


// ========================================
// FOREGROUND FCM LISTENER
// ========================================

export const listenForMessages = (
  callback
) => {

  if (
    Capacitor.isNativePlatform()
  ) {
    console.log(
      "[FCM WEB] Foreground listener skipped on native platform"
    );

    return () => {};
  }

  return onMessage(
    messaging,
    async (payload) => {
      console.log(
        "🔥 FCM FOREGROUND MESSAGE:",
        payload
      );

      // Keep updating GoldBingo's
      // internal notification page
      callback(payload);

      // Also show Android/Chrome
      // system notification
      if (
        Notification.permission ===
        "granted"
      ) {
        try {
          const registration =
            await navigator
              .serviceWorker
              .ready;

          const title =
            payload.notification?.title ||
            payload.data?.title ||
            "GoldBingo";

          const body =
            payload.notification?.body ||
            payload.data?.body ||
            "A new Bingo game is available.";

          await registration.showNotification(
            title,
            {
              body,

              icon:
                "/og-image.png",

              badge:
                "/og-image.png",

              tag:
                payload.messageId ||
                `goldbingo-${Date.now()}`,

              data: {
                ...(payload.data || {}),

                url:
                  payload.data?.url ||
                  "/player",
              },
            }
          );

          console.log(
            "✅ Foreground system notification shown"
          );
        } catch (error) {
          console.error(
            "❌ Failed to show foreground notification:",
            error
          );
        }
      } else {
        console.log(
          "⚠️ Notification permission is not granted:",
          Notification.permission
        );
      }
    }
  );
};