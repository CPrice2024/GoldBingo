import {
  findUserTransactions,
  findAllTransactions,
} from "./transaction.repository";


// =========================
// PLAYER
// =========================

export const getUserTransactions = async (
  userId: string
) => {
  return findUserTransactions(userId);
};


// =========================
// ADMIN
// =========================

export const getAllTransactions = async () => {
  return findAllTransactions();
};