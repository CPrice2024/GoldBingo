require("dotenv").config();

const mongoose = require("mongoose");


(async () => {

  let session;

  try {

    await mongoose.connect(
      process.env.MONGO_URI ||
      process.env.MONGODB_URI
    );

    console.log("MongoDB connected");


    const db =
      mongoose.connection.db;


    const inactiveAgents =
      await db
        .collection("users")
        .find({
          role: "agent",
          status: {
            $ne: "active",
          },
        })
        .toArray();


    if (
      inactiveAgents.length === 0
    ) {

      console.log(
        "No inactive agents found."
      );

      return;

    }


    const agentIds =
      inactiveAgents.map(
        (agent) => agent._id
      );


    console.log(
      "\nInactive agents found:",
      inactiveAgents.length
    );


    console.table(
      inactiveAgents.map(
        (agent) => ({
          id: String(
            agent._id
          ),

          phone:
            agent.phone || "",

          status:
            agent.status || "",

          referralCode:
            agent.referralCode ||
            "",
        })
      )
    );


    /*
     * Start transaction.
     */

    session =
      await mongoose.startSession();


    session.startTransaction();


    /*
     * =========================================
     * 1. REMOVE AGENT REFERENCES FROM PLAYERS
     * =========================================
     *
     * Do NOT delete players.
     */

    const playersResult =
      await db
        .collection("users")
        .updateMany(
          {
            role: "player",

            referredBy: {
              $in: agentIds,
            },
          },

          {
            $unset: {
              referredBy: "",
            },
          },

          {
            session,
          }
        );


    /*
     * =========================================
     * 2. DELETE AGENT WALLETS
     * =========================================
     */

    const walletResult =
      await db
        .collection("wallets")
        .deleteMany(
          {
            userId: {
              $in: agentIds,
            },
          },
          {
            session,
          }
        );


    /*
     * =========================================
     * 3. DELETE AGENT NOTIFICATIONS
     * =========================================
     */

    const notificationResult =
      await db
        .collection(
          "notifications"
        )
        .deleteMany(
          {
            userId: {
              $in: agentIds,
            },
          },
          {
            session,
          }
        );


    /*
     * =========================================
     * 4. DELETE AGENT DEPOSIT RECORDS
     * =========================================
     */

    const depositResult =
      await db
        .collection("deposits")
        .deleteMany(
          {
            agentId: {
              $in: agentIds,
            },
          },
          {
            session,
          }
        );


    /*
     * =========================================
     * 5. DELETE AGENT WITHDRAWAL RECORDS
     * =========================================
     */

    const withdrawalResult =
      await db
        .collection(
          "withdrawals"
        )
        .deleteMany(
          {
            agentId: {
              $in: agentIds,
            },
          },
          {
            session,
          }
        );


    /*
     * =========================================
     * 6. DELETE AGENT TRANSACTIONS
     * =========================================
     */

    const transactionResult =
      await db
        .collection(
          "transactions"
        )
        .deleteMany(
          {
            $or: [
              {
                userId: {
                  $in: agentIds,
                },
              },

              {
                agentId: {
                  $in: agentIds,
                },
              },
            ],
          },
          {
            session,
          }
        );


    /*
     * =========================================
     * 7. DELETE AGENT ACCOUNTS LAST
     * =========================================
     */

    const agentResult =
      await db
        .collection("users")
        .deleteMany(
          {
            _id: {
              $in: agentIds,
            },

            role: "agent",

            status: {
              $ne: "active",
            },
          },
          {
            session,
          }
        );


    await session.commitTransaction();


    console.log(
      "\n===== CLEANUP COMPLETE ====="
    );


    console.log(
      "Agents deleted:",
      agentResult.deletedCount
    );


    console.log(
      "Player referrals removed:",
      playersResult.modifiedCount
    );


    console.log(
      "Wallets deleted:",
      walletResult.deletedCount
    );


    console.log(
      "Notifications deleted:",
      notificationResult.deletedCount
    );


    console.log(
      "Deposits deleted:",
      depositResult.deletedCount
    );


    console.log(
      "Withdrawals deleted:",
      withdrawalResult.deletedCount
    );


    console.log(
      "Transactions deleted:",
      transactionResult.deletedCount
    );


  } catch (error) {

    console.error(
      "\nCLEANUP FAILED:",
      error
    );


    if (session) {

      try {

        await session.abortTransaction();

        console.log(
          "Transaction rolled back."
        );

      } catch (
        rollbackError
      ) {

        console.error(
          "Rollback failed:",
          rollbackError
        );

      }

    }

  } finally {

    if (session) {

      await session.endSession();

    }


    await mongoose.disconnect();


    console.log(
      "MongoDB disconnected"
    );

  }

})();