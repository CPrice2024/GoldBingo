import mongoose from "mongoose";
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

  cardIds: string[];

  cardCount: number;
  winningCardId?: string;

winningPattern?: string;

bingoClaimedAt?:
  Date | null;

bingoBlocked?:
  boolean;

blockedAt?:
  Date | null;

blockedReason?:
  string | null;

blockedCardIds?:
  mongoose.Types.ObjectId[];

wonAt?: Date;

  prizeAmount: number;

  createdAt: Date;

  updatedAt: Date;
}