import { Request, Response } from "express";
import bcrypt from "bcrypt";

import {
  registerPlayer,
  login,
} from "./auth.service";
import { getAuth } from "firebase-admin/auth";
import {
  validateRegisterInput,
  validateLoginInput,
} from "./auth.validation";

import { User } from "../users/user.model";

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const error = validateRegisterInput(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const user = await registerPlayer(req.body);

    return res.status(201).json({
      success: true,
      message: "Player registered successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Registration failed",
    });
  }
};

export const loginUser = async (
  req: Request,
  res: Response
) => {
  try {
    const error = validateLoginInput(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const result = await login(req.body);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Login failed",
    });
  }
};

export const changePassword = async (
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

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      typeof currentPassword !== "string" ||
      !currentPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
      });
    }

    if (
      typeof newPassword !== "string" ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password",
      });
    }

    const user = await User.findById(userId)
  .select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to change password",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      idToken,
      newPassword,
    } = req.body;

    if (
      typeof idToken !== "string" ||
      !idToken
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Firebase verification token is required",
      });
    }

    if (
      typeof newPassword !== "string" ||
      newPassword.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters",
      });
    }

    const decodedToken =
      await getAuth().verifyIdToken(
        idToken
      );

    const firebasePhone =
      decodedToken.phone_number;

    if (!firebasePhone) {
      return res.status(400).json({
        success: false,
        message:
          "Verified phone number was not found",
      });
    }

    const user = await User.findOne({
      phone: firebasePhone,
      role: "player",
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No player account is associated with this phone number",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        12
      );

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully",
    });
  } catch (error) {
    console.error(
      "[AUTH] Reset password error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Phone verification failed or expired",
    });
  }
};