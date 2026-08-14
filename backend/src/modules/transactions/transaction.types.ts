export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "deposit_reversal"
  | "withdrawal_reversal"
  | "game_entry"
  | "game_entry_reversal"
  | "game_win";

export type TransactionStatus =
  | "completed"
  | "reversed";

export interface ITransaction {
  userId: string;

  type: TransactionType;

  amount: number;

  balanceBefore: number;

  balanceAfter: number;

  currency: "ETB";

  status: TransactionStatus;

  reference?: string;

  requestId?: string;

  processedBy?: string;

  description?: string;
}