import api from "./axios";

export const loginUser = async (
  phone,
  password
) => {
  const response = await api.post(
    "/auth/login",
    {
      phone,
      password,
    }
  );

  return response.data;
};

export const registerPlayer = async (
  data
) => {
  const response = await api.post(
    "/auth/register",
    data
  );

  return response.data;
};

export const changePassword = async (
  currentPassword,
  newPassword
) => {
  const response = await api.patch(
    "/auth/change-password",
    {
      currentPassword,
      newPassword,
    }
  );

  return response.data;
};

export const resetPasswordWithFirebase = async (
  idToken,
  newPassword
) => {
  const response = await api.post(
    "/auth/reset-password",
    {
      idToken,
      newPassword,
    }
  );

  return response.data;
};