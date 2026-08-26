import {
  createWallet,
  findWalletByUserId,
} from "./wallet.repository";

export const createUserWallet = async (
  userId: string
) => {
  const existingWallet =
    await findWalletByUserId(userId);

  if (existingWallet) {
    return existingWallet;
  }

  return createWallet(userId);
};

export const getUserWallet = async (
  userId: string
) => {
  const wallet =
    await findWalletByUserId(userId);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const winningBalance =
  wallet.winningBalance ?? 0;

const reservedWinningBalance =
  wallet.reservedWinningBalance ?? 0;

const withdrawableWinningBalance =
  Math.max(
    0,
    winningBalance -
      reservedWinningBalance
  );

  return {
    id: wallet._id,

    userId: wallet.userId,

    // Normal wallet
    balance: wallet.balance,

    reservedBalance:
      wallet.reservedBalance,

    availableBalance:
      wallet.balance -
      wallet.reservedBalance,

    // Winning wallet
    winningBalance,

reservedWinningBalance,

    // ONLY winnings can be withdrawn
    withdrawableWinningBalance,

    currency: wallet.currency,

    status: wallet.status,

    createdAt: wallet.createdAt,

    updatedAt: wallet.updatedAt,
  };
};