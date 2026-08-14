import api from "./axios";

// =========================
// PUBLIC GAME FUNCTIONS
// =========================

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

export const getGameById = async (gameId) => {
  const response = await api.get(
    `/games/${gameId}`
  );

  return response.data;
};

export const getGameState = async (gameId) => {
  const response = await api.get(
    `/games/${gameId}/state`
  );

  return response.data;
};


// =========================
// ADMIN GAME FUNCTIONS
// =========================

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

export const callNumber = async (
  gameId,
  number
) => {
  const response = await api.post(
    `/games/${gameId}/call-number`,
    {
      number,
    }
  );

  return response.data;
};


// =========================
// PLAYER GAME FUNCTIONS
// =========================

export const checkBingo = async (
  gameId,
  pattern
) => {
  const response = await api.post(
    `/games/${gameId}/check-bingo`,
    {
      pattern,
    }
  );

  return response.data;
};

export const claimBingo = async (
  gameId,
  pattern
) => {
  const response = await api.post(
    `/games/${gameId}/claim-bingo`,
    {
      pattern,
    }
  );

  return response.data;
};