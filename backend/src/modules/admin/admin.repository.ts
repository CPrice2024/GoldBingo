import { User } from "../users/user.model";
import { Game } from "../games/game.model";

export const getUserCounts = async () => {
  const [
    totalUsers,
    totalPlayers,
    totalAgents,
    totalAdmins,
    activePlayers,
    activeAgents,
    suspendedPlayers,
    blockedPlayers,
  ] = await Promise.all([
    User.countDocuments(),

    User.countDocuments({
      role: "player",
    }),

    User.countDocuments({
      role: "agent",
    }),

    User.countDocuments({
      role: "admin",
    }),

    User.countDocuments({
      role: "player",
      status: "active",
    }),

    User.countDocuments({
      role: "agent",
      status: "active",
    }),

    User.countDocuments({
      role: "player",
      status: "suspended",
    }),

    User.countDocuments({
      role: "player",
      status: "blocked",
    }),
  ]);

  return {
    totalUsers,
    totalPlayers,
    totalAgents,
    totalAdmins,
    activePlayers,
    activeAgents,
    suspendedPlayers,
    blockedPlayers,
  };
};

export const getGameCounts = async () => {
  const [
    totalGames,
    activeGames,
    waitingGames,
    completedGames,
  ] = await Promise.all([
    Game.countDocuments(),

    Game.countDocuments({
      status: "active",
    }),

    Game.countDocuments({
      status: "waiting",
    }),

    Game.countDocuments({
      status: "completed",
    }),
  ]);

  return {
    totalGames,
    activeGames,
    waitingGames,
    completedGames,
  };
};
export const findAllAgents = async () => {
  return User.find({
    role: "agent",
  })
    .select("-password")
    .sort({
      createdAt: -1,
    });
};

export const findAllPlayers = async () => {
  return User.find({
    role: "player",
  })
    .select("-password -fcmToken")
    .populate(
      "referredBy",
      "fullName phone referralCode"
    )
    .sort({
      createdAt: -1,
    });
};