import type {
  WinningPattern,
} from "./game.patterns";

export type GameStatus =
  | "waiting"
  | "active"
  | "completed"
  | "cancelled";
export type GameType =
  | 1
  | -1;
export type GameCallMode =
  | "automatic"
  | "manual";
export interface IGame {
  name: string;

  gameType: GameType;

  entryFee: number;

  maxPlayers: number;

  winningPattern:
    WinningPattern;

  joiningWindowSeconds: number;

  callIntervalSeconds: number;

  callMode: GameCallMode;

  joiningEndsAt?: Date | null;

  nextCallAt?: Date | null;

  currentPlayers: number;

  prizePool: number;

  prizeAmount:
  number | null;

scheduledStartAt:
  Date | null;

  status: GameStatus;

  calledNumbers: number[];

  startedAt?: Date | null;

 completedAt?: Date | null;

/*
 * Multi-winner window.
 *
 * The first valid Bingo opens
 * a 30-second claim period.
 */
firstWinnerAt?:
  Date | null;

winnerClaimEndsAt?:
  Date | null;

/*
 * Number of accepted unique
 * winning players.
 */
winnerCount:
  number;

/*
 * Set only after prizes have
 * actually been divided and paid.
 */
payoutSettledAt?:
  Date | null;

createdAt: Date;

  updatedAt: Date;
}