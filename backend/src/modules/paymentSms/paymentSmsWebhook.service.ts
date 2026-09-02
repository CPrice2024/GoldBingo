import crypto
  from "crypto";

import {
  User,
} from "../users/user.model";

import {
  PaymentSmsWebhook,
} from "./paymentSmsWebhook.model";
import {
  Deposit,
} from "../deposits/deposit.model";

import {
  Withdrawal,
} from "../withdrawals/withdrawal.model";

const hashToken = (
  token: string
) => {

  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

};


/* =========================================
   GENERATE WEBHOOK FOR SINGLE AGENT
========================================= */

export const generateSingleAgentWebhook =
  async () => {

    /* =========================================
       FIND FIRST / PRIMARY AGENT
    ========================================= */

    const primaryAgent =
      await User.findOne({
        role: "agent",
      })
        .sort({
          createdAt: 1,
          _id: 1,
        });


    if (!primaryAgent) {

      throw new Error(
        "No agent found"
      );

    }


    const primaryAgentId =
      primaryAgent._id;


    /* =========================================
       MAKE FIRST AGENT ACTIVE
    ========================================= */

    if (
      primaryAgent.status !==
      "active"
    ) {

      primaryAgent.status =
        "active";

      await primaryAgent.save();

    }


    /* =========================================
       FIND OTHER AGENTS
    ========================================= */

    const otherAgents =
      await User.find({
        role: "agent",

        _id: {
          $ne:
            primaryAgentId,
        },
      }).select("_id");


    const otherAgentIds =
      otherAgents.map(
        (agent) =>
          agent._id
      );


    /*
     * We do NOT delete them.
     *
     * First transfer their relationships
     * to the primary agent.
     */

    if (
      otherAgentIds.length >
      0
    ) {

      /* =====================================
         REASSIGN PLAYERS
      ===================================== */

      await User.updateMany(
        {
          role: "player",

          referredBy: {
            $in:
              otherAgentIds,
          },
        },
        {
          $set: {
            referredBy:
              primaryAgentId,
          },
        }
      );


      /* =====================================
         REASSIGN PENDING DEPOSITS
      ===================================== */

      await Deposit.updateMany(
        {
          agentId: {
            $in:
              otherAgentIds,
          },

          status:
            "pending",
        },
        {
          $set: {
            agentId:
              primaryAgentId,
          },
        }
      );


      /* =====================================
         REASSIGN PENDING WITHDRAWALS
      ===================================== */

      await Withdrawal.updateMany(
        {
          agentId: {
            $in:
              otherAgentIds,
          },

          status:
            "pending",
        },
        {
          $set: {
            agentId:
              primaryAgentId,
          },
        }
      );


      /* =====================================
         SUSPEND EVERY OTHER AGENT
      ===================================== */

      await User.updateMany(
        {
          _id: {
            $in:
              otherAgentIds,
          },

          role:
            "agent",
        },
        {
          $set: {
            status:
              "suspended",
          },
        }
      );

    }


    /* =========================================
       GENERATE WEBHOOK TOKEN
    ========================================= */

    const token =
      crypto
        .randomBytes(32)
        .toString("hex");


    const tokenHash =
      hashToken(
        token
      );


    /* =========================================
       DISABLE OLD WEBHOOKS
    ========================================= */

    await PaymentSmsWebhook.updateMany(
      {
        agentId: {
          $ne:
            primaryAgentId,
        },
      },
      {
        $set: {
          active: false,
        },
      }
    );


    /* =========================================
       CREATE / ROTATE PRIMARY WEBHOOK
    ========================================= */

    await PaymentSmsWebhook
      .findOneAndUpdate(
        {
          agentId:
            primaryAgentId,
        },
        {
          $set: {
            tokenHash,
            active: true,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );


    return {
      token,

      agentId:
        primaryAgentId
          .toString(),

      agentName:
        primaryAgent.fullName,

      suspendedAgents:
        otherAgentIds.length,
    };

  };


/* =========================================
   RESOLVE WEBHOOK TOKEN
========================================= */

export const resolveWebhookAgent =
  async (
    token: string
  ) => {

    if (
      !token ||
      token.length < 32
    ) {

      return null;

    }


    const tokenHash =
      hashToken(token);


    const webhook =
      await PaymentSmsWebhook
        .findOne({
          tokenHash,
          active: true,
        });


    if (!webhook) {
      return null;
    }


    return webhook.agentId
      .toString();

  };