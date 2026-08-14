import {
  findUserById,
  findUserByReferralCode,
  findPlayersByAgent,
} from "./user.repository";

export const getUserById = async (userId: string) => {
  return findUserById(userId);
};

export const getAgentByReferralCode = async (
  referralCode: string
) => {
  return findUserByReferralCode(referralCode);
};

export const getAgentPlayers = async (
  agentId: string
) => {
  return findPlayersByAgent(agentId);
};