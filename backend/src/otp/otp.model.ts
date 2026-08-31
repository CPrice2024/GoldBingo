import mongoose, {
  Document,
  Schema,
} from "mongoose";


export type OTPRequestStatus =
  | "pending_admin"
  | "approved"
  | "verified"
  | "rejected"
  | "expired"
  | "used";


export type OTPPurpose =
  | "forgot_password";


export interface IOTPRequest
  extends Document {

  playerId:
    mongoose.Types.ObjectId;

  phone:
    string;

  purpose:
    OTPPurpose;

  codeHash?:
    string | null;

  status:
    OTPRequestStatus;

  attempts:
    number;

  resetTokenHash?:
   string | null;

  resetTokenExpiresAt?:
    Date | null;

  requestedAt:
    Date;

  approvedAt?:
    Date | null;

  approvedBy?:
    mongoose.Types.ObjectId | null;

  expiresAt?:
    Date | null;

  verifiedAt?:
    Date | null;

  rejectedAt?:
    Date | null;

  usedAt?:
    Date | null;

}


const otpRequestSchema =
  new Schema<IOTPRequest>(
    {

      playerId: {
        type:
          Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      phone: {
        type: String,
        required: true,
        index: true,
      },

      resetTokenHash: {
  type: String,
  default: null,
},

resetTokenExpiresAt: {
  type: Date,
  default: null,
},

      purpose: {
        type: String,
        enum: [
          "forgot_password",
        ],
        default:
          "forgot_password",
      },

      codeHash: {
        type: String,
        default: null,
      },

      status: {
        type: String,
        enum: [
          "pending_admin",
          "approved",
          "verified",
          "rejected",
          "expired",
          "used",
        ],
        default:
          "pending_admin",
        index: true,
      },

      attempts: {
        type: Number,
        default: 0,
      },

      requestedAt: {
        type: Date,
        default: Date.now,
      },

      approvedAt: {
        type: Date,
        default: null,
      },

      approvedBy: {
        type:
          Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      expiresAt: {
        type: Date,
        default: null,
      },

      verifiedAt: {
        type: Date,
        default: null,
      },

      rejectedAt: {
        type: Date,
        default: null,
      },

      usedAt: {
        type: Date,
        default: null,
      },

    },
    {
      timestamps: true,
    }
  );


otpRequestSchema.index({
  playerId: 1,
  status: 1,
});

otpRequestSchema.index({
  phone: 1,
  status: 1,
});

otpRequestSchema.index({
  requestedAt: -1,
});


const OTPRequest =
  mongoose.model<IOTPRequest>(
    "OTPRequest",
    otpRequestSchema
  );


export default OTPRequest;