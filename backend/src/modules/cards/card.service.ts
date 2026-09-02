import {
  createCard,
  findCardById,
  findCardByNumber,
  findCards,
  countCards,
  updateCardStatus,
} from "./card.repository";
import {
  CardCounter,
} from "./card-counter.model";

import { CardStatus } from "./card.types";

interface CreateCardInput {
  cardNumber: string;
  numbers: number[][];
}

/**
 * Generate unique random numbers within a range.
 */
const generateUniqueNumbers = (
  min: number,
  max: number,
  count: number
): number[] => {
  const numbers: number[] = [];

  while (numbers.length < count) {
    const number =
      Math.floor(
        Math.random() * (max - min + 1)
      ) + min;

    if (!numbers.includes(number)) {
      numbers.push(number);
    }
  }

  return numbers;
};

/**
 * Generate a standard 5x5 Bingo card.
 *
 * B: 1-15
 * I: 16-30
 * N: 31-45
 * G: 46-60
 * O: 61-75
 *
 * The center cell is FREE and represented by 0.
 */
export const generateBingoNumbers = (): number[][] => {
  const bColumn = generateUniqueNumbers(
    1,
    15,
    5
  );

  const iColumn = generateUniqueNumbers(
    16,
    30,
    5
  );

  const nColumn = generateUniqueNumbers(
    31,
    45,
    5
  );

  const gColumn = generateUniqueNumbers(
    46,
    60,
    5
  );

  const oColumn = generateUniqueNumbers(
    61,
    75,
    5
  );

  // Convert columns into rows.
  const numbers: number[][] = [];

  for (let row = 0; row < 5; row++) {
    numbers.push([
      bColumn[row],
      iColumn[row],
      nColumn[row],
      gColumn[row],
      oColumn[row],
    ]);
  }

  // FREE center
  numbers[2][2] = 0;

  return numbers;
};

/**
 * Validate a Bingo card.
 */
const validateBingoNumbers = (
  numbers: number[][]
): boolean => {
  if (
    !Array.isArray(numbers) ||
    numbers.length !== 5
  ) {
    return false;
  }

  if (
    !numbers.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 5
    )
  ) {
    return false;
  }

  const ranges = [
    [1, 15],
    [16, 30],
    [31, 45],
    [46, 60],
    [61, 75],
  ];

  for (let column = 0; column < 5; column++) {
    const values = numbers
      .map((row) => row[column])
      .filter(
        (_, rowIndex) =>
          !(column === 2 && rowIndex === 2)
      );

    const [min, max] = ranges[column];

    const validRange = values.every(
      (value) =>
        value >= min &&
        value <= max
    );

    if (!validRange) {
      return false;
    }

    if (
      new Set(values).size !==
      values.length
    ) {
      return false;
    }
  }

  return numbers[2][2] === 0;
};

/**
 * Create a new Bingo card.
 */
export const createNewCard = async (
  data: CreateCardInput
) => {
  if (!data.cardNumber?.trim()) {
    throw new Error(
      "Card number is required"
    );
  }

  if (!validateBingoNumbers(data.numbers)) {
    throw new Error(
      "Invalid Bingo card numbers"
    );
  }

  const existingCard =
    await findCardByNumber(
      data.cardNumber.trim()
    );

  if (existingCard) {
    throw new Error(
      "Card number already exists"
    );
  }

  return createCard({
    cardNumber: data.cardNumber.trim(),
    numbers: data.numbers,
  });
};

/* =========================================
   NEXT CARD NUMBER
========================================= */

const getNextCardNumber =
  async (): Promise<string> => {

    const counter =
      await CardCounter.findOneAndUpdate(
        {
          name: "bingo_card",
        },
        {
          $inc: {
            sequence: 1,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );


    if (!counter) {
      throw new Error(
        "Failed to generate card number"
      );
    }


    const cardNumber =
      9999 +
      counter.sequence;


    return String(
      cardNumber
    );

  };
/**
 * Generate and create a Bingo card automatically.
 */
export const generateNewCard =
  async () => {

    /*
     * Get sequential visible
     * card ID.
     *
     * First:
     * 10000
     *
     * Next:
     * 10001
     * 10002
     * ...
     */

    const cardNumber =
      await getNextCardNumber();


    /*
     * Keep existing random
     * Bingo number generation.
     */

    const numbers =
      generateBingoNumbers();


    return createNewCard({
      cardNumber,
      numbers,
    });

  };

export const getCard = async (
  cardId: string
) => {
  const card =
    await findCardById(cardId);

  if (!card) {
    throw new Error(
      "Card not found"
    );
  }

  return card;
};

export const getCardByNumber = async (
  cardNumber: string
) => {
  const card =
    await findCardByNumber(
      cardNumber
    );

  if (!card) {
    throw new Error(
      "Card not found"
    );
  }

  return card;
};

export const getCards = async (
  status?: CardStatus
) => {
  return findCards(status);
};

export const getCardCount = async (
  status?: CardStatus
) => {
  return countCards(status);
};

export const changeCardStatus = async (
  cardId: string,
  status: CardStatus
) => {
  const card =
    await findCardById(cardId);

  if (!card) {
    throw new Error(
      "Card not found"
    );
  }

  return updateCardStatus(
    cardId,
    status
  );
};