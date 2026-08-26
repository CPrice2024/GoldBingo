import {
  Schema,
  model,
} from "mongoose";

const appSettingsSchema =
  new Schema(
    {
      key: {
        type: String,
        default: "global",
        unique: true,
      },

      depositBonusEnabled: {
        type: Boolean,
        default: false,
      },

      depositBonusPercent: {
        type: Number,
        default: 100,
        min: 0,
        max: 300,
      },
      automaticGameEnabled: {
       type: Boolean,
       default: true,
      },
      
    },
    {
      timestamps: true,
    }
  );

export const AppSettings =
  model(
    "AppSettings",
    appSettingsSchema
  );