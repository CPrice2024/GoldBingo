import axios from "axios";

interface SendSMSParams {
  phone: string;
  message: string;
}

export async function sendSMS({
  phone,
  message,
}: SendSMSParams) {
  const username = process.env.SMS_USERNAME;
  const apiKey = process.env.SMS_API_KEY;

  console.log("========== SMS CONFIG ==========");
  console.log("SMS_PROVIDER:", process.env.SMS_PROVIDER);
  console.log("SMS_USERNAME:", username);
  console.log("SMS_API_KEY exists:", !!apiKey);
  console.log(
    "SMS_API_KEY length:",
    apiKey ? apiKey.length : 0
  );
  console.log("================================");

  if (!username || !apiKey) {
    throw new Error(
      "SMS provider credentials are not configured"
    );
  }

  const params = new URLSearchParams();

  params.append("username", username);
  params.append("to", phone);
  params.append("message", message);

  try {
    const response = await axios.post(
      "https://api.sandbox.africastalking.com/version1/messaging",
      params.toString(),
      {
        headers: {
          apiKey: apiKey,
          "Content-Type":
            "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        timeout: 15000,
      }
    );

    console.log(
      "Africa's Talking response:",
      response.data
    );

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

  throw error;
}
}