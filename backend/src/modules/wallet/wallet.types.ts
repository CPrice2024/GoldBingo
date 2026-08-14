export type WalletStatus = "active" | "suspended";

export interface IWallet {
  userId: string;
  balance: number;
  reservedBalance: number;
  currency: "ETB";
  status: WalletStatus;
}