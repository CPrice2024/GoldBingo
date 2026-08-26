import api from "./axios";

export const joinGame = async (
  gameId,
  cardCount = 1
) => {
  const response = await api.post(
    "/game-players/join",
    {
      gameId,
      cardCount,
    }
  );

  return response.data;
};

export const getMyGamePlayer = async (
  gameId
) => {
  const response = await api.get(
    `/game-players/game/${gameId}/me`
  );

  return response.data;
};

export const getGamePlayers = async (
  gameId
) => {
  const response = await api.get(
    `/game-players/game/${gameId}`
  );

  return response.data;
};

export const getGamePlayerCount = async (
  gameId
) => {
  const response = await api.get(
    `/game-players/game/${gameId}/count`
  );

  return response.data;
};