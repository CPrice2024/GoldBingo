require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.DATABASE_URL;

    if (!uri) {
      throw new Error("MongoDB URI not found");
    }

    await mongoose.connect(uri);

    const db = mongoose.connection.db;

    const users =
      db.collection("users");

    const deposits =
      db.collection("deposits");

    /*
     * Phone:
     * 0927752555
     *
     * Match common stored formats:
     * 0927752555
     * +251927752555
     * 251927752555
     * 927752555
     */
    const player =
      await users.findOne({
        role: "player",
        phone: {
          $regex: "927752555$"
        }
      });

    console.log(
      "\n===== PLAYER ====="
    );

    if (!player) {
      console.log(
        "Player 0927752555 not found"
      );

      await mongoose.disconnect();
      return;
    }

    console.log({
      _id: player._id,
      fullName:
        player.fullName,
      phone:
        player.phone,
      role:
        player.role
    });

    /*
     * Ethiopia:
     * 2026-10-07 00:00 EAT
     * =
     * 2026-10-06 21:00 UTC
     *
     * Tomorrow 00:00 EAT
     * =
     * 2026-10-07 21:00 UTC
     */
    const start =
      new Date(
        "2026-10-06T21:00:00.000Z"
      );

    const end =
      new Date(
        "2026-10-07T21:00:00.000Z"
      );

    const rows =
      await deposits
        .find({
          playerId:
            player._id,

          status:
            "approved",

          autoApproved:
            true,

          processedAt: {
            $gte: start,
            $lt: end
          }
        })
        .sort({
          processedAt: -1
        })
        .toArray();

    console.log(
      "\n===== TODAY AUTO APPROVED ====="
    );

    console.log(
      "COUNT =",
      rows.length
    );

    let totalApproved = 0;

    for (const deposit of rows) {

      const amount =
        Number(
          deposit.approvedAmount ??
          deposit.smsAmount ??
          deposit.amount ??
          0
        );

      totalApproved += amount;

      const localTime =
        deposit.processedAt
          ? new Intl.DateTimeFormat(
              "en-GB",
              {
                timeZone:
                  "Africa/Addis_Ababa",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
              }
            ).format(
              new Date(
                deposit.processedAt
              )
            )
          : null;

      console.log(
        "\n--------------------"
      );

      console.log({
        depositId:
          deposit._id,

        paymentMethod:
          deposit.paymentMethod,

        requestedAmount:
          deposit.amount,

        approvedAmount:
          deposit.approvedAmount,

        smsAmount:
          deposit.smsAmount,

        reference:
          deposit.reference,

        matchedTransactionId:
          deposit.matchedTransactionId,

        smsReceivedAt:
          deposit.smsReceivedAt,

        processedAt:
          deposit.processedAt,

        ethiopiaTime:
          localTime,

        autoApproved:
          deposit.autoApproved
      });
    }

    console.log(
      "\n===== SUMMARY ====="
    );

    console.log({
      phone:
        player.phone,

      autoApprovedCount:
        rows.length,

      totalApprovedAmount:
        totalApproved
    });

    await mongoose.disconnect();

  } catch (err) {

    console.error(err);

    try {
      await mongoose.disconnect();
    } catch {}

    process.exitCode = 1;
  }
})();
