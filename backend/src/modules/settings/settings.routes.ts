import {
  Router,
} from "express";

import {
  authenticate,
  authorize,
} from "../auth/auth.middleware";

import {
  getDepositBonusSettings,
  updateDepositBonus,
  getAutomaticGame,
  updateAutomaticGame,
} from "./settings.controller";


const router =
  Router();


router.get(
  "/deposit-bonus",

  authenticate,
  authorize("admin"),

  getDepositBonusSettings
);


router.patch(
  "/deposit-bonus",

  authenticate,
  authorize("admin"),

  updateDepositBonus
);

router.get(
  "/automatic-game",
  authenticate,
  authorize("admin"),
  getAutomaticGame
);


router.patch(
  "/automatic-game",
  authenticate,
  authorize("admin"),
  updateAutomaticGame
);


export default router;