import mongoose from "mongoose";

export type GamePlayerStatus =
  | "active"
  | "won"
  | "lost"
  | "cancelled";

export interface IBlockedCardClaim {
  cardId: mongoose.Types.ObjectId;
  calledNumber: number | null;
  blockedAt: Date;
  reason: string;
}

export interface IGamePlayer {
  gameId: string;

  playerId: string;

  entryFee: number;

  status: GamePlayerStatus;

  joinedAt: Date;

  // Cards owned by player
  cardId?: string;
  cardIds: string[];
  cardCount: number;

  // OLD single winner field
  // Keep temporarily for backward compatibility
  winningCardId?: string;

  // NEW: player can win with multiple cards
  winningCardIds?: mongoose.Types.ObjectId[];

  winningPattern?: string;

  bingoClaimedAt?: Date | null;

  // OLD player-level block
  // Keep temporarily
  bingoBlocked?: boolean;

  blockedAt?: Date | null;

  blockedReason?: string | null;

  // Card-level blocked cards
  blockedCardIds?: mongoose.Types.ObjectId[];

  blockedCardClaims?: IBlockedCardClaim[];

  wonAt?: Date;

  prizeAmount: number;

  createdAt: Date;
  updatedAt: Date;
}