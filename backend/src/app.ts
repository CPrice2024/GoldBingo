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
import gamePlayerRoutes from "./modules/gamePlayers/gamePlayer.routes";
import cardRoutes from "./modules/cards/card.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import profileRoutes from "./modules/profile/profile.routes";



const app = express();


app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));


app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "🚀 BingoHub API is running",
  });
});

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/agents", agentRoutes);

app.use("/api/v1/wallet", walletRoutes);

app.use("/api/v1/deposits",depositRoutes);

app.use("/api/v1/transactions", transactionRoutes);

app.use("/api/v1/withdrawals",withdrawalRoutes);

app.use("/api/v1/games",gameRoutes);

app.use("/api/v1/game-players",gamePlayerRoutes);

app.use("/api/v1/cards", cardRoutes);

app.use("/api/v1/notifications",notificationRoutes);

app.use("/api/v1/profile",profileRoutes);

export default app;