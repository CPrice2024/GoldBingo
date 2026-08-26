/* =========================================================
   WINNING PATTERN CATALOG
========================================================= */

export const WINNING_PATTERNS = [
  {
    value: "full_house",
    label: "ሙሉ ቤት",
  },

  {
    value: "half_house",
    label: "ግማሽ ቤት",
  },

  {
    value: "half_house_diagonal",
    label:
      "ግማሽ ቤት በዲያጎናል የሚያልፍ",
  },

  {
    value: "3_lines",
    label: "3 መስመር",
  },

  {
    value: "4_lines",
    label: "4 መስመር",
  },

  {
    value: "5_lines",
    label: "5 መስመር",
  },

  {
    value: "6_lines",
    label: "6 መስመር",
  },

  {
    value: "7_lines",
    label: "7 መስመር",
  },

  {
    value: "8_lines",
    label: "8 መስመር",
  },

  {
    value:
      "4_free_untouched_lines",
    label:
      "4 ፍሪ የማይነኩ መስመሮች",
  },

  {
    value:
      "3_horizontal_2_vertical",
    label:
      "3 የተኛ 2 የቆመ",
  },

  {
    value:
      "3_disconnected_lines",
    label:
      "3 የማይገናኝ መስመር",
  },

  {
    value:
      "4_disconnected_lines",
    label:
      "4 የማይገናኝ መስመር",
  },

  {
    value: "2_diagonals",
    label: "2 ዲያጎናል",
  },

  {
    value: "3_rectangles",
    label: "3 ሬግታንግል",
  },

  {
    value: "4_squares",
    label: "4 ስዃር",
  },

  {
    value:
      "3_corner_dots_2_disconnected_squares",
    label:
      "3 የማዓዝን ነጠብጣብ ከ 2 ስዃር የማይገናኙ",
  },

  {
    value:
      "3_corner_dots_3_disconnected_squares",
    label:
      "3 የማዓዝን ነጠብጣብ ከ 3 ስዃር የማይገናኙ",
  },

  {
    value:
      "4_corner_dots_2_disconnected_squares",
    label:
      "4 የማዓዝን ነጠብጣብ ከ 2 ስዃር የማይገናኙ",
  },

  {
    value:
      "t_2_disconnected_squares",
    label:
      "T መስመር ከ 2 ስዄር የማይገናኙ የማይገናኙ",
  },

  {
    value:
      "t_1_diagonal_2_lines",
    label:
      "T መስመር ከ 1 ዲያጎናል እና 2 መስመር",
  },

  {
    value:
      "t_1_rectangle",
    label:
      "T መስመር ከ 1 ሬግታንግል",
  },

  {
    value:
      "t_3_lines",
    label:
      "T መስመር ከ 3 መስመር",
  },

  {
    value:
      "4_corner_squares",
    label:
      "4 የማዓዝን ስዄር",
  },

  {
    value:
      "2_horizontal_2_vertical",
    label:
      "2 የተኛ 2 የቆመ",
  },

  {
    value:
      "1_cross_2_lines",
    label:
      "1 መሰቀል ከ 2 መስመር",
  },

  {
    value:
      "3_small_t",
    label:
      "3 ትናንሽ T",
  },

  {
    value:
      "1_rectangle_2_squares",
    label:
      "1 ሬግታንግል 2 ስዃር",
  },

  {
    value:
      "1_line_2_squares",
    label:
      "1 መስመር ከ 2 ስዃር",
  },

  {
    value:
      "2_disconnected_lines_2_disconnected_squares",
    label:
      "2 የማይገናኙ መስመሮች ከ 2 ስዃር ሁሉም የማይገናኙ",
  },

  {
    value:
      "2_squares_1_rectangle",
    label:
      "2 ስዃር 1 ሬግታንግል",
  },

  {
    value:
      "3_lines_no_diagonal",
    label:
      "3 መስመር ያለ ድያጎናል",
  },

  {
    value:
      "4_lines_no_diagonal",
    label:
      "4 መስመር ያለ ድያጎናል",
  },

  {
    value:
      "5_lines_no_diagonal",
    label:
      "5 መስመር ያለ ድያጎናል",
  },

  {
    value:
      "6_lines_no_diagonal",
    label:
      "6 መስመር ያለ ድያጎናል",
  },

  {
    value:
      "1_diagonal_2_disconnected_corner_squares",
    label:
      "1 ዲያጎናል ከ 2 የማዓዝን ስኴር ጋር የማይገናኙ",
  },
] as const;


/* =========================================================
   WINNING PATTERN TYPE
========================================================= */

export type WinningPattern =
  (typeof WINNING_PATTERNS)[number]["value"];


/* =========================================================
   WINNING PATTERN HELPERS
========================================================= */

export const isValidWinningPattern = (
  pattern: unknown
): pattern is WinningPattern => {
  if (typeof pattern !== "string") {
    return false;
  }

  return WINNING_PATTERNS.some(
    (item) =>
      item.value === pattern
  );
};


export const getWinningPatternLabel = (
  pattern: string
): string => {
  const found =
    WINNING_PATTERNS.find(
      (item) =>
        item.value === pattern
    );

  return found?.label || pattern;
};


/* =========================================================
   EXISTING / LEGACY BINGO PATTERNS

   KEEP THESE WORKING FOR NOW.
   We will replace this engine after the
   admin-selected pattern is stored correctly.
========================================================= */

export type BingoPattern =
  | "row"
  | "column"
  | "diagonal"
  | "four_corners"
  | "x"
  | "blackout";


export const isPatternMatched = (
  numbers: number[][],
  calledNumbers: number[],
  pattern: BingoPattern
): boolean => {
  const called =
    new Set(calledNumbers);


  /* =======================================================
     FREE CENTER
  ======================================================= */

  const isMarked = (
    row: number,
    col: number
  ) => {
    if (
      row === 2 &&
      col === 2
    ) {
      return true;
    }

    return called.has(
      numbers[row][col]
    );
  };


  /* =======================================================
     ROW
  ======================================================= */

  if (pattern === "row") {
    return numbers.some(
      (_, row) =>
        [0, 1, 2, 3, 4].every(
          (col) =>
            isMarked(
              row,
              col
            )
        )
    );
  }


  /* =======================================================
     COLUMN
  ======================================================= */

  if (
    pattern === "column"
  ) {
    return [0, 1, 2, 3, 4].some(
      (col) =>
        [0, 1, 2, 3, 4].every(
          (row) =>
            isMarked(
              row,
              col
            )
        )
    );
  }


  /* =======================================================
     DIAGONAL
  ======================================================= */

  if (
    pattern === "diagonal"
  ) {
    const mainDiagonal =
      [0, 1, 2, 3, 4].every(
        (i) =>
          isMarked(
            i,
            i
          )
      );

    const reverseDiagonal =
      [0, 1, 2, 3, 4].every(
        (i) =>
          isMarked(
            i,
            4 - i
          )
      );

    return (
      mainDiagonal ||
      reverseDiagonal
    );
  }


  /* =======================================================
     FOUR CORNERS
  ======================================================= */

  if (
    pattern ===
    "four_corners"
  ) {
    return (
      isMarked(0, 0) &&
      isMarked(0, 4) &&
      isMarked(4, 0) &&
      isMarked(4, 4)
    );
  }


  /* =======================================================
     X
  ======================================================= */

  if (pattern === "x") {
    const mainDiagonal =
      [0, 1, 2, 3, 4].every(
        (i) =>
          isMarked(
            i,
            i
          )
      );

    const reverseDiagonal =
      [0, 1, 2, 3, 4].every(
        (i) =>
          isMarked(
            i,
            4 - i
          )
      );

    return (
      mainDiagonal &&
      reverseDiagonal
    );
  }


  /* =======================================================
     BLACKOUT
  ======================================================= */

  if (
    pattern === "blackout"
  ) {
    return [0, 1, 2, 3, 4].every(
      (row) =>
        [0, 1, 2, 3, 4].every(
          (col) =>
            isMarked(
              row,
              col
            )
        )
    );
  }


  return false;
};