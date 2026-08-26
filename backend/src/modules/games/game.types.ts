import type {
  WinningPattern,
} from "./game.patterns";

export type GameStatus =
  | "waiting"
  | "active"
  | "completed"
  | "cancelled";

export interface IGame {
  name: string;

  entryFee: number;

  maxPlayers: number;

  winningPattern:
    WinningPattern;

  joiningWindowSeconds: number;

  callIntervalSeconds: number;

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

  createdAt: Date;

  updatedAt: Date;
}