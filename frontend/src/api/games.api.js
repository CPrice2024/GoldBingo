import api from "./axios";

/* =========================
   GAME FUNCTIONS
========================= */

export const getGames = async (
  status
) => {
  const response =
    await api.get(
      "/games",
      {
        params: status
          ? { status }
          : {},
      }
    );

  return response.data;
};


export const getCurrentGame =
  async () => {
    const response =
      await api.get(
        "/games/current"
      );

    return response.data;
  };


export const getGameById =
  async (
    gameId
  ) => {
    const response =
      await api.get(
        `/games/${gameId}`
      );

    return response.data;
  };


export const getGameState =
  async (
    gameId
  ) => {
    const response =
      await api.get(
        `/games/${gameId}/state`
      );

    return response.data;
  };


export const getGameWinners =
  async (
    gameId
  ) => {
    const response =
      await api.get(
        `/games/${gameId}/winners`
      );

    return response.data;
  };


/* =========================
   PLAYER BINGO
========================= */

export const claimBingo =
  async (
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
        `/games/${gameId}/claim-bingo`,
        {
          cardId,
        }
      );

    return response.data;
  };


/* =========================
   ADMIN GAME FUNCTIONS
========================= */

export const createGame =
  async (
    data
  ) => {
    const response =
      await api.post(
        "/games",
        data
      );

    return response.data;
  };


export const updateGame =
  async (
    gameId,
    data
  ) => {
    const response =
      await api.patch(
        `/games/${gameId}`,
        data
      );

    return response.data;
  };


export const startGame =
  async (
    gameId
  ) => {
    const response =
      await api.post(
        `/games/${gameId}/start`
      );

    return response.data;
  };


export const callGameNumber =
  async (
    gameId,
    number
  ) => {
    const response =
      await api.post(
        `/games/${gameId}/call-number`,
        number !== undefined
          ? { number }
          : {}
      );

    return response.data;
  };


/* ================================
   AUTOMATIC GAME SETTING
================================ */

export const getAutomaticGameSetting =
  async () => {
    const response =
      await api.get(
        "/settings/automatic-game"
      );

    return response.data;
  };


export const updateAutomaticGameSetting =
  async (
    enabled
  ) => {
    const response =
      await api.patch(
        "/settings/automatic-game",
        {
          enabled,
        }
      );

    return response.data;
  };