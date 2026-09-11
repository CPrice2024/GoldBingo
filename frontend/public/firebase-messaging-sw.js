/* global importScripts, firebase */

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey:
    "AIzaSyBtJQ-lLHWjHi-F4f0Q_v8EEn8k4NlQFTo",

  authDomain:
    "bingohub-fdba7.firebaseapp.com",

  projectId:
    "bingohub-fdba7",

  storageBucket:
    "bingohub-fdba7.firebasestorage.app",

  messagingSenderId:
    "796543997792",

  appId:
    "1:796543997792:web:bb705bea44eb431fa1b005",
});

const messaging =
  firebase.messaging();


messaging.onBackgroundMessage(
  (payload) => {

    console.log(
      "[FCM SW] Background message received:",
      payload
    );

    const title =
      payload.notification?.title ||
      payload.data?.title ||
      "GoldBingo";

    const body =
      payload.notification?.body ||
      payload.data?.body ||
      "A new Bingo game is available.";

    const options = {
      body,

      icon:
        "/og-image.png",

      data: {
        ...(payload.data || {}),

        url:
          payload.data?.url ||
          "/",
      },
    };

    return self.registration.showNotification(
      title,
      options
    );
  }
);


self.addEventListener(
  "notificationclick",
  (event) => {

    event.notification.close();

    const url =
      event.notification.data?.url ||
      "/";

    event.waitUntil(
      clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {

        for (
          const client of clientList
        ) {

          if (
            "focus" in client
          ) {
            client.navigate(url);
            return client.focus();
          }
        }

        return clients.openWindow(
          url
        );
      })
    );
  }
);