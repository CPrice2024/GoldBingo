import {
  Request,
  Response,
} from "express";

import {
  createAgent,
  updateAgent,
  getAdminDashboardStats,
  getAllAgents,
  getAllPlayers,
  getAdminProfile,
  updateAdminProfile,
} from "./admin.service";

export const createAgentController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        fullName,
        phone,
        password,
        email,
        paymentSettings,
      } = req.body;
      console.log(
  "[ADMIN] Payment settings received:",
  JSON.stringify(paymentSettings, null, 2)
);

      if (
        typeof fullName !== "string" ||
        typeof phone !== "string" ||
        typeof password !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full name, phone and password are required",
        });
      }

      if (
        fullName.trim().length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full name must be at least 2 characters",
        });
      }

      if (
        password.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters",
        });
      }

      const agent =
        await createAgent({
          fullName,
          phone,
          password,
          email,
          paymentSettings,
        });

      return res.status(201).json({
        success: true,
        message:
          "Agent created successfully",
        data: agent,
      });

    } catch (error) {
      console.error(
        "[ADMIN] Create agent error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create agent",
      });
    }
  };
export const updateAgentController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
     const { agentId } = req.params;

if (
  typeof agentId !== "string" ||
  !agentId.trim()
) {
  return res.status(400).json({
    success: false,
    message: "Valid agent ID is required",
  });
}

      const {
        fullName,
        phone,
        email,
        password,
        paymentSettings,
      } = req.body;

      if (
        typeof fullName !== "string" ||
        typeof phone !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full name and phone are required",
        });
      }

      if (
        fullName.trim().length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full name must be at least 2 characters",
        });
      }

      if (
        password !== undefined &&
        password !== "" &&
        typeof password !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid password",
        });
      }

      const agent =
        await updateAgent(
          agentId,
          {
            fullName,
            phone,
            email,
            password,
            paymentSettings,
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Agent updated successfully",
        data: agent,
      });
    } catch (error) {
      console.error(
        "[ADMIN] Update agent error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update agent",
      });
    }
  };

export const getAdminDashboardController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const stats =
        await getAdminDashboardStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error(
        "[ADMIN] Dashboard error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve dashboard statistics",
      });
    }
  };
export const getAllAgentsController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const agents =
        await getAllAgents();

      return res.status(200).json({
        success: true,
        data: agents,
      });
    } catch (error) {
      console.error(
        "[ADMIN] Get agents error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve agents",
      });
    }
  };
export const getAllPlayersController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const players =
        await getAllPlayers();

      return res.status(200).json({
        success: true,
        data: players,
      });
    } catch (error) {
      console.error(
        "[ADMIN] Get players error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve players",
      });
    }
  };
export const getAdminProfileController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const adminId = req.user?.userId;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const profile =
        await getAdminProfile(adminId);

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error(
        "[ADMIN] Get profile error:",
        error
      );

      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve admin profile",
      });
    }
  };


export const updateAdminProfileController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const adminId = req.user?.userId;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const {
        fullName,
        phone,
        email,
      } = req.body;

      if (
        fullName !== undefined &&
        typeof fullName !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid full name",
        });
      }

      if (
        phone !== undefined &&
        typeof phone !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number",
        });
      }

      if (
        email !== undefined &&
        typeof email !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid email",
        });
      }

      const profile =
        await updateAdminProfile(
          adminId,
          {
            fullName,
            phone,
            email,
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Admin profile updated successfully",
        data: profile,
      });
    } catch (error) {
      console.error(
        "[ADMIN] Update profile error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update admin profile",
      });
    }
  };