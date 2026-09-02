import {
  Router,
} from "express";

import {
  authenticate,
  authorize,
} from "../auth/auth.middleware";

import {
  generatePaymentSmsWebhook,
  receivePaymentSms,
} from "./paymentSms.controller";


const router =
  Router();


/*
 * ADMIN:
 * automatically generate URL
 * for the one active agent.
 */

router.post(
  "/setup",
  authenticate,
  authorize("admin"),
  generatePaymentSmsWebhook
);


/*
 * PHONE:
 * SMS Forwarder sends here.
 *
 * No login required because the
 * random webhook token authenticates it.
 */

router.post(
  "/webhook/:token",
  receivePaymentSms
);


export default router;