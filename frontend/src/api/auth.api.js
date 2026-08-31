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


export const requestPasswordOTP =
  async (phone) => {

    const response =
      await api.post(
        "/otp/request",
        {
          phone,
        }
      );

    return response.data;
  };


export const verifyPasswordOTP =
  async (
    phone,
    code
  ) => {

    const response =
      await api.post(
        "/otp/verify",
        {
          phone,
          code,
        }
      );

    return response.data;
  };


export const resetPasswordWithOTP =
  async (
    resetToken,
    newPassword
  ) => {

    const response =
      await api.post(
        "/auth/reset-password",
        {
          resetToken,
          newPassword,
        }
      );

    return response.data;
  };

export const getPasswordOTPStatus =
  async (
    requestId,
    phone
  ) => {

    const response =
      await api.get(
        `/otp/status/${requestId}`,
        {
          params: {
            phone,
          },
        }
      );

    return response.data;
  };