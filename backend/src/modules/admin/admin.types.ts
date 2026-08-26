export interface AgentPaymentSettingsInput {
  telebirr: {
    enabled: boolean;
    account: string;
  };

  cbe: {
    enabled: boolean;
    account: string;
  };

  minDeposit: number;
  maxDeposit: number;
}

export interface CreateAgentInput {
  fullName: string;
  phone: string;
  password: string;
  email?: string;

  paymentSettings: AgentPaymentSettingsInput;
}

export interface AdminDashboardStats {
  totalUsers: number;

  totalPlayers: number;
  totalAgents: number;
  totalAdmins: number;

  activePlayers: number;
  activeAgents: number;

  suspendedPlayers: number;
  blockedPlayers: number;

  totalGames: number;
  activeGames: number;
  waitingGames: number;
  completedGames: number;
}