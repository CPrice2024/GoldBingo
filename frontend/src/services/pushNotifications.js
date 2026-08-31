import {
  PushNotifications,
} from "@capacitor/push-notifications";

import {
  Capacitor,
} from "@capacitor/core";


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
          (token) => {

            console.log(
              "================================"
            );

            console.log(
              "🔥 FCM DEVICE TOKEN:"
            );

            console.log(
              token.value
            );

            console.log(
              "================================"
            );

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