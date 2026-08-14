import api from "./axios";

export const getMyProfile = async () => {
  const response = await api.get("/profile/me");

  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.patch(
    "/auth/change-password",
    data
  );

  return response.data;
};