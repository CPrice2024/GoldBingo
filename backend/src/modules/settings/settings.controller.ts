import {
  Request,
  Response,
} from "express";

import {
  getAppSettings,
  updateDepositBonusSettings,
  updateFirstDepositBonusSettings,
  getAutomaticGameSetting,
  updateAutomaticGameSetting,
} from "./settings.service";
import {
  ensureAutomaticGameAvailable,
} from "../games/game.autoCaller";

export const getDepositBonusSettings =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const settings =
        await getAppSettings();

      return res.status(200).json({
        success: true,

        data: {
          enabled:
            settings.depositBonusEnabled,

          percent:
            settings.depositBonusPercent,
        },
      });

    } catch (error) {

      console.error(
        "Get deposit bonus settings error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load deposit bonus settings",
      });

    }

  };


export const updateDepositBonus =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const {
        enabled,
        percent,
      } = req.body;


      if (
        typeof enabled !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enabled must be true or false",
        });
      }


      const numericPercent =
        Number(percent);


      const settings =
        await updateDepositBonusSettings(
          enabled,
          numericPercent
        );


      return res.status(200).json({
        success: true,

        message:
          "Deposit bonus settings updated successfully",

        data: {
          enabled:
            settings.depositBonusEnabled,

          percent:
            settings.depositBonusPercent,
        },
      });

    } catch (error) {

      console.error(
        "Update deposit bonus settings error:",
        error
      );

      return res.status(400).json({
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to update deposit bonus settings",
      });

    }

  };
export const getFirstDepositBonusSettings =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const settings =
        await getAppSettings();

      return res.status(200).json({
        success: true,

        data: {
          enabled:
            settings
              .firstDepositBonusEnabled,

          percent:
            settings
              .firstDepositBonusPercent,
        },
      });

    } catch (error) {
      console.error(
        "Get first deposit bonus settings error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load first deposit bonus settings",
      });
    }
  };


export const updateFirstDepositBonus =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        enabled,
        percent,
      } = req.body;

      if (
        typeof enabled !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Enabled must be true or false",
        });
      }

      const numericPercent =
        Number(percent);

      if (
        !Number.isFinite(
          numericPercent
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Percent must be a valid number",
        });
      }

      const settings =
        await updateFirstDepositBonusSettings(
          enabled,
          numericPercent
        );

      return res.status(200).json({
        success: true,

        message:
          "First deposit bonus settings updated successfully",

        data: {
          enabled:
            settings
              .firstDepositBonusEnabled,

          percent:
            settings
              .firstDepositBonusPercent,
        },
      });

    } catch (error) {
      console.error(
        "Update first deposit bonus settings error:",
        error
      );

      return res.status(400).json({
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to update first deposit bonus settings",
      });
    }
  };
export const getAutomaticGame =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const data =
        await getAutomaticGameSetting();

      return res.status(200).json({
        success: true,
        data,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load automatic game setting",
      });

    }

  };


  export const updateAutomaticGame =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const {
        enabled,
      } = req.body;


      if (
        typeof enabled !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Enabled must be true or false",
        });
      }


      /* =========================================
         SAVE AUTOMATIC GAME SETTING
      ========================================= */

      const data =
        await updateAutomaticGameSetting(
          enabled
        );


      /* =========================================
         IF TURNED ON, ENSURE GAME EXISTS
      ========================================= */

      if (
        data.enabled === true
      ) {

        await ensureAutomaticGameAvailable();

      }


      return res.status(200).json({
        success: true,

        message:
          "Automatic game setting updated successfully",

        data,
      });


    } catch (error) {

      console.error(
        "Update automatic game setting error:",
        error
      );


      return res.status(400).json({
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to update automatic game setting",
      });

    }

  };