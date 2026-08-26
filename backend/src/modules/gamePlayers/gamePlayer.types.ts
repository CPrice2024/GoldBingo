export type GamePlayerStatus =
  | "active"
  | "won"
  | "lost"
  | "cancelled";

export interface IGamePlayer {
  gameId: string;

  playerId: string;

  // Total amount paid for all cards.
  entryFee: number;

  status: GamePlayerStatus;

  joinedAt: Date;

  // Legacy single-card field.
  // Keep temporarily for old database records.
  cardId?: string;

  // New multi-card fields.
  cardIds: string[];

  cardCount: number;
  winningCardId?: string;

winningPattern?: string;

wonAt?: Date;

  prizeAmount: number;

  createdAt: Date;

  updatedAt: Date;
}