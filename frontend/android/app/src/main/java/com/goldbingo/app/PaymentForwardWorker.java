package com.goldbingo.app;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;
import androidx.work.Data;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;


public class PaymentForwardWorker
        extends Worker {

    public PaymentForwardWorker(
            @NonNull Context appContext,
            @NonNull WorkerParameters workerParams
    ) {
        super(
                appContext,
                workerParams
        );
    }


    @NonNull
    @Override
    public Result doWork() {

        SharedPreferences preferences =
                getApplicationContext()
                        .getSharedPreferences(
                                "goldbingo_payment_listener",
                                Context.MODE_PRIVATE
                        );


        /* =========================================
           GET SAVED WEBHOOK
        ========================================= */

        String webhookUrl =
                preferences.getString(
                        "webhook_url",
                        ""
                );


        if (
                webhookUrl == null ||
                        webhookUrl.trim().isEmpty()
        ) {

            return Result.failure(
                    new Data.Builder()
                            .putString(
                                    "message",
                                    "Webhook URL is not configured"
                            )
                            .build()
            );
        }


        webhookUrl =
                webhookUrl.trim();


        /*
         * Do not allow forwarding to
         * arbitrary external servers.
         */

        if (
                !webhookUrl.startsWith(
                        "https://goldbingo.org/api/v1/payment-sms/webhook/"
                )
        ) {

            return Result.failure(
                    new Data.Builder()
                            .putString(
                                    "message",
                                    "Invalid GoldBingo webhook URL"
                            )
                            .build()
            );
        }


        /* =========================================
           GET NOTIFICATION DATA
        ========================================= */

        String sender =
                getInputData()
                        .getString("from");

        String text =
                getInputData()
                        .getString("text");

        String sentStamp =
                getInputData()
                        .getString("sentStamp");

        String receivedStamp =
                getInputData()
                        .getString("receivedStamp");

        String sim =
                getInputData()
                        .getString("sim");

        String sourcePackage =
                getInputData()
                        .getString("sourcePackage");


        if (sender == null) {
            sender = "";
        }

        if (text == null) {
            text = "";
        }

        if (sentStamp == null) {
            sentStamp = "";
        }

        if (receivedStamp == null) {
            receivedStamp = "";
        }

        if (sim == null) {
            sim = "";
        }

        if (sourcePackage == null) {
            sourcePackage = "";
        }


        if (text.trim().isEmpty()) {

            return Result.failure(
                    new Data.Builder()
                            .putString(
                                    "message",
                                    "Notification text is empty"
                            )
                            .build()
            );
        }


        /* =========================================
           CREATE JSON
        ========================================= */

        JSONObject payload =
                new JSONObject();


        HttpURLConnection connection =
                null;


        try {

            payload.put(
                    "from",
                    sender
            );

            payload.put(
                    "text",
                    text
            );

            payload.put(
                    "sentStamp",
                    sentStamp
            );

            payload.put(
                    "receivedStamp",
                    receivedStamp
            );

            payload.put(
                    "sim",
                    sim
            );

            payload.put(
                    "sourcePackage",
                    sourcePackage
            );


            /* =====================================
               CONNECT TO GOLDBINGO
            ===================================== */

            URL url =
                    new URL(
                            webhookUrl
                    );


            connection =
                    (HttpURLConnection)
                            url.openConnection();


            connection.setRequestMethod(
                    "POST"
            );

            connection.setConnectTimeout(
                    15000
            );

            connection.setReadTimeout(
                    15000
            );

            connection.setDoOutput(
                    true
            );


            connection.setRequestProperty(
                    "Content-Type",
                    "application/json; charset=UTF-8"
            );


            connection.setRequestProperty(
                    "Accept",
                    "application/json"
            );


            /* =====================================
               SEND REQUEST
            ===================================== */

            byte[] body =
                    payload
                            .toString()
                            .getBytes(
                                    StandardCharsets.UTF_8
                            );


            try (
                    OutputStream outputStream =
                            connection.getOutputStream()
            ) {

                outputStream.write(
                        body
                );

                outputStream.flush();
            }


            int responseCode =
                    connection
                            .getResponseCode();


            /* =====================================
               SUCCESS
            ===================================== */

            if (
                    responseCode >= 200 &&
                            responseCode <= 299
            ) {

                preferences
                        .edit()
                        .putString(
                                "last_status",
                                "Forwarded successfully"
                        )
                        .putLong(
                                "last_forward_time",
                                System.currentTimeMillis()
                        )
                        .apply();


                return Result.success(
                        new Data.Builder()
                                .putString(
                                        "message",
                                        "HTTP " +
                                                responseCode
                                )
                                .build()
                );

            }


            /* =====================================
               SERVER TEMPORARY ERROR
            ===================================== */

            if (
                    responseCode >= 500 &&
                            responseCode <= 599
            ) {

                return Result.retry();

            }


            /* =====================================
               PERMANENT FAILURE
            ===================================== */

            preferences
                    .edit()
                    .putString(
                            "last_status",
                            "Forward failed HTTP " +
                                    responseCode
                    )
                    .apply();


            return Result.failure(
                    new Data.Builder()
                            .putString(
                                    "message",
                                    "HTTP " +
                                            responseCode
                            )
                            .build()
            );


        } catch (Exception error) {

            preferences
                    .edit()
                    .putString(
                            "last_status",
                            "Network error: " +
                                    error.getMessage()
                    )
                    .apply();


            return Result.retry();


        } finally {

            if (
                    connection != null
            ) {

                connection.disconnect();

            }

        }

    }
}