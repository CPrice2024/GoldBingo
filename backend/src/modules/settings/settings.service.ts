import {
  AppSettings,
} from "./appSettings.model";


export const getAppSettings =
  async () => {

    const settings =
      await AppSettings.findOneAndUpdate(
        {
          key: "global",
        },

        {
          $setOnInsert: {
            key: "global",

            depositBonusEnabled:
              false,

            depositBonusPercent:
              100,
          },
        },

        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    return settings;
  };


export const updateDepositBonusSettings =
  async (
    enabled: boolean,
    percent: number
  ) => {

    if (
      typeof enabled !==
      "boolean"
    ) {
      throw new Error(
        "Deposit bonus enabled value is required"
      );
    }

    if (
      !Number.isFinite(percent)
    ) {
      throw new Error(
        "Deposit bonus percentage must be a valid number"
      );
    }

    if (
      percent < 0 ||
      percent > 100
    ) {
      throw new Error(
        "Deposit bonus percentage must be between 0 and 100"
      );
    }

    const settings =
      await AppSettings.findOneAndUpdate(
        {
          key: "global",
        },

        {
          $set: {
            depositBonusEnabled:
              enabled,

            depositBonusPercent:
              percent,
          },

          $setOnInsert: {
            key: "global",
          },
        },

        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    return settings;
  };

  export const getAutomaticGameSetting =
  async () => {

    const settings =
      await AppSettings.findOneAndUpdate(
        {
          key: "global",
        },

        {
          $setOnInsert: {
            key: "global",

            automaticGameEnabled:
              true,
          },
        },

        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    return {
      enabled:
        settings.automaticGameEnabled !==
        false,
    };
  };


export const updateAutomaticGameSetting =
  async (
    enabled: boolean
  ) => {

    if (
      typeof enabled !==
      "boolean"
    ) {
      throw new Error(
        "Automatic game enabled value must be true or false"
      );
    }

    const settings =
      await AppSettings.findOneAndUpdate(
        {
          key: "global",
        },

        {
          $set: {
            automaticGameEnabled:
              enabled,
          },

          $setOnInsert: {
            key: "global",
          },
        },

        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    return {
      enabled:
        settings.automaticGameEnabled,
    };
  };