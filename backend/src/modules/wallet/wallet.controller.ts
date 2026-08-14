import { Request, Response } from "express";
import { getUserWallet } from "./wallet.service";

export const getMyWallet = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const wallet = await getUserWallet(userId);

    return res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    console.error("Get wallet error:", error);

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Wallet not found",
    });
  }
};