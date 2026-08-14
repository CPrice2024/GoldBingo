import { Request, Response } from "express";

import {
  getUserProfile,
} from "./profile.service";

export const getMyProfile = async (
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

    const profile =
      await getUserProfile(userId);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve profile",
    });
  }
};