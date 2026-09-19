require("dotenv").config();

const { MongoClient } = require("mongodb");

(async () => {
  let client;

  try {
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI;

    if (!uri) {
      throw new Error(
        "MONGODB_URI or MONGO_URI not found in .env"
      );
    }

    client = new MongoClient(uri);

    await client.connect();

    const db = client.db();

    const game = await db
      .collection("games")
      .findOne({
        status: "active",
      });

    if (!game) {
      console.log("No active game found.");
      return;
    }

    console.log(
      "Active game found:",
      game.name || game.gameNumber || String(game._id)
    );

    const result = await db
      .collection("games")
      .updateOne(
        {
          _id: game._id,
          status: "active",
        },
        {
          $set: {
            status: "completed",
            endedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

    console.log(
      "Modified:",
      result.modifiedCount
    );

    if (result.modifiedCount === 1) {
      console.log(
        "GAME CHANGED FROM ACTIVE TO COMPLETED"
      );
    }

  } catch (error) {
    console.error(
      "ERROR:",
      error
    );

    process.exitCode = 1;

  } finally {
    if (client) {
      await client.close();
    }
  }
})();
