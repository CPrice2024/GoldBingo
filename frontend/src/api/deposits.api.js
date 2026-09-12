import api from "./axios";

export const createDeposit = async (data) => {
  const response = await api.post(
    "/deposits",
    data
  );

  return response.data;
};

export const getMyDeposits = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  paymentMethod = "",
} = {}) => {

  const response =
    await api.get(
      "/deposits/my",
      {
        params: {
          page,
          limit,

          ...(search
            ? {
                search,
              }
            : {}),

          ...(status &&
          status !== "all"
            ? {
                status,
              }
            : {}),

          ...(paymentMethod &&
          paymentMethod !== "all"
            ? {
                paymentMethod,
              }
            : {}),
        },
      }
    );

  return response.data;
};
export const getPendingDeposits = async ({
  page = 1,
  limit = 10,
  search = "",
  paymentMethod = "",
} = {}) => {

  const response =
    await api.get(
      "/deposits/pending",
      {
        params: {
          page,
          limit,

          ...(search
            ? {
                search,
              }
            : {}),

          ...(paymentMethod &&
          paymentMethod !== "all"
            ? {
                paymentMethod,
              }
            : {}),
        },
      }
    );

  return response.data;
};

export const approveDeposit = async (depositId) => {
  const response = await api.patch(
    `/deposits/${depositId}/approve`
  );

  return response.data;
};

export const getMyPaymentSettings = async () => {
  const response = await api.get(
    "/deposits/payment-settings"
  );

  return response.data;
};