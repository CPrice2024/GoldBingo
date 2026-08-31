import axios from "axios";


interface SendSMSParams {
  phone: string;
  message: string;
}


export async function sendSMS({
  phone,
  message,
}: SendSMSParams) {

  const username =
    process.env.SMS_USERNAME;

  const apiKey =
    process.env.SMS_API_KEY;

  const smsEnvironment =
    process.env.SMS_ENV ||
    "sandbox";


  console.log(
    "========== SMS CONFIG =========="
  );

  console.log(
    "SMS_PROVIDER:",
    process.env.SMS_PROVIDER
  );

  console.log(
    "SMS_ENV:",
    smsEnvironment
  );

  console.log(
    "SMS_USERNAME:",
    username
  );

  console.log(
    "SMS_API_KEY exists:",
    !!apiKey
  );

  console.log(
    "SMS_API_KEY length:",
    apiKey
      ? apiKey.length
      : 0
  );

  console.log(
    "================================"
  );


  if (
    !username ||
    !apiKey
  ) {
    throw new Error(
      "SMS provider credentials are not configured"
    );
  }


  /* =====================================
     AFRICA'S TALKING ENDPOINT
  ===================================== */

  const smsUrl =
    smsEnvironment ===
    "production"
      ? "https://api.africastalking.com/version1/messaging"
      : "https://api.sandbox.africastalking.com/version1/messaging";


  /* =====================================
     REQUEST BODY
  ===================================== */

  const params =
    new URLSearchParams();

  params.append(
    "username",
    username
  );

  params.append(
    "to",
    phone
  );

  params.append(
    "message",
    message
  );


  try {

    const response =
      await axios.post(
        smsUrl,
        params.toString(),
        {
          headers: {
            apiKey,
            "Content-Type":
              "application/x-www-form-urlencoded",
            Accept:
              "application/json",
          },

          timeout:
            15000,
        }
      );


    console.log(
      "Africa's Talking response:",
      JSON.stringify(
        response.data,
        null,
        2
      )
    );


    /* =====================================
       CHECK RECIPIENT RESULT
    ===================================== */

    const recipients =
      response.data
        ?.SMSMessageData
        ?.Recipients;


    const recipient =
      Array.isArray(
        recipients
      )
        ? recipients[0]
        : null;


    if (!recipient) {
      throw new Error(
        "SMS provider returned no recipient result"
      );
    }


    console.log(
      "[SMS] Recipient:",
      recipient.number
    );

    console.log(
      "[SMS] Status:",
      recipient.status
    );

    console.log(
      "[SMS] Status code:",
      recipient.statusCode
    );


    if (
      recipient.status !==
      "Success"
    ) {
      throw new Error(
        `SMS delivery failed: ${
          recipient.status ||
          "Unknown status"
        }`
      );
    }


    return response.data;

  } catch (error: any) {

    console.error(
      "Africa's Talking SMS error status:",
      error.response?.status
    );


    console.error(
      "Africa's Talking SMS response:",
      error.response?.data
    );


    console.error(
      "Africa's Talking SMS error:",
      error.message
    );


    throw new Error(
      error.response?.data
        ?.SMSMessageData
        ?.Message ||
      error.response?.data
        ?.message ||
      error.message ||
      "Failed to send SMS"
    );

  }

}