export type DepositStatus =
  | "pending"
  | "approved"
  | "rejected";

export type PaymentMethod =
  | "telebirr"
  | "cbe"
  | "mpesa"
  | "bank";

export interface IDeposit {
  playerId: string;
  agentId: string;

  amount: number;

  paymentMethod: PaymentMethod;

  reference?: string;

  status: DepositStatus;

  note?: string;

  processedBy?: string;
  processedAt?: Date;
}