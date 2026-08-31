import { findGameById } from "./game.repository";
import { Game } from "./game.model";

import {
  callGameNumber,
  completeGame,
  createNewGame,
  startGame,
} from "./game.service";

import {
  AppSettings,
} from "../settings/appSettings.model";

const timers = new Map<string, NodeJS.Timeout>();

const joiningTimers = new Map<string, NodeJS.Timeout>();
const DEFAULT_JOINING_WINDOW_SECONDS =
  120;

const DEFAULT_CALL_INTERVAL_SECONDS =
  5;

const scheduledStartTimers =
  new Map<
    string,
    NodeJS.Timeout
  >();

  /* =========================================================
   AUTOMATIC GAME SETTING
========================================================= */

const isAutomaticGameEnabled =
  async () => {

    const settings =
      await AppSettings.findOne({
        key: "global",
      })
        .select(
          "automaticGameEnabled"
        )
        .lean();


    /*
     * Default TRUE so existing
     * installations keep working
     * if the setting document
     * does not exist yet.
     */
    return (
      settings
        ?.automaticGameEnabled !==
      false
    );
  };
  

const getDurationSeconds = (
  value: unknown,
  fallback: number
) => {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return Math.floor(parsed);
};
export const NEXT_GAME_DELAY_MS = 2 * 60 * 1000;


export const scheduleNextGame =
  async (
    previousGame: any
  ) => {

    try {

      console.log(
        `[BINGO] ${previousGame.name} finished`
      );


      /* =========================================
         CHECK AUTOMATIC GAME MODE
      ========================================= */

      const automaticGameEnabled =
        await isAutomaticGameEnabled();


      if (
        !automaticGameEnabled
      ) {

        console.log(
          "[BINGO] Automatic Game Mode is OFF."
        );

        console.log(
          "[BINGO] Waiting for admin to create the next game."
        );

        return null;
      }


      /* =========================================
         PREVENT DUPLICATE WAITING GAME
      ========================================= */

      const existingWaitingGame =
        await Game.findOne({
          status: "waiting",
        });


      if (
        existingWaitingGame
      ) {

        console.log(
          `[BINGO] Waiting game already exists: ${existingWaitingGame.name}`
        );

        return existingWaitingGame;
      }


      /* =========================================
         AUTOMATICALLY CREATE NEXT GAME
      ========================================= */

      const nextGame =
        await createNextGame(
          previousGame
        );


      console.log(
        `[BINGO] New waiting game created: ${nextGame.name}`
      );


      console.log(
        `[BINGO] Players can now join ${nextGame.name}`
      );


      return nextGame;

    } catch (error) {

      console.error(
        "[BINGO] Failed to schedule next game:",
        error
      );

      return null;

    }

  };


/* =========================================================
   START 2-MINUTE JOINING WINDOW
========================================================= */

export const startJoiningWindow =
  async (
    gameId: string
  ) => {
    if (
      joiningTimers.has(gameId)
    ) {
      console.log(
        `[BINGO] Joining window already running for ${gameId}`
      );

      return;
    }

    const game =
      await findGameById(
        gameId
      );

    if (!game) {
      return;
    }

    if (
      game.status !== "waiting"
    ) {
      return;
    }
    const automaticGameEnabled =
  await isAutomaticGameEnabled();


if (
  !automaticGameEnabled
) {

  /*
   * Manual mode:
   * Player may join,
   * but normal joining countdown
   * must NOT start.
   */

  if (
    game.joiningEndsAt
  ) {
    game.joiningEndsAt =
      null;

    await game.save();
  }


  if (
    game.scheduledStartAt
  ) {

    await scheduleAdminGameStart(
      gameId
    );

    console.log(
      `[ID] ${game.name} waiting for scheduled start at ${game.scheduledStartAt}`
    );

  } else {

    console.log(
      `[ID] ${game.name} waiting for admin to press Start`
    );

  }


  return;
}

    const durationSeconds =
      getDurationSeconds(
        game.joiningWindowSeconds,
        DEFAULT_JOINING_WINDOW_SECONDS
      );

    const now = Date.now();

    let endsAt =
      game.joiningEndsAt
        ? new Date(
            game.joiningEndsAt
          ).getTime()
        : 0;

    if (
      !endsAt ||
      endsAt <= now
    ) {
      endsAt =
        now +
        durationSeconds *
          1000;

      game.joiningEndsAt =
        new Date(endsAt);

      await game.save();
    }

    const remainingMs =
      Math.max(
        0,
        endsAt -
          Date.now()
      );

    console.log(
      `[BINGO] ${game.name} starts in ${Math.ceil(
        remainingMs / 1000
      )} seconds`
    );

    const timer =
      setTimeout(
        async () => {
          joiningTimers.delete(
            gameId
          );

          try {
            const currentGame =
              await findGameById(
                gameId
              );

            if (!currentGame) {
              return;
            }

            if (
              currentGame.status !==
              "waiting"
            ) {
              return;
            }

            if (
              currentGame.currentPlayers <=
              0
            ) {
              currentGame.joiningEndsAt =
                null;

              await currentGame.save();

              console.log(
                `[BINGO] ${currentGame.name} has no players.`
              );

              return;
            }

            const automaticGameEnabled =
  await isAutomaticGameEnabled();


if (
  !automaticGameEnabled
) {

  currentGame.joiningEndsAt =
    null;

  await currentGame.save();


  if (
    currentGame.scheduledStartAt
  ) {

    await scheduleAdminGameStart(
      gameId
    );

    console.log(
      `[BINGO] Automatic mode OFF. ${currentGame.name} will use scheduled start.`
    );

  } else {

    console.log(
      `[BINGO] Automatic mode OFF. ${currentGame.name} remains waiting for admin.`
    );

  }


  return;
}


currentGame.joiningEndsAt =
  null;

await currentGame.save();


console.log(
  `[BINGO] Automatically starting ${currentGame.name}`
);


await startGame(
  gameId
);
          } catch (error) {
            console.error(
              `[BINGO] Failed to start game after countdown:`,
              error
            );
          }
        },
        remainingMs
      );

    joiningTimers.set(
      gameId,
      timer
    );
  };

/* =========================================================
   START AUTOMATIC CALLER
========================================================= */

export const startAutomaticCaller =
  async (
    gameId: string
  ) => {
    if (
      timers.has(gameId)
    ) {
      console.log(
        `[BINGO] Caller already running for ${gameId}`
      );

      return;
    }

    const game =
      await findGameById(
        gameId
      );

    if (!game) {
      return;
    }

    if (
      game.status !== "active"
    ) {
      return;
    }

    if (
      game.calledNumbers.length >=
      75
    ) {
      await finishGame(
        gameId
      );

      return;
    }

    const intervalSeconds =
      getDurationSeconds(
        game.callIntervalSeconds,
        DEFAULT_CALL_INTERVAL_SECONDS
      );

    const now =
      Date.now();

    let nextCallTime =
      game.nextCallAt
        ? new Date(
            game.nextCallAt
          ).getTime()
        : 0;

    if (
      !nextCallTime ||
      nextCallTime <= now
    ) {
      nextCallTime =
        now +
        intervalSeconds *
          1000;

      game.nextCallAt =
        new Date(
          nextCallTime
        );

      await game.save();
    }

    const remainingMs =
      Math.max(
        0,
        nextCallTime -
          Date.now()
      );

    console.log(
      `[ID] ${game.name} next number in ${Math.ceil(
        remainingMs / 1000
      )} seconds`
    );

    const timer =
      setTimeout(
        async () => {
          timers.delete(
            gameId
          );

          try {
            const currentGame =
              await findGameById(
                gameId
              );

            if (!currentGame) {
              return;
            }

            if (
              currentGame.status !==
              "active"
            ) {
              return;
            }

            if (
              currentGame.calledNumbers
                .length >= 75
            ) {
              await finishGame(
                gameId
              );

              return;
            }

            const result =
              await callGameNumber(
                gameId
              );

            console.log(
              `[BINGO] ${currentGame.name} → ${result.number}`
            );

            if (
              result.calledNumbers
                .length >= 75
            ) {
              await finishGame(
                gameId
              );

              return;
            }

            await Game.updateOne(
              {
                _id: gameId,
              },
              {
                $set: {
                  nextCallAt:
                    null,
                },
              }
            );

            await startAutomaticCaller(
              gameId
            );
          } catch (error) {
            console.error(
              `[BINGO] Automatic caller error for ${gameId}:`,
              error
            );

            await Game.updateOne(
              {
                _id: gameId,
              },
              {
                $set: {
                  nextCallAt:
                    null,
                },
              }
            );

            await startAutomaticCaller(
              gameId
            );
          }
        },
        remainingMs
      );

    timers.set(
      gameId,
      timer
    );
  };


/* =========================================================
   FINISH GAME
========================================================= */

const finishGame = async (gameId: string) => {
  stopAutomaticCaller(gameId);

  try {
    const game = await completeGame(gameId);

    if (!game) {
      return;
    }

    console.log(
      `[ID] ${game.name} finished after 75 numbers`
    );

    // Schedule the next waiting game
    await scheduleNextGame(game);

  } catch (error) {
    console.error(
      `[ID] Failed to finish game ${gameId}:`,
      error
    );
  }
};

/* =========================================================
   CREATE NEXT GAME
========================================================= */

const createNextGame = async (
  previousGame: any
) => {

  const nextGame =
    await createNewGame({

      name:
        await generateRandomGameName(),

      entryFee:
        previousGame.entryFee,

      maxPlayers:
        previousGame.maxPlayers,

    });


  console.log(
    `[BINGO] New waiting game created: ${nextGame.name}`
  );

  console.log(
    `[BINGO] Waiting for the first player to join`
  );


  return nextGame;
};


/* =========================================================
   GAME NAME
========================================================= */

const generateRandomGameName =
  async () => {

    for (
      let attempt = 0;
      attempt < 10;
      attempt++
    ) {

      const randomNumber =
        Math.floor(
          100000 +
            Math.random() * 900000
        );


      const name =
        `ID #${randomNumber}`;


      const alreadyExists =
        await Game.exists({
          name,
        });


      if (!alreadyExists) {
        return name;
      }

    }


    return `ID #${Date.now()
      .toString()
      .slice(-6)}`;

  };


/* =========================================================
   STOP CALLER
========================================================= */

export const stopAutomaticCaller = (
  gameId: string
) => {
  const timer =
    timers.get(
      gameId
    );

  if (timer) {
    clearTimeout(
      timer
    );

    timers.delete(
      gameId
    );
  }

  void Game.updateOne(
    {
      _id: gameId,
    },
    {
      $set: {
        nextCallAt:
          null,
      },
    }
  ).catch(
    (error) => {
      console.error(
        `[BINGO] Failed to clear nextCallAt for ${gameId}:`,
        error
      );
    }
  );

  console.log(
    `[BINGO] Automatic caller stopped for ${gameId}`
  );
};




/* =========================================================
   RECOVER GAME WITH 75 NUMBERS
========================================================= */

const completeRecoveredGame =
  async (
    gameId: string
  ) => {
    try {
      stopAutomaticCaller(gameId);

      const game =
        await completeGame(gameId);

      if (!game) {
        return;
      }

      console.log(
        `[BINGO] Recovered game completed: ${game.name}`
      );

      console.log(
        `[BINGO] Waiting 2 minutes for next game...`
      );

    scheduleNextGame(game);

    } catch (error) {
      console.error(
        "[BINGO] Failed to complete recovered game:",
        error
      );
    }
  };


/* =========================================================
   RECOVERY GAME NAME
========================================================= */

const getRecoveryGameName =
  async () => {

    return await generateRandomGameName();

  };
/* =========================================================
   ENSURE AUTOMATIC GAME EXISTS
========================================================= */

export const ensureAutomaticGameAvailable =
  async () => {

    const automaticGameEnabled =
      await isAutomaticGameEnabled();


    if (
      !automaticGameEnabled
    ) {
      return null;
    }


    /*
     * Do not create another game
     * when one is already available.
     */
    const existingGame =
      await Game.findOne({
        status: {
          $in: [
            "waiting",
            "active",
          ],
        },
      }).sort({
        createdAt: -1,
      });


    if (
      existingGame
    ) {

      console.log(
        `[BINGO] Current game already exists: ${existingGame.name}`
      );

      return existingGame;
    }


    /*
     * Automatic Mode is ON,
     * but no game exists.
     */
    const newGame =
      await createNewGame({

        name:
          await getRecoveryGameName(),

        entryFee:
          10,

        maxPlayers:
          500,

      });


    console.log(
      `[BINGO] Automatic Mode created waiting game: ${newGame.name}`
    );


    return newGame;
  };
/* =========================================================
   SERVER STARTUP RECOVERY
========================================================= */

export const recoverAutomaticGames = async () => {
  try {
    console.log(
      "[BINGO] Checking games after server startup..."
    );

    // ---------------------------------------------
    // 1. Check active game
    // ---------------------------------------------

    const activeGame =
      await Game.findOne({
        status: "active",
      }).sort({
        createdAt: -1,
      });

    if (activeGame) {
      console.log(
        `[BINGO] Active game found: ${activeGame.name}`
      );

      console.log(
        `[BINGO] Called numbers: ${activeGame.calledNumbers.length}/75`
      );

      if (
        activeGame.calledNumbers.length >= 75
      ) {
        await completeRecoveredGame(
          activeGame._id.toString()
        );

        return;
      }

      await startAutomaticCaller(
  activeGame._id.toString()
);

      return;
    }

    // ---------------------------------------------
    // 2. Check waiting game
    // ---------------------------------------------

    const waitingGame =
      await Game.findOne({
        status: "waiting",
      }).sort({
        createdAt: -1,
      });

    if (waitingGame) {
      console.log(
        `[BINGO] Waiting game found: ${waitingGame.name}`
      );

      console.log(
        `[BINGO] Players: ${waitingGame.currentPlayers}/${waitingGame.maxPlayers}`
      );

      if (
        waitingGame.currentPlayers > 0
      ) {
        console.log(
          `[BINGO] Restarting joining window for ${waitingGame.name}`
        );

        await startJoiningWindow(
  waitingGame._id.toString()
);
      } else {
  if (
    waitingGame.joiningEndsAt
  ) {
    waitingGame.joiningEndsAt =
      null;

    await waitingGame.save();
  }

  console.log(
    `[BINGO] Waiting for the first player to join`
  );
}

      return;
    }

   // ---------------------------------------------
// 3. No active/waiting game
// ---------------------------------------------

const automaticGameEnabled =
  await isAutomaticGameEnabled();


if (
  !automaticGameEnabled
) {

  console.log(
    "[BINGO] No active or waiting game."
  );

  console.log(
    "[BINGO] Automatic Game Mode is OFF."
  );

  console.log(
    "[BINGO] Waiting for admin to create a game."
  );

  return;
}


/* =========================================
   AUTOMATIC RECOVERY GAME
========================================= */

const newGame =
  await createNewGame({

    name:
      await getRecoveryGameName(),

    entryFee:
      10,

    maxPlayers:
      500,

  });


console.log(
  `[BINGO] Recovery created waiting game: ${newGame.name}`
);

    console.log(
      `[BINGO] Recovery created waiting game: ${newGame.name}`
    );

  } catch (error) {
    console.error(
      "[BINGO] Startup recovery failed:",
      error
    );
  }
};



export const scheduleAdminGameStart =
  async (
    gameId: string
  ) => {

    const existingTimer =
      scheduledStartTimers.get(
        gameId
      );


    if (existingTimer) {

      clearTimeout(
        existingTimer
      );

      scheduledStartTimers.delete(
        gameId
      );

    }


    const game =
      await findGameById(
        gameId
      );


    if (
      !game ||
      game.status !== "waiting" ||
      !game.scheduledStartAt
    ) {
      return;
    }


    const startTime =
      new Date(
        game.scheduledStartAt
      ).getTime();


    if (
      !Number.isFinite(
        startTime
      )
    ) {
      return;
    }


    const remainingMs =
      Math.max(
        0,
        startTime -
          Date.now()
      );


    console.log(
      `[BINGO] ${game.name} scheduled to start in ${Math.ceil(
        remainingMs / 1000
      )} seconds`
    );


    const timer =
      setTimeout(
        async () => {

          scheduledStartTimers.delete(
            gameId
          );


          try {

            const currentGame =
              await findGameById(
                gameId
              );


            if (
              !currentGame ||
              currentGame.status !==
                "waiting"
            ) {
              return;
            }


            if (
              currentGame.currentPlayers <=
              0
            ) {

              console.log(
                `[BINGO] ${currentGame.name} could not start because no players joined`
              );

              return;
            }


            console.log(
              `[BINGO] Starting scheduled game ${currentGame.name}`
            );


            await startGame(
              gameId
            );


          } catch (error) {

            console.error(
              `[BINGO] Failed to start scheduled game ${gameId}:`,
              error
            );

          }

        },

        remainingMs
      );


    scheduledStartTimers.set(
      gameId,
      timer
    );

  };