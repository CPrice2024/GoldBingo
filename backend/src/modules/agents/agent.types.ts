export interface AgentProfile {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: "agent";
  status: string;
  referralCode?: string;
  createdAt: Date;
}

export interface AgentStats {
  totalPlayers: number;
  activePlayers: number;
}

export interface AgentPlayer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: "player";
  status: string;
  createdAt: Date;
}