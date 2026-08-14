import dotenv from "dotenv";

dotenv.config();

import mongoose from "mongoose";
import http from "http";
import app from "./app";

import {
  recoverAutomaticGames,
} from "./modules/games/game.autoCaller";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

async function startServer() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI!
    );

    console.log("✅ MongoDB Connected");

    // Recover/resume Bingo automation
    await recoverAutomaticGames();

    server.listen(PORT, () => {
      console.log(
        `🚀 Server running on http://localhost:${PORT}`
      );
    });

  } catch (error) {
    console.error(
      "❌ Failed to connect to MongoDB"
    );

    console.error(error);

    process.exit(1);
  }
}

startServer();