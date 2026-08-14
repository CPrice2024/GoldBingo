import { findGameById } from "./game.repository";
import { Game } from "./game.model";

import {
  callGameNumber,
  completeGame,
  createNewGame,
  startGame,
} from "./game.service";

const timers = new Map<string, NodeJS.Timeout>();

const joiningTimers = new Map<string, NodeJS.Timeout>();

const CALL_INTERVAL_MS = 5000;

const JOINING_WINDOW_MS = 2 * 60 * 1000;

export const NEXT_GAME_DELAY_MS = 2 * 60 * 1000;


export const scheduleNextGame = async (
  previousGame: any
) => {
  try {
    console.log(
      `[BINGO] ${previousGame.name} finished`
    );

    // Prevent duplicate waiting games
    const existingWaitingGame =
      await Game.findOne({
        status: "waiting",
      });

    if (existingWaitingGame) {
      console.log(
        `[BINGO] Waiting game already exists: ${existingWaitingGame.name}`
      );

      return existingWaitingGame;
    }

    // Create next waiting game immediately
    const nextGame =
      await createNextGame(previousGame);

    console.log(
      `[BINGO] New waiting game created: ${nextGame.name}`
    );

    console.log(
      `[BINGO] Players can now join ${nextGame.name}`
    );

    return nextGame;
  } catch (error) {
    console.error(
      "[BINGO] Failed to create next waiting game:",
      error
    );

    return null;
  }
};



/* =========================================================
   START 2-MINUTE JOINING WINDOW
========================================================= */

export const startJoiningWindow = (
  gameId: string
) => {
  // Prevent duplicate timers
  if (joiningTimers.has(gameId)) {
    console.log(
      `[BINGO] Joining window already running for ${gameId}`
    );

    return;
  }

  console.log(
    `[BINGO] 2-minute joining window started for ${gameId}`
  );

  const timer = setTimeout(
    async () => {
      joiningTimers.delete(gameId);

      try {
        const game =
          await findGameById(gameId);

        if (!game) {
          console.log(
            `[BINGO] Game ${gameId} no longer exists`
          );

          return;
        }

        // Game is no longer waiting
        if (game.status !== "waiting") {
          console.log(
            `[BINGO] ${game.name} is no longer waiting`
          );

          return;
        }

        // Nobody joined
        if (game.currentPlayers === 0) {
          console.log(
            `[BINGO] ${game.name} has no players. Keeping game waiting.`
          );

          return;
        }
        console.log(
  `[BINGO] 2-minute joining window finished for ${game.name}`
);

console.log(
  `[BINGO] Players: ${game.currentPlayers}/${game.maxPlayers}`
);

console.log(
  `[BINGO] Attempting to start ${game.name}...`
);

const startedGame =
  await startGame(gameId);

console.log(
  `[BINGO] startGame() returned status: ${startedGame.status}`
);

console.log(
  `[BINGO] ${startedGame.name} is now ACTIVE`
);

startAutomaticCaller(gameId);

console.log(
  `[BINGO] Automatic caller started for ${startedGame.name}`
);

    

      } catch (error) {
        console.error(
          `[BINGO] Failed to start game after joining window:`,
          error
        );
      }
    },
    JOINING_WINDOW_MS
  );

  joiningTimers.set(
    gameId,
    timer
  );
};

/* =========================================================
   START AUTOMATIC CALLER
========================================================= */

export const startAutomaticCaller = (
  gameId: string
) => {
  // Prevent duplicate timers
  if (timers.has(gameId)) {
    console.log(
      `[BINGO] Caller already running for ${gameId}`
    );

    return;
  }

  console.log(
    `[BINGO] Automatic caller started for ${gameId}`
  );

  const timer = setInterval(
    async () => {
      try {
        const game =
          await findGameById(gameId);

        // Game no longer exists
        if (!game) {
          stopAutomaticCaller(gameId);
          return;
        }

        // Game is no longer active
        if (game.status !== "active") {
          stopAutomaticCaller(gameId);
          return;
        }

        // Safety check
        if (
          game.calledNumbers.length >= 75
        ) {
          await finishGame(gameId);
          return;
        }

        // Call next number
        const result =
          await callGameNumber(gameId);

        console.log(
          `[BINGO] ${game.name} → ${result.number}`
        );

        // 75th number
        if (
          result.calledNumbers.length >= 75
        ) {
          await finishGame(gameId);
        }

      } catch (error) {
        console.error(
          `[BINGO] Automatic caller error for ${gameId}:`,
          error
        );
      }
    },
    CALL_INTERVAL_MS
  );

  timers.set(gameId, timer);
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
      `[BINGO] ${game.name} finished after 75 numbers`
    );

    // Schedule the next waiting game
    await scheduleNextGame(game);

  } catch (error) {
    console.error(
      `[BINGO] Failed to finish game ${gameId}:`,
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
      name: getNextGameName(
        previousGame.name
      ),

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

const getNextGameName = (
  previousName: string
) => {
  const match =
    previousName.match(/#(\d+)/);

  if (!match) {
    return "Bingo Game #001";
  }

  const nextNumber =
    Number(match[1]) + 1;

  return `Bingo Game #${String(
    nextNumber
  ).padStart(3, "0")}`;
};


/* =========================================================
   STOP CALLER
========================================================= */

export const stopAutomaticCaller = (
  gameId: string
) => {
  const timer =
    timers.get(gameId);

  if (!timer) {
    return;
  }

  clearInterval(timer);

  timers.delete(gameId);

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
    const latestGame =
      await Game.findOne({})
        .sort({
          createdAt: -1,
        });

    if (!latestGame) {
      return "Bingo Game #001";
    }

    return getNextGameName(
      latestGame.name
    );
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

      startAutomaticCaller(
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

        startJoiningWindow(
          waitingGame._id.toString()
        );
      } else {
        console.log(
          `[BINGO] Waiting for the first player to join`
        );
      }

      return;
    }

    // ---------------------------------------------
    // 3. No active/waiting game
    // ---------------------------------------------

    const newGame =
      await createNewGame({
        name:
          await getRecoveryGameName(),

        entryFee: 20,

        maxPlayers: 500,
      });

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