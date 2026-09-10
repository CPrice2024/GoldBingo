import api from "./axios";


// =========================
// ADMIN - GET ALL INFO
// =========================

export const getAdminInfo =
  async () => {

    const response =
      await api.get(
        "/info/admin"
      );

    return response.data;
  };


// =========================
// PLAYER - GET PUBLISHED
// =========================

export const getPlayerInfo =
  async () => {

    const response =
      await api.get(
        "/info/player"
      );

    return response.data;
  };


// =========================
// ADMIN - CREATE
// =========================

export const createInfo =
  async (data) => {

    const response =
      await api.post(
        "/info/admin",
        data
      );

    return response.data;
  };


// =========================
// ADMIN - UPDATE
// =========================

export const updateInfo =
  async (
    infoId,
    data
  ) => {

    const response =
      await api.patch(
        `/info/admin/${infoId}`,
        data
      );

    return response.data;
  };


// =========================
// ADMIN - PUBLISH / UNPUBLISH
// =========================

export const updateInfoPublishStatus =
  async (
    infoId,
    isPublished
  ) => {

    const response =
      await api.patch(
        `/info/admin/${infoId}/publish`,
        {
          isPublished,
        }
      );

    return response.data;
  };


// =========================
// ADMIN - DELETE
// =========================

export const deleteInfo =
  async (infoId) => {

    const response =
      await api.delete(
        `/info/admin/${infoId}`
      );

    return response.data;
  };