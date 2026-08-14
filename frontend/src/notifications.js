import {
  getToken,
  onMessage,
} from "firebase/messaging";

import { messaging } from "./firebase";

const VAPID_KEY =
  "BHw0vbHQF2KjjeM5yOJvkoZGo3Ozy1QIz3umHHNwicFOXwRncV6DDzKNNxwJMXcjsJtAVZcljPM8NEVD6xSBnDM";

const API_URL = "http://localhost:5000/api/v1";

export const requestFcmToken = async (accessToken) => {
  try {
    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {
      console.log(
        "Notification permission denied"
      );
      return null;
    }

    // Make sure Firebase Messaging service worker
    // is registered.
    const registration =
      await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

    console.log(
      "FCM service worker registered:",
      registration
    );

    const token = await getToken(messaging, {
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

    // Register token with Gold backend
    const response = await fetch(
      `${API_URL}/notifications/token`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
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
  return onMessage(
    messaging,
    (payload) => {
      console.log(
        "🔥 FCM FOREGROUND MESSAGE:",
        payload
      );

      callback(payload);
    }
  );
};