import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../auth/auth.middleware";

import {
  createAgentController,
  updateAgentController,
  getAdminDashboardController,
  getAllAgentsController,
  getAllPlayersController,
  getAdminProfileController,
  updateAdminProfileController,
} from "./admin.controller";

const router = Router();

router.get(
  "/dashboard",
  authenticate,
  authorize("admin"),
  getAdminDashboardController
);

router.post(
  "/agents",
  authenticate,
  authorize("admin"),
  createAgentController
);
router.get(
  "/agents",
  authenticate,
  authorize("admin"),
  getAllAgentsController
);
router.patch(
  "/agents/:agentId",
  authenticate,
  authorize("admin"),
  updateAgentController
);
router.get(
  "/players",
  authenticate,
  authorize("admin"),
  getAllPlayersController
);
router.get(
  "/profile",
  authenticate,
  authorize("admin"),
  getAdminProfileController
);


router.patch(
  "/profile",
  authenticate,
  authorize("admin"),
  updateAdminProfileController
);

export default router;