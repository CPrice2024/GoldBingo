import mongoose, {
  Schema,
} from "mongoose";


const paymentSmsWebhookSchema =
  new Schema(
    {
      agentId: {
        type:
          Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      tokenHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      active: {
        type: Boolean,
        default: true,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );


export const PaymentSmsWebhook =
  mongoose.model(
    "PaymentSmsWebhook",
    paymentSmsWebhookSchema
  );