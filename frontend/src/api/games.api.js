import api from "./axios";

export const getGames = async (status) => {
  const response = await api.get("/games", {
    params: status ? { status } : {},
  });

  return response.data;
};

export const getCurrentGame = async () => {
  const response = await api.get("/games/current");

  return response.data;
};
export const getGameWinners = async (
  gameId
) => {
  const response =
    await api.get(
      `/games/${gameId}/winners`
    );

  return response.data;
};

export const getGameById = async (gameId) => {
  const response = await api.get(`/games/${gameId}`);

  return response.data;
};

export const getGameState = async (gameId) => {
  const response = await api.get(
    `/games/${gameId}/state`
  );

  return response.data;
};

export const checkBingo = async (
  gameId,
  pattern
) => {
  const response = await api.post(
    `/games/${gameId}/check-bingo`,
    { pattern }
  );

  return response.data;
};

export const claimBingo = async (
  gameId,
  pattern
) => {
  const response = await api.post(
    `/games/${gameId}/claim-bingo`,
    { pattern }
  );

  return response.data;
};

// ================================
// ADMIN
// ================================

export const createGame = async (data) => {
  const response = await api.post(
    "/games",
    data
  );

  return response.data;
};

export const startGame = async (gameId) => {
  const response = await api.post(
    `/games/${gameId}/start`
  );

  return response.data;
};

export const callGameNumber = async (
  gameId,
  number
) => {
  const response = await api.post(
    `/games/${gameId}/call-number`,
    number !== undefined
      ? { number }
      : {}
  );

  return response.data;
};