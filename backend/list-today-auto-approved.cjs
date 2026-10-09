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
    const deposits = db.collection("deposits");

    /*
     * Today in Ethiopia:
     * 2026-10-07 00:00 EAT
     * =
     * 2026-10-06 21:00 UTC
     *
     * 2026-10-08 00:00 EAT
     * =
     * 2026-10-07 21:00 UTC
     */
    const start =
      new Date("2026-10-06T21:00:00.000Z");

    const end =
      new Date("2026-10-07T21:00:00.000Z");

    const rows =
      await deposits.aggregate([
        {
          $match: {
            status: "approved",
            autoApproved: true,
            processedAt: {
              $gte: start,
              $lt: end
            }
          }
        },

        {
          $lookup: {
            from: "users",
            localField: "playerId",
            foreignField: "_id",
            as: "player"
          }
        },

        {
          $unwind: {
            path: "$player",
            preserveNullAndEmptyArrays: true
          }
        },

        {
          $sort: {
            processedAt: -1
          }
        }
      ]).toArray();

    console.log(
      "\n===== TODAY AUTO APPROVED DEPOSITS ====="
    );

    console.log(
      "TOTAL DEPOSITS =",
      rows.length
    );

    let totalAmount = 0;

    const playerMap = new Map();

    for (const deposit of rows) {

      const amount =
        Number(
          deposit.approvedAmount ??
          deposit.smsAmount ??
          deposit.amount ??
          0
        );

      totalAmount += amount;

      const playerId =
        String(deposit.playerId);

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
        "\n------------------------------"
      );

      console.log({
        playerId:
          playerId,

        fullName:
          deposit.player?.fullName ||
          "Unknown",

        phone:
          deposit.player?.phone ||
          "Unknown",

        paymentMethod:
          deposit.paymentMethod,

        amount:
          amount,

        reference:
          deposit.matchedTransactionId ||
          deposit.reference,

        processedAtEthiopia:
          localTime,

        autoApproved:
          deposit.autoApproved
      });

      if (!playerMap.has(playerId)) {

        playerMap.set(
          playerId,
          {
            fullName:
              deposit.player?.fullName ||
              "Unknown",

            phone:
              deposit.player?.phone ||
              "Unknown",

            count: 0,

            total: 0
          }
        );
      }

      const item =
        playerMap.get(playerId);

      item.count += 1;
      item.total += amount;
    }

    console.log(
      "\n\n===== PLAYERS SUMMARY ====="
    );

    console.log(
      "UNIQUE PLAYERS =",
      playerMap.size
    );

    for (
      const [playerId, info]
      of playerMap.entries()
    ) {

      console.log(
        "\n------------------------------"
      );

      console.log({
        playerId,
        fullName:
          info.fullName,
        phone:
          info.phone,
        autoApprovals:
          info.count,
        totalApproved:
          info.total
      });
    }

    console.log(
      "\n===== TODAY TOTAL ====="
    );

    console.log({
      totalAutoApprovedDeposits:
        rows.length,

      uniquePlayers:
        playerMap.size,

      totalApprovedAmount:
        totalAmount
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
