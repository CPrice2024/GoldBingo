importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBtJQ-lLHWjHi-F4f0Q_v8EEn8k4NlQFTo",
  authDomain: "bingohub-fdba7.firebaseapp.com",
  projectId: "bingohub-fdba7",
  storageBucket: "bingohub-fdba7.firebasestorage.app",
  messagingSenderId: "796543997792",
  appId: "1:796543997792:web:bb705bea44eb431fa1b005",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message:",
    payload
  );

  const notificationTitle =
    payload.notification?.title || "BingoHub";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "You have a new notification.",
    icon: "/vite.svg",
    data: payload.data || {},
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});