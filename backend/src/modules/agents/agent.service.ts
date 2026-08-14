import {
  findAgentById,
  findPlayersByAgentId,
  countPlayersByAgentId,
  countActivePlayersByAgentId,
} from "./agent.repository";

export const getAgentProfile = async (
  agentId: string
) => {
  const agent = await findAgentById(agentId);

  if (!agent) {
    throw new Error("Agent not found");
  }

  return {
    id: agent._id,
    fullName: agent.fullName,
    phone: agent.phone,
    email: agent.email,
    role: agent.role,
    status: agent.status,
    referralCode: agent.referralCode,
    createdAt: agent.createdAt,
  };
};

export const getAgentPlayers = async (
  agentId: string
) => {
  return findPlayersByAgentId(agentId);
};

export const getAgentStats = async (
  agentId: string
) => {
  const [
    totalPlayers,
    activePlayers,
  ] = await Promise.all([
    countPlayersByAgentId(agentId),
    countActivePlayersByAgentId(agentId),
  ]);

  return {
    totalPlayers,
    activePlayers,
  };
};