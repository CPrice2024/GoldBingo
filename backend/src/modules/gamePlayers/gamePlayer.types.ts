export type GamePlayerStatus =
  | "active"
  | "won"
  | "lost"
  | "cancelled";

export interface IGamePlayer {
  gameId: string;

  playerId: string;

  entryFee: number;

  status: GamePlayerStatus;

  joinedAt: Date;

  cardId?: string;

  prizeAmount: number;

  createdAt: Date;

  updatedAt: Date;
}