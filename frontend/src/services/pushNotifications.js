import {
  PushNotifications,
} from "@capacitor/push-notifications";

import {
  Capacitor,
} from "@capacitor/core";
import {
  getOrCreateDeviceId,
  saveDeviceCredential,
} from "../utils/deviceIdentity";
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

export const registerPushNotifications =
  async () => {

    /*
     * Browser does not use
     * Capacitor native push.
     */
    if (
      !Capacitor.isNativePlatform()
    ) {
      console.log(
        "[PUSH] Native platform not detected"
      );

      return;
    }


    try {

      /* ================================
         1. CHECK PERMISSION
      ================================= */

      let permission =
        await PushNotifications
          .checkPermissions();


      console.log(
        "[PUSH] Current permission:",
        permission
      );


      /* ================================
         2. REQUEST PERMISSION
      ================================= */

      if (
        permission.receive ===
        "prompt"
      ) {

        permission =
          await PushNotifications
            .requestPermissions();

      }


      if (
        permission.receive !==
        "granted"
      ) {

        console.log(
          "[PUSH] Permission denied"
        );

        return;

      }


      /* ================================
         3. REGISTRATION SUCCESS
      ================================= */

      await PushNotifications
  .addListener(
    "registration",
    async (token) => {

      console.log(
        "================================"
      );

      console.log(
        "🔥 NATIVE FCM DEVICE TOKEN:"
      );

    

      console.log(
        "================================"
      );


      try {

        const accessToken =
          localStorage.getItem(
            "accessToken"
          );


        if (!accessToken) {
          console.log(
            "[PUSH] No access token available yet"
          );

          return;
        }
        const deviceId =
  await getOrCreateDeviceId();

console.log(
  "[PUSH] Registering trusted Android device:",
  deviceId
);
        const response =
          await fetch(
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
  fcmToken:
    token.value,

  deviceId,

  platform:
    "android",
}),

            }
          );


        const result =
          await response.json();


        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to register native FCM token"
          );
        }
        /*
 * Backend returns this secret only
 * when this Android installation is
 * registered for the first time.
 */
if (
  result?.data?.deviceCredential
) {
  await saveDeviceCredential(
    result.data.deviceCredential
  );

  console.log(
    "[DEVICE] Android trusted-device credential saved"
  );
}
        console.log(
          "[PUSH] Native FCM token saved:",
          result
        );

      } catch (error) {

        console.error(
          "[PUSH] Failed to save native FCM token:",
          error
        );

      }

    }
  );


      /* ================================
         4. REGISTRATION ERROR
      ================================= */

      await PushNotifications
        .addListener(
          "registrationError",
          (error) => {

            console.error(
              "[PUSH] Registration error:",
              error
            );

          }
        );


      /* ================================
         5. FOREGROUND NOTIFICATION
      ================================= */

      await PushNotifications
        .addListener(
          "pushNotificationReceived",
          (notification) => {

            console.log(
              "[PUSH] Notification received:",
              notification
            );

          }
        );


      /* ================================
         6. USER TAPS NOTIFICATION
      ================================= */

      await PushNotifications
        .addListener(
          "pushNotificationActionPerformed",
          (action) => {

            console.log(
              "[PUSH] Notification tapped:",
              action
            );

          }
        );


      /* ================================
         7. REGISTER WITH FCM
      ================================= */

      await PushNotifications
        .register();


    } catch (error) {

      console.error(
        "[PUSH] Setup error:",
        error
      );

    }

  };