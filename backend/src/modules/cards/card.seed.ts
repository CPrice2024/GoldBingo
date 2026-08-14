import dotenv from "dotenv";

dotenv.config();

import fs from "fs";
import path from "path";
import mongoose from "mongoose";

import { Card } from "./card.model";
import { CardStatus } from "./card.types";

interface JsonCard {
  id: number;
  card: number[][];
}

const seedCards = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI!);

    console.log("✅ MongoDB Connected");

    // Read cards.json
    const filePath = path.join(
      __dirname,
      "cards.json"
    );

    const fileContent =
      fs.readFileSync(filePath, "utf-8");

    const jsonCards =
      JSON.parse(fileContent) as JsonCard[];

    console.log(
      `📦 Found ${jsonCards.length} cards in cards.json`
    );

    if (jsonCards.length !== 150) {
      throw new Error(
        `Expected 150 cards, but found ${jsonCards.length}`
      );
    }

    const operations = jsonCards.map(
      (item) => ({
        updateOne: {
          filter: {
            cardNumber:
              `CARD-${String(item.id).padStart(4, "0")}`,
          },

          update: {
            $setOnInsert: {
              cardNumber:
                `CARD-${String(item.id).padStart(4, "0")}`,

              numbers: item.card,

              status: "available" as CardStatus,
            },
          },

          upsert: true,
        },
      })
    );

    const result =
      await Card.bulkWrite(operations);

    console.log(
      `✅ Cards inserted: ${result.upsertedCount}`
    );

    console.log(
      `ℹ️ Existing cards skipped: ${result.matchedCount}`
    );

    const total =
      await Card.countDocuments();

    const available =
      await Card.countDocuments({
        status: "available",
      });

    console.log(
      `📊 Total cards in MongoDB: ${total}`
    );

    console.log(
      `🟢 Available cards: ${available}`
    );

    await mongoose.disconnect();

    console.log(
      "✅ Card seeding completed"
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Card seeding failed:",
      error
    );

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedCards();