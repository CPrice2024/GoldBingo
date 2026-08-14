export interface CreateAgentInput {
  fullName: string;
  phone: string;
  password: string;
  email?: string;
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