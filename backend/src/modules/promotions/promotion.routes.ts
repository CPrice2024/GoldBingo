import {
  Router,
} from "express";

import {
  authenticate,
  authorize,
} from "../auth/auth.middleware";

import {
  createPromotionController,
  deletePromotionController,
  getAdminPromotionsController,
  getPlayerSidebarPromotionsController,
  updatePromotionController,
} from "./promotion.controller";

const router =
  Router();


/* =========================
   PLAYER
========================= */

router.get(
  "/player-sidebar",
  authenticate,
  authorize("player"),
  getPlayerSidebarPromotionsController
);


/* =========================
   ADMIN
========================= */

router.get(
  "/",
  authenticate,
  authorize("admin"),
  getAdminPromotionsController
);


router.post(
  "/",
  authenticate,
  authorize("admin"),
  createPromotionController
);


router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  updatePromotionController
);


router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  deletePromotionController
);


export default router;