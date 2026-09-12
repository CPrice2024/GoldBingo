import mongoose from "mongoose";
export type GamePlayerStatus =
  | "active"
  | "won"
  | "lost"
  | "cancelled";

  export interface IBlockedCardClaim {
  cardId:
    mongoose.Types.ObjectId;

  calledNumber:
    number | null;

  blockedAt:
    Date;

  reason:
    string;
}

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

  blockedCardClaims?:
  IBlockedCardClaim[];

wonAt?: Date;

  prizeAmount: number;

  createdAt: Date;

  updatedAt: Date;
}