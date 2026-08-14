import api from "./axios";

export const getMyWallet = async () => {
  const response = await api.get("/wallet/me");

  return response.data;
};