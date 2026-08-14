import api from "./axios";

export const createWithdrawal = async (data) => {
  const response = await api.post(
    "/withdrawals",
    data
  );

  return response.data;
};

export const getMyWithdrawals = async () => {
  const response = await api.get(
    "/withdrawals/me"
  );

  return response.data;
};

export const getWithdrawal = async (withdrawalId) => {
  const response = await api.get(
    `/withdrawals/${withdrawalId}`
  );

  return response.data;
};

// Agent functions
export const getPendingWithdrawals = async () => {
  const response = await api.get(
    "/withdrawals/agent/pending"
  );

  return response.data;
};

export const approveWithdrawal = async (
  withdrawalId
) => {
  const response = await api.patch(
    `/withdrawals/${withdrawalId}/approve`
  );

  return response.data;
};

export const rejectWithdrawal = async (
  withdrawalId,
  rejectionReason
) => {
  const response = await api.patch(
    `/withdrawals/${withdrawalId}/reject`,
    {
      rejectionReason,
    }
  );

  return response.data;
};