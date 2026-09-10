import api from "./axios";

export const joinGame = async (
  gameId,
  cardId
) => {

  if (!gameId) {
    throw new Error(
      "Game ID is required"
    );
  }

  if (!cardId) {
    throw new Error(
      "Card ID is required"
    );
  }

  const response =
    await api.post(
      "/game-players/join",
      {
        gameId,
        cardId,
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