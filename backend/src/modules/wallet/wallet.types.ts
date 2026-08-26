export type WalletStatus =
  | "active"
  | "suspended";

export interface IWallet {
  userId: string;

  // Normal wallet balance
  balance: number;

  // Normal balance reserved by existing operations
  reservedBalance: number;

  // Bingo winnings available for withdrawal
  winningBalance: number;

  // Bingo winnings reserved by pending withdrawals
  reservedWinningBalance: number;

  currency: "ETB";

  status: WalletStatus;
}