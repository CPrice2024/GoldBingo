import api from "./axios";

// =========================
// ADMIN - GET PROMOTIONS
// =========================

export const getAdminPromotions =
  async () => {
    const response = await api.get(
      "/promotions"
    );

    return response.data;
  };


// =========================
// PLAYER - GET ACTIVE
// =========================

export const getPlayerPromotions =
  async () => {
    const response = await api.get(
      "/promotions/player-sidebar"
    );

    return response.data;
  };


// =========================
// ADMIN - CREATE
// =========================

export const createPromotion =
  async (data) => {
    const response = await api.post(
      "/promotions",
      data
    );

    return response.data;
  };


// =========================
// ADMIN - UPDATE
// =========================

export const updatePromotion =
  async (
    promotionId,
    data
  ) => {
    const response = await api.patch(
      `/promotions/${promotionId}`,
      data
    );

    return response.data;
  };


// =========================
// ADMIN - DELETE
// =========================

export const deletePromotion =
  async (promotionId) => {
    const response = await api.delete(
      `/promotions/${promotionId}`
    );

    return response.data;
  };