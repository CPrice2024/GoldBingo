import mongoose, {
  Schema,
} from "mongoose";

const promotionSchema =
  new Schema(
    {
      title: {
        type: String,
        trim: true,
        default: "",
      },

      image: {
        type: String,
        required: true,
      },

      link: {
        type: String,
        trim: true,
        default:
          "/player/play",
      },

      placement: {
        type: String,
        enum: [
          "player_sidebar",
        ],
        default:
          "player_sidebar",
        index: true,
      },

      active: {
        type: Boolean,
        default: true,
        index: true,
      },

      order: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
    }
  );

export const Promotion =
  mongoose.model(
    "Promotion",
    promotionSchema
  );