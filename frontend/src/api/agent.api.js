import api from "./axios";

export const getAgentProfile = async () => {
  const response = await api.get("/agents/me");

  return response.data;
};

export const getAgentPlayers = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
} = {}) => {

  const response =
    await api.get(
      "/agents/players",
      {
        params: {
          page,
          limit,

          ...(search
            ? {
                search,
              }
            : {}),

          ...(status &&
          status !== "all"
            ? {
                status,
              }
            : {}),
        },
      }
    );

  return response.data;
};

export const getAgentStats = async () => {
  const response = await api.get("/agents/stats");

  return response.data;
};