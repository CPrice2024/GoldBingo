import api from "./axios";

// =========================
// ADMIN DASHBOARD
// =========================

export const getAdminDashboardStats = async () => {
  const response = await api.get(
    "/admin/dashboard"
  );

  return response.data;
};


// =========================
// ADMIN AGENTS
// =========================

export const getAdminAgents = async () => {
  const response = await api.get(
    "/admin/agents"
  );

  return response.data;
};


export const createAgent = async (data) => {
  const response = await api.post(
    "/admin/agents",
    data
  );

  return response.data;
};

// =========================
// ADMIN PLAYERS
// =========================

export const getAdminPlayers = async () => {
  const response = await api.get(
    "/admin/players"
  );

  return response.data;
};

export const getAdminTransactions = async () => {
  const response = await api.get("/transactions/admin");
  return response.data;
};

export const getAdminProfile = async () => {
  const response = await api.get(
    "/admin/profile"
  );

  return response.data;
};


export const updateAdminProfile = async (
  data
) => {
  const response = await api.patch(
    "/admin/profile",
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