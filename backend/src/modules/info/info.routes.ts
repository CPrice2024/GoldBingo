import {
  Router,
} from "express";

import {
  authenticate,
  authorize,
} from "../auth/auth.middleware";

import {
  createInfoController,
  deleteInfoController,
  getAdminInfoController,
  getPlayerInfoByIdController,
  getPlayerInfoController,
  publishInfoController,
  updateInfoController,
} from "./info.controller";


const router =
  Router();


/* =========================
   PLAYER
========================= */

router.get(
  "/player",
  authenticate,
  authorize("player"),
  getPlayerInfoController
);

router.get(
  "/player/:id",
  authenticate,
  authorize("player"),
  getPlayerInfoByIdController
);


/* =========================
   ADMIN
========================= */

router.get(
  "/admin",
  authenticate,
  authorize("admin"),
  getAdminInfoController
);

router.post(
  "/admin",
  authenticate,
  authorize("admin"),
  createInfoController
);

router.patch(
  "/admin/:id",
  authenticate,
  authorize("admin"),
  updateInfoController
);

router.patch(
  "/admin/:id/publish",
  authenticate,
  authorize("admin"),
  publishInfoController
);

router.delete(
  "/admin/:id",
  authenticate,
  authorize("admin"),
  deleteInfoController
);


export default router;