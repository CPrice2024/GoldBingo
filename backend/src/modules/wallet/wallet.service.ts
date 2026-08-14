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

  return {
    id: wallet._id,
    userId: wallet.userId,
    balance: wallet.balance,
    reservedBalance:
      wallet.reservedBalance,

    availableBalance:
      wallet.balance -
      wallet.reservedBalance,

    currency: wallet.currency,
    status: wallet.status,

    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
};