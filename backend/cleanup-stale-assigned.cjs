require("dotenv").config();
const mongoose = require("mongoose");

const uri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;

async function run() {
  await mongoose.connect(uri);

  const db = mongoose.connection.db;

  const games =
    db.collection("games");

  const gamePlayers =
    db.collection("gameplayers");

  const cards =
    db.collection("cards");

  // Current games are allowed
  // to keep assigned cards.
  const currentGames =
    await games
      .find({
        status: {
          $in: [
            "waiting",
            "active",
          ],
        },
      })
      .project({
        _id: 1,
        status: 1,
      })
      .toArray();

  const currentGameIds =
    currentGames.map(
      (game) => game._id
    );

  console.log(
    "current games:",
    currentGames.length
  );

  // Find cards belonging to
  // current waiting/active games.
  const currentPlayers =
    currentGameIds.length > 0
      ? await gamePlayers
          .find({
            gameId: {
              $in:
                currentGameIds,
            },
          })
          .project({
            cardIds: 1,
            cardId: 1,
          })
          .toArray()
      : [];

  const protectedCardIds = [];

  for (
    const player of currentPlayers
  ) {
    if (
      Array.isArray(
        player.cardIds
      )
    ) {
      protectedCardIds.push(
        ...player.cardIds
      );
    }

    if (player.cardId) {
      protectedCardIds.push(
        player.cardId
      );
    }
  }

  console.log(
    "assigned cards protected:",
    protectedCardIds.length
  );

  const assignedBefore =
    await cards.countDocuments({
      status: "assigned",
    });

  console.log(
    "assigned before:",
    assignedBefore
  );

  const filter = {
    status: "assigned",
  };

  if (
    protectedCardIds.length > 0
  ) {
    filter._id = {
      $nin:
        protectedCardIds,
    };
  }

  const result =
    await cards.updateMany(
      filter,
      {
        $set: {
          status:
            "available",
        },
      }
    );

  console.log(
    "stale cards released:",
    result.modifiedCount
  );

  console.log(
    "assigned now:",
    await cards.countDocuments({
      status: "assigned",
    })
  );

  console.log(
    "available now:",
    await cards.countDocuments({
      status: "available",
    })
  );

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});
