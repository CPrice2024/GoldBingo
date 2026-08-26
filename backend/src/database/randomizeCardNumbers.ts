import "dotenv/config";
import mongoose from "mongoose";

import { Card } from "../modules/cards/card.model";


const generateRandomCardNumber =
  () => {

    const number =
      Math.floor(
        100000 +
          Math.random() * 900000
      );

    return `GB-${number}`;
  };


const run =
  async () => {

    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI;


    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI or MONGO_URI is missing from .env"
      );
    }


    await mongoose.connect(
      mongoUri
    );


    console.log(
      "MongoDB connected"
    );


    /*
     * Rename only old CARD-* cards.
     *
     * Numbers, status and MongoDB _id
     * stay unchanged.
     */

    const cards =
      await Card.find({
        cardNumber: {
          $regex: /^CARD-/i,
        },
      }).select(
        "_id cardNumber"
      );


    console.log(
      `Found ${cards.length} old cards`
    );


    const generated =
      new Set<string>();


    let updated = 0;


    for (const card of cards) {

      let newCardNumber =
        generateRandomCardNumber();


      while (
        generated.has(
          newCardNumber
        ) ||
        await Card.exists({
          cardNumber:
            newCardNumber,
        })
      ) {

        newCardNumber =
          generateRandomCardNumber();

      }


      generated.add(
        newCardNumber
      );


      const oldCardNumber =
        card.cardNumber;


      card.cardNumber =
        newCardNumber;


      await card.save();


      updated++;


      console.log(
        `${oldCardNumber} -> ${newCardNumber}`
      );

    }


    console.log(
      `✅ ${updated} cards renamed`
    );


    await mongoose.disconnect();

  };


run()
  .then(() => {
    process.exit(0);
  })
  .catch(
    async (error) => {

      console.error(
        "❌ Card rename failed:",
        error
      );

      await mongoose
        .disconnect()
        .catch(() => {});

      process.exit(1);

    }
  );