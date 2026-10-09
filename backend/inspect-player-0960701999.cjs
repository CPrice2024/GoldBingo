require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.DATABASE_URL;

    await mongoose.connect(uri);

    const db = mongoose.connection.db;

    const users = db.collection("users");
    const deposits = db.collection("deposits");
    const wallets = db.collection("wallets");
    const transactions = db.collection("transactions");
    const paymentSms = db.collection("paymentsms");

    /*
     * Phone:
     * 0960701999
     *
     * Supports:
     * 0960701999
     * +251960701999
     * 251960701999
     * 960701999
     */
    const player = await users.findOne({
      phone: {
        $regex: "960701999$"
      }
    });

    console.log(
      "\n========================================"
    );
    console.log("PLAYER");
    console.log(
      "========================================"
    );

    if (!player) {
      console.log("PLAYER NOT FOUND");

      await mongoose.disconnect();
      return;
    }

    console.log({
      _id: player._id,
      fullName: player.fullName,
      phone: player.phone,
      role: player.role,
      status: player.status,
      referredBy: player.referredBy,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt
    });

    /*
     * TODAY:
     * October 7, 2026
     * Ethiopia timezone UTC+3
     */
    const start =
      new Date(
        "2026-10-06T21:00:00.000Z"
      );

    const end =
      new Date(
        "2026-10-07T21:00:00.000Z"
      );

    /*
     * WALLET
     */
    const wallet =
      await wallets.findOne({
        userId: player._id
      });

    console.log(
      "\n========================================"
    );
    console.log("WALLET");
    console.log(
      "========================================"
    );

    console.log(
      wallet || "WALLET NOT FOUND"
    );

    /*
     * TODAY'S DEPOSITS
     */
    const depositRows =
      await deposits
        .find({
          playerId: player._id,
          createdAt: {
            $gte: start,
            $lt: end
          }
        })
        .sort({
          createdAt: -1
        })
        .toArray();

    console.log(
      "\n========================================"
    );
    console.log("TODAY DEPOSITS");
    console.log(
      "========================================"
    );

    console.log(
      "COUNT =",
      depositRows.length
    );

    for (
      const deposit
      of depositRows
    ) {

      const processedEthiopia =
        deposit.processedAt
          ? new Intl.DateTimeFormat(
              "en-GB",
              {
                timeZone:
                  "Africa/Addis_Ababa",
                dateStyle:
                  "medium",
                timeStyle:
                  "medium"
              }
            ).format(
              new Date(
                deposit.processedAt
              )
            )
          : null;

      console.log(
        "\n----------------------------------------"
      );

      console.log({
        depositId:
          deposit._id,

        playerId:
          deposit.playerId,

        agentId:
          deposit.agentId,

        paymentMethod:
          deposit.paymentMethod,

        requestedAmount:
          deposit.amount,

        approvedAmount:
          deposit.approvedAmount,

        smsAmount:
          deposit.smsAmount,

        status:
          deposit.status,

        autoApproved:
          deposit.autoApproved,

        reference:
          deposit.reference,

        matchedTransactionId:
          deposit.matchedTransactionId,

        smsReceivedAt:
          deposit.smsReceivedAt,

        processedBy:
          deposit.processedBy,

        processedAt:
          deposit.processedAt,

        processedEthiopia,

        note:
          deposit.note,

        createdAt:
          deposit.createdAt,

        updatedAt:
          deposit.updatedAt
      });

      /*
       * MATCHED SMS
       */
      const reference =
        deposit.matchedTransactionId ||
        deposit.reference;

      if (reference) {

        const sms =
          await paymentSms.findOne({
            reference:
              String(reference)
                .trim()
                .toUpperCase()
          });

        console.log(
          "\nMATCHED PAYMENT SMS:"
        );

        if (sms) {

          console.log({
            _id: sms._id,
            agentId: sms.agentId,
            from: sms.from,
            paymentMethod:
              sms.paymentMethod,
            reference:
              sms.reference,
            amount:
              sms.amount,
            status:
              sms.status,
            error:
              sms.error,
            depositId:
              sms.depositId,
            sentStamp:
              sms.sentStamp,
            receivedStamp:
              sms.receivedStamp,
            createdAt:
              sms.createdAt,
            text:
              sms.text
          });

        } else {

          console.log(
            "NO MATCHING SMS RECORD"
          );
        }
      }

      /*
       * RELATED TRANSACTION
       */
      const transaction =
        await transactions.findOne({
          requestId:
            deposit._id
        });

      console.log(
        "\nWALLET TRANSACTION:"
      );

      console.log(
        transaction ||
        "NO TRANSACTION FOUND"
      );
    }

    /*
     * TODAY AUTO APPROVED ONLY
     */
    const autoRows =
      depositRows.filter(
        (deposit) =>
          deposit.autoApproved === true &&
          deposit.status === "approved"
      );

    const totalAutoApproved =
      autoRows.reduce(
        (sum, deposit) =>
          sum +
          Number(
            deposit.approvedAmount ??
            deposit.smsAmount ??
            deposit.amount ??
            0
          ),
        0
      );

    console.log(
      "\n========================================"
    );
    console.log(
      "AUTO APPROVAL SUMMARY"
    );
    console.log(
      "========================================"
    );

    console.log({
      phone:
        player.phone,

      autoApprovedCount:
        autoRows.length,

      totalAutoApprovedAmount:
        totalAutoApproved
    });

    await mongoose.disconnect();

  } catch (error) {

    console.error(
      "\nERROR:",
      error
    );

    try {
      await mongoose.disconnect();
    } catch {}

    process.exitCode = 1;
  }
})();
