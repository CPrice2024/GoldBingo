import mongoose, {
  Schema,
  Document,
} from "mongoose";


export interface IPaymentSmsDocument
  extends Document {

  fingerprint: string;

  agentId:
    mongoose.Types.ObjectId;

  from: string;

  text: string;

  sentStamp?: string;

  receivedStamp?: string;

  sim?: string;

  status:
    | "received"
    | "matched"
    | "approved"
    | "ignored"
    | "failed";

  reference?: string;

  amount?: number;

  paymentMethod?:
    | "telebirr"
    | "cbe";

  depositId?:
    mongoose.Types.ObjectId;

  error?: string;
}


const paymentSmsSchema =
  new Schema(
    {
      fingerprint: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      agentId: {
        type:
          Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      from: {
        type: String,
        required: true,
        trim: true,
      },

      text: {
        type: String,
        required: true,
      },

      sentStamp: {
        type: String,
      },

      receivedStamp: {
        type: String,
      },

      sim: {
        type: String,
      },

      status: {
        type: String,
        enum: [
          "received",
          "matched",
          "approved",
          "ignored",
          "failed",
        ],
        default: "received",
        index: true,
      },

      reference: {
        type: String,
        trim: true,
        uppercase: true,
        index: true,
      },

      amount: {
        type: Number,
      },

      paymentMethod: {
        type: String,
        enum: [
          "telebirr",
          "cbe",
        ],
      },

      depositId: {
        type:
          Schema.Types.ObjectId,
        ref: "Deposit",
      },

      error: {
        type: String,
      },
    },
    {
      timestamps: true,
    }
  );


export const PaymentSms =
  mongoose.model<IPaymentSmsDocument>(
    "PaymentSms",
    paymentSmsSchema
  );