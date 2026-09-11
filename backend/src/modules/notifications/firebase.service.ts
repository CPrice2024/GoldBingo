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


/* =========================================
   FIREBASE CONFIG
========================================= */

const serviceAccountPath =
  process.env.RENDER
    ? "/etc/secrets/firebase-service-account.json"
    : path.join(
        process.cwd(),
        "firebase-service-account.json"
      );


const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(
          serviceAccountPath
        ),
      });


const messaging =
  getMessaging(firebaseApp);


/* =========================================
   ALL PLAYER TOPIC
========================================= */

export const PLAYER_NOTIFICATION_TOPIC =
  "goldbingo_players";


/* =========================================
   SEND TO ONE DEVICE
========================================= */

export const sendPushNotification =
  async (
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) => {

    if (!token?.trim()) {
      throw new Error(
        "FCM token is required"
      );
    }


    const message: Message = {
      token:
        token.trim(),

      notification: {
        title,
        body,
      },

      data:
        data || {},

      android: {
        priority: "high",

        notification: {
          sound: "default",
        },
      },
    };


    const response =
      await messaging.send(
        message
      );


    console.log(
      "[FCM] Notification sent:",
      response
    );


    return response;
  };


/* =========================================
   SUBSCRIBE PLAYER
========================================= */

export const subscribePlayerToNotifications =
  async (
    token: string
  ) => {

    const cleanToken =
      token?.trim();


    if (!cleanToken) {
      throw new Error(
        "FCM token is required"
      );
    }


    const result =
      await messaging
        .subscribeToTopic(
          cleanToken,
          PLAYER_NOTIFICATION_TOPIC
        );


    console.log(
      "[FCM] Player subscribed:",
      PLAYER_NOTIFICATION_TOPIC
    );


    return result;
  };


/* =========================================
   UNSUBSCRIBE OLD DEVICE
========================================= */

export const unsubscribePlayerFromNotifications =
  async (
    token: string
  ) => {

    const cleanToken =
      token?.trim();


    if (!cleanToken) {
      return null;
    }


    return messaging
      .unsubscribeFromTopic(
        cleanToken,
        PLAYER_NOTIFICATION_TOPIC
      );
  };


/* =========================================
   SEND NEW GAME TO ALL PLAYERS
========================================= */

export const sendNewGameNotification =
  async (
    game: any
  ) => {

    if (!game?._id) {
      throw new Error(
        "Game ID is required"
      );
    }


    const gameId =
      String(game._id);


    const gameNumber =
      String(
        game.gameNumber || ""
      );


    const gameType =
      Number(
        game.gameType ?? 1
      );


    const entryFee =
      Number(
        game.entryFee || 0
      );


    const prize =
      Number(
        game.prizeAmount ??
        game.prizePool ??
        0
      );


    const isBonusGame =
      gameType === -1;


    const title =
      isBonusGame
        ? "🎁 Bonus Bingo Game"
        : "🎱 New Bingo Game";


    const body =
      isBonusGame
        ? "A free Bonus Bingo game is waiting. Join now!"
        : entryFee > 0
        ? `A new Bingo game is waiting. Join now for ${entryFee} Birr.`
        : "A new Bingo game is waiting. Join now!";


    const message: Message = {

      topic:
        PLAYER_NOTIFICATION_TOPIC,

      notification: {
        title,
        body,
      },

      data: {
        type:
          "new_game",

        gameId,

        gameNumber,

        gameType:
          String(gameType),

        entryFee:
          String(entryFee),

        prizeAmount:
          String(prize),

        status:
          String(
            game.status ||
            "waiting"
          ),
      },

      android: {
        priority: "high",

        notification: {
          sound: "default",
        },
      },
    };


    const response =
      await messaging.send(
        message
      );


    console.log(
      `[FCM] New game ${gameNumber} sent to all players`,
      response
    );


    return response;
  };


/* =========================================
   FIREBASE STATUS
========================================= */

export const verifyFirebaseConnection =
  async () => {

    if (
      !firebaseApp.options
        .credential
    ) {
      throw new Error(
        "Firebase credential is not configured"
      );
    }


    await firebaseApp.options
      .credential
      .getAccessToken();


    return {
      connected: true,

      projectId:
        firebaseApp.options
          .projectId ||
        process.env
          .FIREBASE_PROJECT_ID ||
        null,

      playerTopic:
        PLAYER_NOTIFICATION_TOPIC,
    };
  };