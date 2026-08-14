import path from "path";

import {
  getApps,
  initializeApp,
  cert,
} from "firebase-admin/app";

import {
  getMessaging,
  Message,
} from "firebase-admin/messaging";

const serviceAccountPath = path.join(
  process.cwd(),
  "firebase-service-account.json"
);

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccountPath),
      });

const messaging = getMessaging(firebaseApp);

/**
 * Send a push notification to one specific FCM device token.
 */
export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  if (!token) {
    throw new Error("FCM token is required");
  }

  const message: Message = {
    token,

    notification: {
      title,
      body,
    },

    data: data || {},
  };

  const response = await messaging.send(message);

  console.log(
    "FCM notification sent:",
    response
  );

  return response;
};

export const verifyFirebaseConnection = async () => {
  if (!firebaseApp.options.credential) {
    throw new Error(
      "Firebase credential is not configured"
    );
  }

  await firebaseApp.options.credential.getAccessToken();

  return {
    connected: true,
    projectId:
      firebaseApp.options.projectId ||
      process.env.FIREBASE_PROJECT_ID ||
      null,
  };
};