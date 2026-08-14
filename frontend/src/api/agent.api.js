import api from "./axios";

export const getAgentProfile = async () => {
  const response = await api.get("/agents/me");

  return response.data;
};

export const getAgentPlayers = async () => {
  const response = await api.get("/agents/players");

  return response.data;
};

export const getAgentStats = async () => {
  const response = await api.get("/agents/stats");

  return response.data;
};