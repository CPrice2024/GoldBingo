export type GameStatus =
  | "waiting"
  | "active"
  | "completed"
  | "cancelled";

export interface IGame {
  name: string;

  entryFee: number;

  maxPlayers: number;

  currentPlayers: number;

  prizePool: number;

  status: GameStatus;

  calledNumbers: number[];

  startedAt?: Date;

  completedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}