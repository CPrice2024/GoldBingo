export type CardStatus =
  | "available"
  | "assigned"
  | "used";

export interface ICard {
  cardNumber: string;

  numbers: number[][];

  status: CardStatus;

  createdAt: Date;

  updatedAt: Date;
}