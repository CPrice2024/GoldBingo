import { User } from "../users/user.model";

export const findAgentById = async (agentId: string) => {
  return User.findOne({
    _id: agentId,
    role: "agent",
  }).select("-password");
};

export const findPlayersByAgentId = async (
  agentId: string
) => {
  return User.find({
    referredBy: agentId,
    role: "player",
  })
    .select("-password")
    .sort({ createdAt: -1 });
};

export const countPlayersByAgentId = async (
  agentId: string
) => {
  return User.countDocuments({
    referredBy: agentId,
    role: "player",
  });
};

export const countActivePlayersByAgentId = async (
  agentId: string
) => {
  return User.countDocuments({
    referredBy: agentId,
    role: "player",
    status: "active",
  });
};