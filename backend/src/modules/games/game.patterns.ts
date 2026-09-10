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
   LEGACY BINGO PATTERNS

   Keep these temporarily so old backend
   checkBingo() code continues to compile.
========================================================= */

export type BingoPattern =
  | "row"
  | "column"
  | "diagonal"
  | "four_corners"
  | "x"
  | "blackout";


/* =========================================================
   PATTERN HELPERS
========================================================= */

/*
 * Card indexes:
 *
 *  0   1   2   3   4
 *  5   6   7   8   9
 * 10  11  12  13  14
 * 15  16  17  18  19
 * 20  21  22  23  24
 *
 * Index 12 is FREE.
 */

const mergeCells = (
  ...groups: number[][]
): number[] => {
  return [
    ...new Set(
      groups.flat()
    ),
  ];
};


/* =========================================================
   ROWS
========================================================= */

const ROW_1 = [
  0, 1, 2, 3, 4,
];

const ROW_2 = [
  5, 6, 7, 8, 9,
];

const ROW_3 = [
  10, 11, 12, 13, 14,
];

const ROW_4 = [
  15, 16, 17, 18, 19,
];

const ROW_5 = [
  20, 21, 22, 23, 24,
];


/* =========================================================
   COLUMNS
========================================================= */

const COL_1 = [
  0, 5, 10, 15, 20,
];

const COL_2 = [
  1, 6, 11, 16, 21,
];

const COL_3 = [
  2, 7, 12, 17, 22,
];

const COL_4 = [
  3, 8, 13, 18, 23,
];

const COL_5 = [
  4, 9, 14, 19, 24,
];


/* =========================================================
   DIAGONALS
========================================================= */

const DIAGONAL_MAIN = [
  0, 6, 12, 18, 24,
];

const DIAGONAL_REVERSE = [
  4, 8, 12, 16, 20,
];


/* =========================================================
   SQUARES
========================================================= */

const SQUARE_TOP_LEFT = [
  0, 1,
  5, 6,
];

const SQUARE_TOP_RIGHT = [
  3, 4,
  8, 9,
];

const SQUARE_BOTTOM_LEFT = [
  15, 16,
  20, 21,
];

const SQUARE_BOTTOM_RIGHT = [
  18, 19,
  23, 24,
];


const SQUARE_INNER_LEFT = [
  6, 7,
  11, 12,
];

const SQUARE_INNER_RIGHT = [
  8, 9,
  13, 14,
];

const SQUARE_INNER_BOTTOM = [
  16, 17,
  21, 22,
];


/* =========================================================
   RECTANGLES
========================================================= */

const RECTANGLE_OUTER = [
  0, 1, 2, 3, 4,

  5, 9,

  10, 14,

  15, 19,

  20, 21, 22, 23, 24,
];


const RECTANGLE_MIDDLE = [
  5, 6, 7, 8, 9,

  10, 14,

  15, 16, 17, 18, 19,
];


const RECTANGLE_INNER = [
  6, 7, 8,

  11, 13,

  16, 17, 18,
];


/* =========================================================
   T / CROSS
========================================================= */

const BIG_T =
  mergeCells(
    ROW_1,
    COL_3
  );


const BIG_CROSS =
  mergeCells(
    ROW_3,
    COL_3
  );


/* =========================================================
   ALL CELLS
========================================================= */

const ALL_CELLS =
  Array.from(
    {
      length: 25,
    },
    (_, index) =>
      index
  );

/* =========================================================
   STANDARD BINGO LINES
========================================================= */

const STANDARD_BINGO_LINES:
  number[][] = [

    /* Horizontal */
    ROW_1,
    ROW_2,
    ROW_3,
    ROW_4,
    ROW_5,

    /* Vertical */
    COL_1,
    COL_2,
    COL_3,
    COL_4,
    COL_5,

    /* Diagonal */
    DIAGONAL_MAIN,
    DIAGONAL_REVERSE,

  ];


/* =========================================================
   LINES WITHOUT DIAGONALS
========================================================= */

const NON_DIAGONAL_LINES:
  number[][] = [

    ROW_1,
    ROW_2,
    ROW_3,
    ROW_4,
    ROW_5,

    COL_1,
    COL_2,
    COL_3,
    COL_4,
    COL_5,

  ];

  /* =========================================================
   LINES THAT DO NOT TOUCH FREE CENTER

   FREE CELL = index 12

   Excluded:
   ROW_3
   COL_3
   DIAGONAL_MAIN
   DIAGONAL_REVERSE
========================================================= */

const FREE_UNTOUCHED_LINES:
  number[][] = [

    ROW_1,
    ROW_2,
    ROW_4,
    ROW_5,

    COL_1,
    COL_2,
    COL_4,
    COL_5,

  ];



const WINNING_PATTERN_LAYOUTS:
  Record<
    WinningPattern,
    number[][]
  > = {


  /* =======================================================
     1. FULL HOUSE
  ======================================================= */

  full_house: [
    ALL_CELLS,
  ],


  /* =======================================================
     2. HALF HOUSE

     Top 3 rows OR bottom 3 rows
  ======================================================= */

  half_house: [

    mergeCells(
      ROW_1,
      ROW_2,
      ROW_3
    ),

    mergeCells(
      ROW_3,
      ROW_4,
      ROW_5
    ),

  ],


  /* =======================================================
     3. HALF HOUSE + DIAGONAL
  ======================================================= */

  half_house_diagonal: [

    mergeCells(
      ROW_1,
      ROW_2,
      ROW_3,
      DIAGONAL_MAIN
    ),

    mergeCells(
      ROW_1,
      ROW_2,
      ROW_3,
      DIAGONAL_REVERSE
    ),

    mergeCells(
      ROW_3,
      ROW_4,
      ROW_5,
      DIAGONAL_MAIN
    ),

    mergeCells(
      ROW_3,
      ROW_4,
      ROW_5,
      DIAGONAL_REVERSE
    ),

  ],


  /* =======================================================
     4. THREE LINES
  ======================================================= */

  "3_lines": [
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5
    ),
  ],


  /* =======================================================
     5. FOUR LINES
  ======================================================= */

  "4_lines": [
    mergeCells(
      ROW_1,
      ROW_5,
      COL_1,
      COL_5
    ),
  ],


  /* =======================================================
     6. FIVE LINES
  ======================================================= */

  "5_lines": [
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5,
      COL_1,
      COL_5
    ),
  ],


  /* =======================================================
     7. SIX LINES
  ======================================================= */

  "6_lines": [
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5,
      COL_1,
      COL_5,
      DIAGONAL_MAIN
    ),
  ],


  /* =======================================================
     8. SEVEN LINES
  ======================================================= */

  "7_lines": [
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5,

      COL_1,
      COL_5,

      DIAGONAL_MAIN,
      DIAGONAL_REVERSE
    ),
  ],


  /* =======================================================
     9. EIGHT LINES
  ======================================================= */

  "8_lines": [
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5,

      COL_1,
      COL_3,
      COL_5,

      DIAGONAL_MAIN,
      DIAGONAL_REVERSE
    ),
  ],


  /* =======================================================
     10. FOUR LINES WITHOUT FREE
  ======================================================= */

  "4_free_untouched_lines": [
    mergeCells(
      ROW_1,
      ROW_2,
      ROW_4,
      ROW_5
    ),
  ],


  /* =======================================================
     11. 3 HORIZONTAL + 2 VERTICAL
  ======================================================= */

  "3_horizontal_2_vertical": [
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5,

      COL_1,
      COL_5
    ),
  ],


  /* =======================================================
     12. THREE DISCONNECTED LINES
  ======================================================= */

  "3_disconnected_lines": [
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5
    ),
  ],


  /* =======================================================
     13. FOUR DISCONNECTED LINES
  ======================================================= */

  "4_disconnected_lines": [
    mergeCells(
      ROW_1,
      ROW_2,
      ROW_4,
      ROW_5
    ),
  ],


  /* =======================================================
     14. TWO DIAGONALS
  ======================================================= */

  "2_diagonals": [
    mergeCells(
      DIAGONAL_MAIN,
      DIAGONAL_REVERSE
    ),
  ],


  /* =======================================================
   15. THREE RECTANGLES

   4 correct possibilities from image
======================================================= */

"3_rectangles": [

  // Correct possibility 1
  [
    0, 1, 2,
    5, 6, 7, 8, 9,
    13, 14,
    15, 16, 17, 18, 19,
    20, 21, 22,
  ],

  // Correct possibility 2
  [
    0, 1, 2, 3,
    5, 6, 7, 8,
    10, 11,
    13,
    17, 18, 19,
    22, 23, 24,
  ],

  // Correct possibility 3
  [
    0, 1, 2, 3, 4,
    5, 6, 7, 8, 9,
    10, 11,
    17, 18, 19,
    22, 23, 24,
  ],

  // Correct possibility 4
  [
    0, 1, 2, 3, 4,
    5, 6, 7, 8, 9,
    10, 11,
    13, 14,
    15, 16, 17,
  ],

],


/* =======================================================
   16. FOUR SQUARES

   4 correct possibilities from image
======================================================= */

"4_squares": [

  // Correct possibility 1
  [
    0, 1, 2, 3,
    5, 6, 7, 8,
    13, 14,
    15, 16,
    18, 19,
    20, 21,
  ],

  // Correct possibility 2
  [
    0, 1, 2, 3,
    5, 6, 7, 8,
    10, 11,
    13,
    15, 16, 17, 18,
  ],

  // Correct possibility 3
  [
    0, 1,
    3, 4,

    5, 6,
    8, 9,

    15, 16,
    18, 19,

    20, 21,
    23, 24,
  ],

  // Correct possibility 4
  [
    0, 1,
    3, 4,

    5, 6,
    8, 9,

    10, 11,
    13,

    15, 16, 17, 18,
  ],

],


  /* =======================================================
     17. 3 CORNER DOTS + 2 SQUARES
  ======================================================= */

  "3_corner_dots_2_disconnected_squares": [
    mergeCells(
      [
        0,
        4,
        24,
      ],

      SQUARE_INNER_LEFT,

      SQUARE_BOTTOM_LEFT
    ),
  ],


 /* =======================================================
   18. 3 CORNER DOTS + 3 DISCONNECTED SQUARES

   4 correct possibilities
======================================================= */

"3_corner_dots_3_disconnected_squares": [

  // Correct possibility 1
  [
    0,
    2, 3, 4,

    7, 8,

    13, 14,

    15, 16,
    18, 19,

    20, 21,
    24,
  ],

  // Correct possibility 2
  [
    0,
    2, 3, 4,

    7, 8,

    10, 11,
    13,

    15, 16, 17, 18,

    24,
  ],

  // Correct possibility 3
  [
    0, 1, 2, 3, 4,

    5, 6, 7,

    10, 11,

    15, 16,

    20,
    24,
  ],

  // Correct possibility 4
  [
    0,
    3, 4,

    8, 9,

    10, 11,
    13,

    15, 16, 17, 18,

    20,
    24,
  ],

],

 /* =======================================================
   19. 4 CORNER DOTS + 2 DISCONNECTED SQUARES

   4 correct possibilities
======================================================= */

"4_corner_dots_2_disconnected_squares": [

  // Correct possibility 1
  [
    0, 4,

    5, 6, 7, 8, 9,

    10, 11,
    13, 14,

    18, 19,

    20, 24,
  ],

  // Correct possibility 2
  [
    0, 1, 2, 3, 4,

    6, 7, 8,

    16, 17, 18,

    20, 21, 22, 23, 24,
  ],

  // Correct possibility 3
  [
    0, 1, 2,
    4,

    6, 7,

    11,

    16, 17, 18,

    20, 21, 22, 23, 24,
  ],

  // Correct possibility 4
  [
    0, 4,

    6, 7, 8, 9,

    11,
    13, 14,

    16, 17, 18, 19,

    20,
    24,
  ],

],


  /* =======================================================
     20. T + 2 DISCONNECTED SQUARES
  ======================================================= */

  "t_2_disconnected_squares": [
    mergeCells(
      BIG_T,

      SQUARE_BOTTOM_LEFT,

      SQUARE_BOTTOM_RIGHT
    ),
  ],


  /* =======================================================
     21. T + DIAGONAL + 2 LINES
  ======================================================= */

  "t_1_diagonal_2_lines": [
    mergeCells(
      BIG_T,

      DIAGONAL_MAIN,

      ROW_5,

      COL_1
    ),
  ],


  /* =======================================================
     22. T + RECTANGLE
  ======================================================= */

  "t_1_rectangle": [
    mergeCells(
      BIG_T,

      RECTANGLE_INNER
    ),
  ],


  /* =======================================================
     23. T + 3 LINES
  ======================================================= */

  "t_3_lines": [
    mergeCells(
      BIG_T,

      ROW_2,
      ROW_4,
      ROW_5
    ),
  ],


  /* =======================================================
     24. FOUR CORNER SQUARES
  ======================================================= */

  "4_corner_squares": [
    mergeCells(
      SQUARE_TOP_LEFT,
      SQUARE_TOP_RIGHT,
      SQUARE_BOTTOM_LEFT,
      SQUARE_BOTTOM_RIGHT
    ),
  ],


  /* =======================================================
     25. 2 HORIZONTAL + 2 VERTICAL
  ======================================================= */

  "2_horizontal_2_vertical": [
    mergeCells(
      ROW_1,
      ROW_5,

      COL_1,
      COL_5
    ),
  ],


  /* =======================================================
     26. CROSS + 2 LINES
  ======================================================= */

  "1_cross_2_lines": [
    mergeCells(
      BIG_CROSS,

      ROW_1,
      ROW_5
    ),
  ],


 /* =======================================================
   27. THREE SMALL T

   4 correct possibilities
======================================================= */

"3_small_t": [

  // Correct possibility 1
  [
    0,
    2, 3, 4,

    5, 6, 7, 8,

    10, 11,
    13,

    17,

    21, 22, 23,
  ],

  // Correct possibility 2
  [
    4,

    7, 8, 9,

    10,
    13, 14,

    15, 16, 17, 18,

    20,
    22, 23, 24,
  ],

  // Correct possibility 3
  [
    0,

    5, 6, 7,

    10, 11,
    14,

    16, 17, 18, 19,

    20, 21, 22,
    24,
  ],

  // Correct possibility 4
  [
    0, 1, 2,

    6, 7, 8, 9,

    11,
    13,

    17, 18,

    21, 22, 23,
  ],

],


/* =======================================================
   28. RECTANGLE + 2 SQUARES

   4 correct possibilities
======================================================= */

"1_rectangle_2_squares": [

  // Correct possibility 1
  [
    0, 1, 2,

    5, 6, 7,

    11,
    13, 14,

    16, 17, 18, 19,
  ],

  // Correct possibility 2
  [
    0, 1,

    5, 6,

    10, 11,

    15, 16,
    18,

    20, 21,
    23, 24,
  ],

  // Correct possibility 3
  [
    0, 1,
    3, 4,

    5, 6,
    8, 9,

    14,

    16, 17,

    21, 22,
  ],

  // Correct possibility 4
  [
    2, 3, 4,

    7, 8, 9,

    15, 16,
    18, 19,

    20, 21,
    23, 24,
  ],

],

 /* =======================================================
   29. ONE LINE + TWO SQUARES
======================================================= */

"1_line_2_squares": [

  [
    0, 1, 2, 3, 4,

    6,
    8,

    10, 11,
    13, 14,

    15, 16,
    18, 19,

    20, 21, 22, 23, 24,
  ],

],

/* =======================================================
   30. 2 DISCONNECTED LINES + 2 DISCONNECTED SQUARES

   4 correct possibilities
======================================================= */

"2_disconnected_lines_2_disconnected_squares": [

  // Correct possibility 1
  [
    0, 1, 2, 3, 4,

    5, 6, 7, 8, 9,

    15, 16, 17, 18,

    20, 21, 22, 23,
  ],

  // Correct possibility 2
  [
    0, 4,

    5,
    7, 8, 9,

    10,
    13, 14,

    15,
    17, 18, 19,

    20,
    22, 23, 24,
  ],

  // Correct possibility 3
  [
    0, 1, 2, 3, 4,

    5, 6,
    8, 9,

    10, 11,
    13, 14,

    15, 16, 17, 18, 19,
  ],

  // Correct possibility 4
  [
    0, 1, 2,
    4,

    5, 6, 7,
    9,

    14,

    15, 16, 17,
    19,

    20, 21, 22,
    24,
  ],

],


  /* =======================================================
     31. 2 SQUARES + RECTANGLE
  ======================================================= */

  "2_squares_1_rectangle": [
    mergeCells(
      SQUARE_TOP_LEFT,

      SQUARE_BOTTOM_RIGHT,

      RECTANGLE_INNER
    ),
  ],


  /* =======================================================
     32. THREE LINES NO DIAGONAL
  ======================================================= */

  "3_lines_no_diagonal": [
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5
    ),
  ],


  /* =======================================================
     33. FOUR LINES NO DIAGONAL
  ======================================================= */

  "4_lines_no_diagonal": [
    mergeCells(
      ROW_1,
      ROW_5,

      COL_1,
      COL_5
    ),
  ],


  /* =======================================================
     34. FIVE LINES NO DIAGONAL
  ======================================================= */

  "5_lines_no_diagonal": [
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5,

      COL_1,
      COL_5
    ),
  ],


  /* =======================================================
     35. SIX LINES NO DIAGONAL
  ======================================================= */

  "6_lines_no_diagonal": [
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5,

      COL_1,
      COL_3,
      COL_5
    ),
  ],


 /* =======================================================
   36. DIAGONAL + 2 DISCONNECTED CORNER SQUARES

   2 correct possibilities
======================================================= */

"1_diagonal_2_disconnected_corner_squares": [

  // Main diagonal version
  [
    0,

    3, 4,

    6,

    8, 9,

    15, 16,

    18,

    20, 21,

    24,
  ],

  // Reverse diagonal version
  [
    0, 1,

    4,

    5, 6,

    8,

    16,

    18, 19,

    20,

    23, 24,
  ],

],};
/* =========================================================
   PATTERN MATCHER

   Supports:
   - Admin WinningPattern
   - Legacy BingoPattern
========================================================= */

export const isPatternMatched = (
  numbers: number[][],
  calledNumbers: number[],
  pattern:
    | WinningPattern
    | BingoPattern,

  requiredNumber?:
    | number
    | null
): boolean => {

  /* =========================================
     VALIDATE CARD
  ========================================= */

  if (
    !Array.isArray(numbers) ||
    numbers.length !== 5 ||
    !numbers.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 5
    )
  ) {
    return false;
  }


  /* =========================================
     CALLED NUMBERS SET
  ========================================= */

  const called =
    new Set(
      calledNumbers.map(
        Number
      )
    );


  /* =========================================
     CHECK ONE CARD CELL
  ========================================= */

  const isCellMarked = (
    index: number
  ): boolean => {

    /*
     * Center is always FREE.
     */
    if (index === 12) {
      return true;
    }


    const row =
      Math.floor(
        index / 5
      );

    const col =
      index % 5;


    const value =
      numbers[row]?.[col];


    if (
      value === undefined ||
      value === null
    ) {
      return false;
    }


    return called.has(
      Number(value)
    );
  };
  /* =========================================
   REQUIRED / CURRENT CALLED NUMBER

   When requiredNumber is supplied:
   - it MUST exist on this card
   - it MUST participate in the
     completed winning pattern
========================================= */

const requiredCellIndex:
  number | null = (() => {

  /*
   * No extra requirement.
   *
   * Keeps backward compatibility
   * for other callers.
   */
  if (
    requiredNumber ===
      undefined ||
    requiredNumber === null
  ) {
    return null;
  }


  const target =
    Number(
      requiredNumber
    );


  if (
    !Number.isFinite(
      target
    )
  ) {
    return -1;
  }


  for (
    let row = 0;
    row < 5;
    row += 1
  ) {

    for (
      let col = 0;
      col < 5;
      col += 1
    ) {

      const index =
        row * 5 + col;


      /*
       * FREE cannot be the
       * called number.
       */
      if (
        index === 12
      ) {
        continue;
      }


      const value =
        numbers[row]?.[
          col
        ];


      if (
        value !== undefined &&
        value !== null &&
        Number(value) ===
          target
      ) {

        return index;

      }

    }

  }


  /*
   * Current called number
   * does not exist on card.
   */
  return -1;

})();


/*
 * When the current called
 * number was required but
 * is not on the card:
 *
 * NOT A WINNER.
 */
if (
  requiredCellIndex === -1
) {
  return false;
}

/* =========================================
   CHECK WHETHER A COMPLETED LINE
   CONTAINS THE CURRENT CALLED CELL
========================================= */

const completedLineContainsRequiredCell =
  (
    lines:
      number[][]
  ): boolean => {

    /*
     * No requiredNumber was supplied.
     *
     * Preserve original matcher behavior.
     */
    if (
      requiredCellIndex ===
      null
    ) {
      return true;
    }


    return lines.some(
      (line) => {

        /*
         * Current called cell must
         * belong to this line.
         */
        if (
          !line.includes(
            requiredCellIndex
          )
        ) {
          return false;
        }


        /*
         * And the complete line
         * must already be marked.
         */
        return line.every(
          (cellIndex) =>
            isCellMarked(
              cellIndex
            )
        );

      }
    );

  };
/* =========================================
   COUNT COMPLETED STANDARD LINES
========================================= */

const completedLines =
  STANDARD_BINGO_LINES
    .filter(
      (line) =>
        line.every(
          (cellIndex) =>
            isCellMarked(
              cellIndex
            )
        )
    )
    .length;


/* =========================================
   COMPLETED HORIZONTAL LINES
========================================= */

const completedHorizontalLines =
  [
    ROW_1,
    ROW_2,
    ROW_3,
    ROW_4,
    ROW_5,
  ].filter(
    (line) =>
      line.every(
        (cellIndex) =>
          isCellMarked(
            cellIndex
          )
      )
  ).length;


/* =========================================
   COMPLETED VERTICAL LINES
========================================= */

const completedVerticalLines =
  [
    COL_1,
    COL_2,
    COL_3,
    COL_4,
    COL_5,
  ].filter(
    (line) =>
      line.every(
        (cellIndex) =>
          isCellMarked(
            cellIndex
          )
      )
  ).length;


/* =========================================
   COMPLETED DIAGONALS
========================================= */

const completedDiagonalLines =
  [
    DIAGONAL_MAIN,
    DIAGONAL_REVERSE,
  ].filter(
    (line) =>
      line.every(
        (cellIndex) =>
          isCellMarked(
            cellIndex
          )
      )
  ).length;


/* =========================================
   COUNT COMPLETED NON-DIAGONAL LINES
========================================= */

const completedNonDiagonalLines =
  NON_DIAGONAL_LINES
    .filter(
      (line) =>
        line.every(
          (cellIndex) =>
            isCellMarked(
              cellIndex
            )
        )
    )
    .length;

  /* =========================================
   COMPLETED FREE-UNTOUCHED LINES
========================================= */

const completedFreeUntouchedLines =
  FREE_UNTOUCHED_LINES.filter(
    (line) =>
      line.every(
        (cellIndex) =>
          isCellMarked(
            cellIndex
          )
      )
  ).length;


/* =========================================
   4 LINES NOT TOUCHING FREE
========================================= */

if (
  pattern ===
  "4_free_untouched_lines"
) {
  return (
    completedFreeUntouchedLines >=
      4 &&

    completedLineContainsRequiredCell(
      FREE_UNTOUCHED_LINES
    )
  );
}


/* =========================================
   3 HORIZONTAL + 2 VERTICAL
========================================= */

if (
  pattern ===
  "3_horizontal_2_vertical"
) {

  const requiredInHorizontal =
    completedLineContainsRequiredCell(
      [
        ROW_1,
        ROW_2,
        ROW_3,
        ROW_4,
        ROW_5,
      ]
    );


  const requiredInVertical =
    completedLineContainsRequiredCell(
      [
        COL_1,
        COL_2,
        COL_3,
        COL_4,
        COL_5,
      ]
    );


  return (
    completedHorizontalLines >=
      3 &&

    completedVerticalLines >=
      2 &&

    (
      requiredInHorizontal ||
      requiredInVertical
    )
  );

}

/* =========================================
   2 HORIZONTAL + 2 VERTICAL
========================================= */

if (
  pattern ===
  "2_horizontal_2_vertical"
) {

  const requiredInHorizontal =
    completedLineContainsRequiredCell(
      [
        ROW_1,
        ROW_2,
        ROW_3,
        ROW_4,
        ROW_5,
      ]
    );


  const requiredInVertical =
    completedLineContainsRequiredCell(
      [
        COL_1,
        COL_2,
        COL_3,
        COL_4,
        COL_5,
      ]
    );


  return (
    completedHorizontalLines >=
      2 &&

    completedVerticalLines >=
      2 &&

    (
      requiredInHorizontal ||
      requiredInVertical
    )
  );

}


    /* =========================================
   DYNAMIC LINE PATTERNS
========================================= */

if (
  pattern ===
  "3_lines"
) {
  return (
    completedLines >=
      3 &&

    completedLineContainsRequiredCell(
      STANDARD_BINGO_LINES
    )
  );
}

if (
  pattern ===
  "4_lines"
) {
  return (
    completedLines >=
      4 &&

    completedLineContainsRequiredCell(
      STANDARD_BINGO_LINES
    )
  );
}


if (
  pattern ===
  "5_lines"
) {
  return (
    completedLines >=
      5 &&

    completedLineContainsRequiredCell(
      STANDARD_BINGO_LINES
    )
  );
}


if (
  pattern ===
  "6_lines"
) {
  return (
    completedLines >=
      6 &&

    completedLineContainsRequiredCell(
      STANDARD_BINGO_LINES
    )
  );
}


if (
  pattern ===
  "7_lines"
) {
  return (
    completedLines >=
      7 &&

    completedLineContainsRequiredCell(
      STANDARD_BINGO_LINES
    )
  );
}


if (
  pattern ===
  "8_lines"
) {
  return (
    completedLines >=
      8 &&

    completedLineContainsRequiredCell(
      STANDARD_BINGO_LINES
    )
  );
}

/* =========================================
   LINE PATTERNS WITHOUT DIAGONAL
========================================= */

if (
  pattern ===
  "3_lines_no_diagonal"
) {
  return (
    completedNonDiagonalLines >=
      3 &&

    completedLineContainsRequiredCell(
      NON_DIAGONAL_LINES
    )
  );
}


if (
  pattern ===
  "4_lines_no_diagonal"
) {
  return (
    completedNonDiagonalLines >=
      4 &&

    completedLineContainsRequiredCell(
      NON_DIAGONAL_LINES
    )
  );
}


if (
  pattern ===
  "5_lines_no_diagonal"
) {
  return (
    completedNonDiagonalLines >=
      5 &&

    completedLineContainsRequiredCell(
      NON_DIAGONAL_LINES
    )
  );
}


if (
  pattern ===
  "6_lines_no_diagonal"
) {
  return (
    completedNonDiagonalLines >=
      6 &&

    completedLineContainsRequiredCell(
      NON_DIAGONAL_LINES
    )
  );
}
  /* =========================================
     NEW ADMIN WINNING PATTERNS
  ========================================= */

  if (
    isValidWinningPattern(
      pattern
    )
  ) {

    const layouts =
      WINNING_PATTERN_LAYOUTS[
        pattern
      ];


    if (
      !Array.isArray(layouts) ||
      layouts.length === 0
    ) {
      return false;
    }


    /*
     * Some patterns have several
     * acceptable layouts.
     *
     * Example:
     * half_house:
     *
     * top half OR bottom half.
     */
    return layouts.some(
  (
    requiredCells
  ) => {

    /*
     * If the current called number
     * requirement is active,
     * this exact winning possibility
     * MUST contain that cell.
     */
    if (
      requiredCellIndex !==
        null &&
      !requiredCells.includes(
        requiredCellIndex
      )
    ) {
      return false;
    }


    /*
     * Original winning-pattern
     * validation remains unchanged.
     */
    return requiredCells.every(
      (cellIndex) =>
        isCellMarked(
          cellIndex
        )
    );

  }
);
  }


  /* =========================================
     LEGACY ROW
  ========================================= */

  if (
    pattern === "row"
  ) {
    return [
      ROW_1,
      ROW_2,
      ROW_3,
      ROW_4,
      ROW_5,
    ].some(
      (row) =>
        row.every(
          (cell) =>
            isCellMarked(
              cell
            )
        )
    );
  }


  /* =========================================
     LEGACY COLUMN
  ========================================= */

  if (
    pattern === "column"
  ) {
    return [
      COL_1,
      COL_2,
      COL_3,
      COL_4,
      COL_5,
    ].some(
      (column) =>
        column.every(
          (cell) =>
            isCellMarked(
              cell
            )
        )
    );
  }


  /* =========================================
     LEGACY DIAGONAL
  ========================================= */

  if (
    pattern === "diagonal"
  ) {
    return (
      DIAGONAL_MAIN.every(
        (cell) =>
          isCellMarked(
            cell
          )
      ) ||
      DIAGONAL_REVERSE.every(
        (cell) =>
          isCellMarked(
            cell
          )
      )
    );
  }


  /* =========================================
     LEGACY FOUR CORNERS
  ========================================= */

  if (
    pattern ===
    "four_corners"
  ) {
    return [
      0,
      4,
      20,
      24,
    ].every(
      (cell) =>
        isCellMarked(
          cell
        )
    );
  }


  /* =========================================
     LEGACY X
  ========================================= */

  if (
    pattern === "x"
  ) {
    const cells =
      mergeCells(
        DIAGONAL_MAIN,
        DIAGONAL_REVERSE
      );

    return cells.every(
      (cell) =>
        isCellMarked(
          cell
        )
    );
  }


  /* =========================================
     LEGACY BLACKOUT
  ========================================= */

  if (
    pattern ===
    "blackout"
  ) {
    return ALL_CELLS.every(
      (cell) =>
        isCellMarked(
          cell
        )
    );
  }
  return false;
};