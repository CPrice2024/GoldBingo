import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import authRoutes from "./modules/auth/auth.routes";
import adminRoutes from "./modules/admin/admin.routes";
import agentRoutes from "./modules/agents/agent.routes";
import walletRoutes from "./modules/wallet/wallet.routes";
import depositRoutes from "./modules/deposits/deposit.routes";
import transactionRoutes from "./modules/transactions/transaction.routes";
import withdrawalRoutes from "./modules/withdrawals/withdrawal.routes";
import gameRoutes from "./modules/games/game.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import gamePlayerRoutes from "./modules/gamePlayers/gamePlayer.routes";
import cardRoutes from "./modules/cards/card.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import profileRoutes from "./modules/profile/profile.routes";
import promotionRoutes from "./modules/promotions/promotion.routes";
import otpRoutes from "./otp/otp.routes";
import paymentSmsRoutes from "./modules/paymentSms/paymentSms.routes";

const app = express();

/* =========================
   CORS
========================= */

const allowedOrigins = [
  "https://goldbingo.org",
  "https://www.goldbingo.org",
  "https://goldbingo-frontend.onrender.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as Thunder Client, Postman, server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS blocked origin:", origin);

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

/* =========================
   GLOBAL MIDDLEWARE
========================= */

app.use(express.json({limit: "2mb", }));

app.use(express.urlencoded({extended: true,limit: "2mb",}));

app.use(cookieParser());

app.use(helmet());

app.use(compression());

app.use(morgan("dev"));

app.use("/api/v1/settings", settingsRoutes);

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 BingoHub API is running",
  });
});

/* =========================
   OTP
========================= */

app.use("/api/v1/otp", otpRoutes);

app.use("/api/v1/payment-sms", paymentSmsRoutes);

/* =========================
   AUTH
========================= */

app.use("/api/v1/auth", authRoutes);

/* =========================
   ADMIN
========================= */

app.use("/api/v1/admin", adminRoutes);

/* =========================
   AGENTS
========================= */

app.use("/api/v1/agents", agentRoutes);

/* =========================
   WALLET
========================= */

app.use("/api/v1/wallet", walletRoutes);

/* =========================
   DEPOSITS
========================= */

app.use("/api/v1/deposits", depositRoutes);

/* =========================
   TRANSACTIONS
========================= */

app.use("/api/v1/transactions", transactionRoutes);

/* =========================
   WITHDRAWALS
========================= */

app.use("/api/v1/withdrawals", withdrawalRoutes);

/* =========================
   GAMES
========================= */

app.use("/api/v1/games", gameRoutes);

/* =========================
   GAME PLAYERS
========================= */

app.use("/api/v1/game-players", gamePlayerRoutes);

/* =========================
   CARDS
========================= */

app.use("/api/v1/cards", cardRoutes);

/* =========================
   NOTIFICATIONS
========================= */

app.use("/api/v1/notifications", notificationRoutes);

/* =========================
   PROFILE
========================= */

app.use("/api/v1/profile", profileRoutes);


/* =========================
   PROMOTIONS
========================= */

app.use(
  "/api/v1/promotions",
  promotionRoutes
);

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Global error:", err);

    const statusCode = err.status || 500;

    res.status(statusCode).json({
      success: false,
      message:
        err.message || "Internal server error",
    });
  }
);

export default app;