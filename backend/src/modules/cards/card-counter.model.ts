import mongoose, {
  Schema,
} from "mongoose";


const cardCounterSchema =
  new Schema(
    {
      name: {
        type: String,
        required: true,
        unique: true,
      },

      sequence: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    {
      timestamps: true,
    }
  );


export const CardCounter =
  mongoose.model(
    "CardCounter",
    cardCounterSchema
  );