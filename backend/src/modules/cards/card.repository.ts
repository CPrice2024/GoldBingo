import mongoose from "mongoose";
import { Card } from "./card.model";
import { CardStatus } from "./card.types";

interface CreateCardData {
  cardNumber: string;
  numbers: number[][];
}

export const createCard = async (
  data: CreateCardData
) => {
  return Card.create({
    cardNumber: data.cardNumber,
    numbers: data.numbers,
    status: "available",
  });
};

export const findCardById = async (
  cardId: string
) => {
  return Card.findById(cardId);
};

export const findCardByNumber = async (
  cardNumber: string
) => {
  return Card.findOne({
    cardNumber,
  });
};

export const findCards = async (
  status?: CardStatus
) => {
  const filter = status
    ? { status }
    : {};

  return Card.find(filter).sort({
    createdAt: -1,
  });
};

export const countCards = async (
  status?: CardStatus
) => {
  const filter = status
    ? { status }
    : {};

  return Card.countDocuments(filter);
};

export const updateCardStatus = async (
  cardId: string,
  status: CardStatus
) => {
  return Card.findByIdAndUpdate(
    cardId,
    { status },
    { new: true }
  );
};

/**
 * Atomically find an available card
 * and mark it as assigned.
 */
export const findAndAssignAvailableCard =
  async (
    session: mongoose.ClientSession
  ) => {
    return Card.findOneAndUpdate(
      {
        status: "available",
      },
      {
        $set: {
          status: "assigned",
        },
      },
      {
        new: true,
        sort: {
          createdAt: 1,
        },
        session,
      }
    );
  };

/**
 * Release a card back to the available pool.
 */
export const releaseCard = async (
  cardId: string,
  session?: mongoose.ClientSession
) => {
  return Card.findByIdAndUpdate(
    cardId,
    {
      $set: {
        status: "available",
      },
    },
    {
      new: true,
      session,
    }
  );
};

export const findAndAssignAvailableCards =
  async (
    count: number,
    session: mongoose.ClientSession
  ) => {
    const cards = [];

    for (
      let index = 0;
      index < count;
      index++
    ) {
      const card =
        await Card.findOneAndUpdate(
          {
            status: "available",
          },
          {
            $set: {
              status: "assigned",
            },
          },
          {
            new: true,
            session,
          }
        );

      if (!card) {
        throw new Error(
          `Not enough cards are available. ${count} cards are required.`
        );
      }

      cards.push(card);
    }

    return cards;
  };