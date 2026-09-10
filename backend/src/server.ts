import dotenv from "dotenv";

dotenv.config();

import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";

import app from "./app";

import {
  recoverAutomaticGames,
} from "./modules/games/game.autoCaller";


const PORT =
  Number(process.env.PORT) ||
  5000;


/* =========================================
   HTTP SERVER
========================================= */

const server =
  http.createServer(app);


/* =========================================
   SOCKET.IO
========================================= */

const allowedSocketOrigins = [
  process.env.CLIENT_URL,

  "http://localhost:5173",

  "https://goldbingo.org",

  "https://www.goldbingo.org",

  "https://goldbingo-frontend.onrender.com",
].filter(Boolean) as string[];


const io =
  new Server(server, {
    cors: {
      origin:
        allowedSocketOrigins,

      credentials:
        true,

      methods: [
        "GET",
        "POST",
        "PATCH",
        "PUT",
        "DELETE",
      ],
    },
  });


/* =========================================
   MAKE SOCKET.IO AVAILABLE
   INSIDE EXPRESS CONTROLLERS
========================================= */

app.set(
  "io",
  io
);


/* =========================================
   SOCKET CONNECTION
========================================= */

io.on(
  "connection",
  (socket) => {

    console.log(
      `[SOCKET] Connected: ${socket.id}`
    );


    socket.on(
      "disconnect",
      () => {

        console.log(
          `[SOCKET] Disconnected: ${socket.id}`
        );

      }
    );

  }
);


/* =========================================
   START SERVER
========================================= */

async function startServer() {

  try {

    await mongoose.connect(
      process.env.MONGO_URI!
    );


    console.log(
      "✅ MongoDB Connected"
    );


    /* =========================================
       RECOVER BINGO AUTOMATION
    ========================================= */

    await recoverAutomaticGames();


    server.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `🚀 Server running on port ${PORT}`
        );

        console.log(
          `🔌 Socket.IO ready on port ${PORT}`
        );

      }
    );

  } catch (error) {

    console.error(
      "❌ Failed to connect to MongoDB"
    );

    console.error(
      error
    );

    process.exit(1);

  }

}


startServer();