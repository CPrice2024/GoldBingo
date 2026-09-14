import "dotenv/config";

import mongoose from "mongoose";

import { Card } from "../modules/cards/card.model";

import {
  CardCounter,
} from "../modules/cards/card-counter.model";

import {
  generateBingoNumbers,
} from "../modules/cards/card.service";


/* =========================================
   CONFIGURATION
========================================= */

const TARGET_CARD_COUNT = 10000;

const BATCH_SIZE = 500;

/*
 * Generated visible card numbers:
 *
 * 10000
 * 10001
 * 10002
 * ...
 */
const CARD_NUMBER_BASE = 9999;


/* =========================================
   MAIN
========================================= */

const run = async () => {

  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;


  if (!mongoUri) {

    throw new Error(
      "MONGO_URI or MONGODB_URI is missing from .env"
    );

  }


  /* =========================================
     CONNECT
  ========================================= */

  await mongoose.connect(
    mongoUri
  );


  console.log(
    "MongoDB connected"
  );


  /* =========================================
     CURRENT CARD POOL
  ========================================= */

  let totalCards =
    await Card.countDocuments();


  const availableCards =
    await Card.countDocuments({
      status: "available",
    });


  const assignedCards =
    await Card.countDocuments({
      status: "assigned",
    });


  console.log(
    `Current total cards: ${totalCards}`
  );

  console.log(
    `Available cards: ${availableCards}`
  );

  console.log(
    `Assigned cards: ${assignedCards}`
  );


  /* =========================================
     FIND CURRENT HIGHEST NUMERIC CARD
  ========================================= */

  const existingCards =
    await Card.find({})
      .select("cardNumber")
      .lean();


  let highestExistingSequence = 0;


  for (
    const card of existingCards
  ) {

    const cardNumber =
      String(
        card.cardNumber || ""
      ).trim();


    /*
     * Ignore old formats such as:
     *
     * GB-123456
     * CARD-0001
     *
     * Only numeric generated cards
     * participate in the counter.
     */

    if (
      !/^\d+$/.test(
        cardNumber
      )
    ) {
      continue;
    }


    const numeric =
      Number(cardNumber);


    if (
      !Number.isInteger(
        numeric
      ) ||
      numeric <=
        CARD_NUMBER_BASE
    ) {
      continue;
    }


    const sequence =
      numeric -
      CARD_NUMBER_BASE;


    if (
      sequence >
      highestExistingSequence
    ) {

      highestExistingSequence =
        sequence;

    }

  }


  /* =========================================
     READ CURRENT COUNTER
  ========================================= */

  const existingCounter =
    await CardCounter.findOne({
      name: "bingo_card",
    }).lean();


  const storedSequence =
    Number(
      existingCounter?.sequence ||
        0
    );


  /*
   * Never move the counter backwards.
   */

  let sequence =
    Math.max(
      storedSequence,
      highestExistingSequence
    );


  console.log(
    `Current card sequence: ${sequence}`
  );


  /* =========================================
     SYNCHRONIZE COUNTER
  ========================================= */

  await CardCounter.findOneAndUpdate(
    {
      name: "bingo_card",
    },
    {
      $max: {
        sequence,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );


  /* =========================================
     ALREADY LARGE ENOUGH
  ========================================= */

  if (
    totalCards >=
    TARGET_CARD_COUNT
  ) {

    console.log(
      `Card pool already contains ${totalCards} cards.`
    );

    console.log(
      "No new cards are required."
    );


    await mongoose.disconnect();

    return;

  }


  /* =========================================
     GENERATE MISSING CARDS
  ========================================= */

  console.log(
    `Target card pool: ${TARGET_CARD_COUNT}`
  );

  console.log(
    `Cards required: ${
      TARGET_CARD_COUNT -
      totalCards
    }`
  );


  while (
    totalCards <
    TARGET_CARD_COUNT
  ) {

    const remaining =
      TARGET_CARD_COUNT -
      totalCards;


    const currentBatchSize =
      Math.min(
        BATCH_SIZE,
        remaining
      );


    const operations: any[] =
      [];


    for (
      let index = 0;
      index <
      currentBatchSize;
      index++
    ) {

      sequence++;


      const cardNumber =
        String(
          CARD_NUMBER_BASE +
          sequence
        );


      operations.push({
        updateOne: {

          filter: {
            cardNumber,
          },

          update: {
            $setOnInsert: {

              cardNumber,

              numbers:
                generateBingoNumbers(),

              status:
                "available",

            },
          },

          upsert: true,

        },
      });

    }


    /* =========================================
       INSERT BATCH
    ========================================= */

    const result =
      await Card.bulkWrite(
        operations,
        {
          ordered: false,
        }
      );


    /* =========================================
       SAVE COUNTER
    ========================================= */

    await CardCounter.findOneAndUpdate(
      {
        name: "bingo_card",
      },
      {
        $max: {
          sequence,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert:
          true,
      }
    );


    /*
     * Recount instead of assuming
     * every operation inserted.
     *
     * This makes the script safer
     * if a card already existed.
     */

    totalCards =
      await Card.countDocuments();


    console.log(
      [
        `Batch complete`,
        `upserted=${result.upsertedCount}`,
        `total=${totalCards}/${TARGET_CARD_COUNT}`,
      ].join(" | ")
    );

  }


  /* =========================================
     FINAL VERIFICATION
  ========================================= */

  const finalTotal =
    await Card.countDocuments();


  const finalAvailable =
    await Card.countDocuments({
      status: "available",
    });


  const finalAssigned =
    await Card.countDocuments({
      status: "assigned",
    });


  const finalCounter =
    await CardCounter.findOne({
      name: "bingo_card",
    }).lean();


  console.log(
    "\n===== CARD POOL COMPLETE ====="
  );

  console.log(
    `Total: ${finalTotal}`
  );

  console.log(
    `Available: ${finalAvailable}`
  );

  console.log(
    `Assigned: ${finalAssigned}`
  );

  console.log(
    `Counter sequence: ${
      finalCounter?.sequence
    }`
  );


  await mongoose.disconnect();


  console.log(
    "MongoDB disconnected"
  );

};


/* =========================================
   EXECUTE
========================================= */

run()
  .then(() => {

    console.log(
      "Card pool setup completed successfully."
    );

    process.exit(0);

  })
  .catch(
    async (error) => {

      console.error(
        "Card pool setup failed:",
        error
      );


      try {

        await mongoose.disconnect();

      } catch {
        // Ignore disconnect failure.
      }


      process.exit(1);

    }
  );