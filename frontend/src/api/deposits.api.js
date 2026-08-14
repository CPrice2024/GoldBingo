import api from "./axios";

export const createDeposit = async (
  data
) => {
  const response = await api.post(
    "/deposits",
    data
  );

  return response.data;
};

export const getMyDeposits = async () => {
  const response = await api.get(
    "/deposits/my"
  );

  return response.data;
};

export const getPendingDeposits = async () => {
  const response = await api.get(
    "/deposits/pending"
  );

  return response.data;
};

export const approveDeposit = async (
  depositId
) => {
  const response = await api.patch(
    `/deposits/${depositId}/approve`
  );

  return response.data;
};