import {
  Request,
  Response,
} from "express";

import {
  processPaymentSms,
} from "./paymentSms.service";

import {
  generateSingleAgentWebhook,
  resolveWebhookAgent,
} from "./paymentSmsWebhook.service";


/* =========================================
   GENERATE WEBHOOK URL
========================================= */

export const generatePaymentSmsWebhook =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const result =
        await generateSingleAgentWebhook();


      /*
       * Works behind Render / proxy too.
       */

     const baseUrl =
  process.env.PUBLIC_API_URL ||
  `${req.protocol}://${req.get("host")}`;


const webhookUrl =
  `${baseUrl.replace(/\/$/, "")}` +
  `/api/v1/payment-sms/webhook/` +
  result.token;


      return res
        .status(201)
        .json({
          success: true,

          message:
            "SMS webhook generated successfully",

          data: {
            webhookUrl,

            agent: {
              id:
                result.agentId,

              name:
                result.agentName,
            },
          },
        });

    } catch (error) {

      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Failed to generate SMS webhook",
        });

    }

  };


/* =========================================
   RECEIVE PHONE SMS
========================================= */

export const receivePaymentSms =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const token =
        req.params.token;


      if (
        typeof token !==
        "string"
      ) {

        return res
          .status(401)
          .json({
            success: false,
            message:
              "Invalid webhook",
          });

      }


      /*
       * Token automatically gives
       * us the agent.
       */

      const agentId =
        await resolveWebhookAgent(
          token
        );


      if (!agentId) {

        return res
          .status(401)
          .json({
            success: false,
            message:
              "Invalid webhook",
          });

      }


      const result =
        await processPaymentSms({
          agentId,

          from:
            req.body?.from,

          text:
            req.body?.text,

          sentStamp:
            req.body?.sentStamp,

          receivedStamp:
            req.body?.receivedStamp,

          sim:
            req.body?.sim,
        });


      return res
        .status(200)
        .json({
          success: true,
          data: result,
        });

    } catch (error) {

      console.error(
        "[PAYMENT SMS]",
        error
      );


      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Failed to process payment SMS",
        });

    }

  };