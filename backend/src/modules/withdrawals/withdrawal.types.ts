export type WithdrawalPaymentMethod =
  | "telebirr"
  | "cbe"
  | "mpesa"
  | "bank";

export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface IWithdrawal {
  playerId: string;
  agentId: string;

  amount: number;

  paymentMethod: WithdrawalPaymentMethod;
  accountNumber: string;

  status: WithdrawalStatus;

  note?: string;

  processedBy?: string;
  processedAt?: Date;

  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}