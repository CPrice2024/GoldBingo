import { X } from "lucide-react";
import {
  WINNING_PATTERNS,
} from "../../constants/winningPatterns";

const createCells = (
  activeCells = []
) => {
  const activeSet =
    new Set(activeCells);

  return Array.from(
    { length: 25 },
    (_, index) => ({
      index,

      active:
        activeSet.has(index),

      free:
        index === 12,
    })
  );
};


/*
  CELL INDEXES

   0   1   2   3   4
   5   6   7   8   9
  10  11  12  13  14
  15  16  17  18  19
  20  21  22  23  24
*/


/* =========================================================
   PATTERN HELPERS
========================================================= */

const mergeCells = (
  ...groups
) => {
  return [
    ...new Set(
      groups.flat()
    ),
  ];
};


/* =========================================================
   BASIC LINES
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


/*
 * Inner squares used when
 * patterns must not overlap
 * the outer corners.
 */

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
   T AND CROSS
========================================================= */

const BIG_T = mergeCells(
  ROW_1,
  COL_3
);


const BIG_CROSS = mergeCells(
  ROW_3,
  COL_3
);


/* =========================================================
   ALL CELLS
========================================================= */

const ALL_CELLS =
  Array.from(
    { length: 25 },
    (_, index) =>
      index
  );


/* =========================================================
   WINNING PATTERN LAYOUTS

   Every WINNING_PATTERNS value
   must exist here.
========================================================= */

const PATTERN_LAYOUTS = {


  /* =======================================================
     1. FULL HOUSE
  ======================================================= */

  full_house:
    ALL_CELLS,


  /* =======================================================
     2. HALF HOUSE

     Either:
     TOP -> DOWN
     OR
     BOTTOM -> UP
  ======================================================= */

  half_house: [

    {
      title:
        "ከላይ ወደ ታች",

      cells:
        mergeCells(
          ROW_1,
          ROW_2,
          ROW_3
        ),
    },

    {
      title:
        "ከታች ወደ ላይ",

      cells:
        mergeCells(
          ROW_3,
          ROW_4,
          ROW_5
        ),
    },

  ],


  /* =======================================================
     3. HALF HOUSE + DIAGONAL
  ======================================================= */

  half_house_diagonal: [

    {
      title:
        "ከላይ + ዋና ዲያጎናል",

      cells:
        mergeCells(
          ROW_1,
          ROW_2,
          ROW_3,
          DIAGONAL_MAIN
        ),
    },

    {
      title:
        "ከላይ + ተቃራኒ ዲያጎናል",

      cells:
        mergeCells(
          ROW_1,
          ROW_2,
          ROW_3,
          DIAGONAL_REVERSE
        ),
    },

    {
      title:
        "ከታች + ዋና ዲያጎናል",

      cells:
        mergeCells(
          ROW_3,
          ROW_4,
          ROW_5,
          DIAGONAL_MAIN
        ),
    },

    {
      title:
        "ከታች + ተቃራኒ ዲያጎናል",

      cells:
        mergeCells(
          ROW_3,
          ROW_4,
          ROW_5,
          DIAGONAL_REVERSE
        ),
    },

  ],


  /* =======================================================
     4. THREE LINES
  ======================================================= */

  "3_lines":
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5
    ),


  /* =======================================================
     5. FOUR LINES
  ======================================================= */

  "4_lines":
    mergeCells(
      ROW_1,
      ROW_5,
      COL_1,
      COL_5
    ),


  /* =======================================================
     6. FIVE LINES
  ======================================================= */

  "5_lines":
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5,
      COL_1,
      COL_5
    ),


  /* =======================================================
     7. SIX LINES
  ======================================================= */

  "6_lines":
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5,
      COL_1,
      COL_5,
      DIAGONAL_MAIN
    ),


  /* =======================================================
     8. SEVEN LINES
  ======================================================= */

  "7_lines":
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5,
      COL_1,
      COL_5,
      DIAGONAL_MAIN,
      DIAGONAL_REVERSE
    ),


  /* =======================================================
     9. EIGHT LINES
  ======================================================= */

  "8_lines":
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


  /* =======================================================
     10. 4 LINES WITHOUT TOUCHING FREE CENTER
  ======================================================= */

  "4_free_untouched_lines":
    mergeCells(
      ROW_1,
      ROW_2,
      ROW_4,
      ROW_5
    ),


  /* =======================================================
     11. 3 HORIZONTAL + 2 VERTICAL
  ======================================================= */

  "3_horizontal_2_vertical":
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5,

      COL_1,
      COL_5
    ),


  /* =======================================================
     12. 3 DISCONNECTED / NON-INTERSECTING LINES
  ======================================================= */

  "3_disconnected_lines":
    mergeCells(
      ROW_1,
      ROW_3,
      ROW_5
    ),


  /* =======================================================
     13. 4 DISCONNECTED / NON-INTERSECTING LINES
  ======================================================= */

  "4_disconnected_lines":
    mergeCells(
      ROW_1,
      ROW_2,
      ROW_4,
      ROW_5
    ),


  /* =======================================================
     14. TWO DIAGONALS
  ======================================================= */

  "2_diagonals":
    mergeCells(
      DIAGONAL_MAIN,
      DIAGONAL_REVERSE
    ),


  /* =======================================================
     15. THREE RECTANGLES
  ======================================================= */

  "3_rectangles":
    mergeCells(
      RECTANGLE_OUTER,
      RECTANGLE_MIDDLE,
      RECTANGLE_INNER
    ),


  /* =======================================================
     16. FOUR SQUARES
  ======================================================= */

  "4_squares":
    mergeCells(
      SQUARE_TOP_LEFT,
      SQUARE_TOP_RIGHT,
      SQUARE_BOTTOM_LEFT,
      SQUARE_BOTTOM_RIGHT
    ),


  /* =======================================================
     17.
     3 CORNER DOTS
     + 2 DISCONNECTED SQUARES
  ======================================================= */

  "3_corner_dots_2_disconnected_squares":
    mergeCells(

      [
        0,
        4,
        24,
      ],

      SQUARE_INNER_LEFT,

      SQUARE_BOTTOM_LEFT
    ),


  /* =======================================================
     18.
     3 CORNER DOTS
     + 3 DISCONNECTED SQUARES
  ======================================================= */

  "3_corner_dots_3_disconnected_squares":
    mergeCells(

      [
        0,
        4,
        24,
      ],

      SQUARE_INNER_LEFT,

      SQUARE_INNER_RIGHT,

      SQUARE_INNER_BOTTOM
    ),


  /* =======================================================
     19.
     4 CORNER DOTS
     + 2 DISCONNECTED SQUARES
  ======================================================= */

  "4_corner_dots_2_disconnected_squares":
    mergeCells(

      [
        0,
        4,
        20,
        24,
      ],

      SQUARE_INNER_LEFT,

      SQUARE_INNER_RIGHT
    ),


  /* =======================================================
     20.
     T + 2 DISCONNECTED SQUARES
  ======================================================= */

  "t_2_disconnected_squares":
    mergeCells(

      BIG_T,

      SQUARE_BOTTOM_LEFT,

      SQUARE_BOTTOM_RIGHT
    ),


  /* =======================================================
     21.
     T + 1 DIAGONAL + 2 LINES
  ======================================================= */

  "t_1_diagonal_2_lines":
    mergeCells(

      BIG_T,

      DIAGONAL_MAIN,

      ROW_5,

      COL_1
    ),


  /* =======================================================
     22.
     T + 1 RECTANGLE
  ======================================================= */

  "t_1_rectangle":
    mergeCells(

      BIG_T,

      RECTANGLE_INNER
    ),


  /* =======================================================
     23.
     T + 3 LINES
  ======================================================= */

  "t_3_lines":
    mergeCells(

      BIG_T,

      ROW_2,
      ROW_4,
      ROW_5
    ),


  /* =======================================================
     24. FOUR CORNER SQUARES
  ======================================================= */

  "4_corner_squares":
    mergeCells(
      SQUARE_TOP_LEFT,
      SQUARE_TOP_RIGHT,
      SQUARE_BOTTOM_LEFT,
      SQUARE_BOTTOM_RIGHT
    ),


  /* =======================================================
     25. 2 HORIZONTAL + 2 VERTICAL
  ======================================================= */

  "2_horizontal_2_vertical":
    mergeCells(

      ROW_1,
      ROW_5,

      COL_1,
      COL_5
    ),


  /* =======================================================
     26. ONE CROSS + TWO LINES
  ======================================================= */

  "1_cross_2_lines":
    mergeCells(

      BIG_CROSS,

      ROW_1,
      ROW_5
    ),


  /* =======================================================
     27. THREE SMALL T
  ======================================================= */

  "3_small_t":
    mergeCells(

      // Small T 1
      [
        0, 1, 2,
        6,
      ],

      // Small T 2
      [
        6, 7, 8,
        12,
      ],

      // Small T 3
      [
        16, 17, 18,
        22,
      ]
    ),


  /* =======================================================
     28.
     1 RECTANGLE + 2 SQUARES
  ======================================================= */

  "1_rectangle_2_squares":
    mergeCells(

      RECTANGLE_OUTER,

      SQUARE_INNER_LEFT,

      SQUARE_INNER_RIGHT
    ),


  /* =======================================================
     29.
     1 LINE + 2 SQUARES
  ======================================================= */

  "1_line_2_squares":
    mergeCells(

      ROW_3,

      SQUARE_TOP_LEFT,

      SQUARE_BOTTOM_RIGHT
    ),


  /* =======================================================
     30.
     2 DISCONNECTED LINES
     + 2 DISCONNECTED SQUARES
  ======================================================= */

  "2_disconnected_lines_2_disconnected_squares":
    mergeCells(

      ROW_1,
      ROW_5,

      SQUARE_INNER_LEFT,
      SQUARE_INNER_RIGHT
    ),


  /* =======================================================
     31.
     2 SQUARES + 1 RECTANGLE
  ======================================================= */

  "2_squares_1_rectangle":
    mergeCells(

      SQUARE_TOP_LEFT,

      SQUARE_BOTTOM_RIGHT,

      RECTANGLE_INNER
    ),


  /* =======================================================
     32.
     3 LINES WITHOUT DIAGONAL
  ======================================================= */

  "3_lines_no_diagonal":
    mergeCells(

      ROW_1,
      ROW_3,
      ROW_5
    ),


  /* =======================================================
     33.
     4 LINES WITHOUT DIAGONAL
  ======================================================= */

  "4_lines_no_diagonal":
    mergeCells(

      ROW_1,
      ROW_5,

      COL_1,
      COL_5
    ),


  /* =======================================================
     34.
     5 LINES WITHOUT DIAGONAL
  ======================================================= */

  "5_lines_no_diagonal":
    mergeCells(

      ROW_1,
      ROW_3,
      ROW_5,

      COL_1,
      COL_5
    ),


  /* =======================================================
     35.
     6 LINES WITHOUT DIAGONAL
  ======================================================= */

  "6_lines_no_diagonal":
    mergeCells(

      ROW_1,
      ROW_3,
      ROW_5,

      COL_1,
      COL_3,
      COL_5
    ),


  /* =======================================================
     36.
     1 DIAGONAL
     + 2 DISCONNECTED CORNER SQUARES
  ======================================================= */

  "1_diagonal_2_disconnected_corner_squares":
    mergeCells(

      DIAGONAL_MAIN,

      SQUARE_TOP_RIGHT,

      SQUARE_BOTTOM_LEFT
    ),

};
/* =========================================================
   VERIFY ALL WINNING PATTERNS HAVE PREVIEW
========================================================= */

const missingPatternLayouts =
  WINNING_PATTERNS.filter(
    (pattern) =>
      !Object.prototype.hasOwnProperty.call(
        PATTERN_LAYOUTS,
        pattern.value
      )
  );


if (
  import.meta.env.DEV &&
  missingPatternLayouts.length >
    0
) {

  console.warn(
    "Missing winning pattern layouts:",
    missingPatternLayouts.map(
      (pattern) =>
        pattern.value
    )
  );

}


/* =========================================
   NORMALIZE PATTERN LAYOUT

   Supports:

   Single layout:
   [
     0, 1, 2...
   ]

   Multiple layouts:
   [
     {
       title: "...",
       cells: [...]
     }
   ]
========================================= */

const getPatternLayouts = (
  patternId
) => {
  const pattern =
    PATTERN_LAYOUTS[
      patternId
    ];

  if (!pattern) {
    return [];
  }


  /*
   * Multiple layouts
   */

  if (
    Array.isArray(pattern) &&
    pattern.length > 0 &&
    typeof pattern[0] ===
      "object" &&
    !Array.isArray(pattern[0])
  ) {
    return pattern;
  }


  /*
   * Single layout
   */

  return [
    {
      title: null,
      cells: pattern,
    },
  ];
};


export default function WinningPatternPreview({
  open,
  onClose,
  patternId,
  patternLabel,
}) {

  if (!open) {
    return null;
  }


  const layouts =
    getPatternLayouts(
      patternId
    );


  return (
    <div
      className="winning-pattern-modal-overlay"
      onClick={onClose}
    >

      <div
        className="winning-pattern-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >


        {/* =====================================
            HEADER
        ====================================== */}

        <div className="winning-pattern-modal-header">

          <div>

            <span>
              የጨዋታ ዓይነት
            </span>

            <strong>
              {patternLabel}
            </strong>

          </div>


          <button
            type="button"
            onClick={onClose}
            className="winning-pattern-modal-close"
            aria-label="Close winning pattern"
          >

            <X size={19} />

          </button>

        </div>



        {/* =====================================
            PATTERN AVAILABLE
        ====================================== */}

        {layouts.length > 0 ? (
          <>

            <div className="winning-pattern-help">
              በወርቃማ ቀለም የተሰየሙት
              ቦታዎች የማሸነፊያ
              አቀማመጥን ያሳያሉ።
            </div>


            <div className="winning-pattern-layouts">

              {layouts.map(
                (
                  layout,
                  layoutIndex
                ) => {

                  const cells =
                    createCells(
                      layout.cells
                    );

                  return (
                    <div
                      key={
                        `${patternId}-${layoutIndex}`
                      }
                      className="winning-pattern-layout-option"
                    >


                      {/* MULTIPLE CONDITION TITLE */}

                      {layout.title && (
                        <div className="winning-pattern-option-title">

                          {layout.title}

                        </div>
                      )}


                      {/* BINGO CARD */}

                      <div className="winning-pattern-card">


                        {/* BINGO HEADER */}

                        <div className="winning-pattern-card-header">

                          <span>B</span>
                          <span>I</span>
                          <span>N</span>
                          <span>G</span>
                          <span>O</span>

                        </div>


                        {/* 5 × 5 GRID */}

                        <div className="winning-pattern-grid">

                          {cells.map(
                            (cell) => (
                              <div
                                key={
                                  cell.index
                                }
                                className={[
                                  "winning-pattern-cell",

                                  cell.active
                                    ? "active"
                                    : "",

                                  cell.free
                                    ? "free"
                                    : "",
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " "
                                  )}
                              >

                                {cell.free
                                  ? "FREE"
                                  : ""}

                              </div>
                            )
                          )}

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>



            {/* =====================================
                LEGEND
            ====================================== */}

            <div className="winning-pattern-legend">

              <span>

                <i className="pattern-example-active" />

                Required

              </span>


              <span>

                <i className="pattern-example-normal" />

                Other

              </span>

            </div>

          </>
        ) : (

          /* =====================================
             PATTERN NOT CONFIGURED
          ====================================== */

          <div className="winning-pattern-not-defined">

            <strong>
              {patternLabel}
            </strong>

           <span>
  የዚህ የጨዋታ ዓይነት
  የማሸነፊያ አቀማመጥ
  ገና አልተዘጋጀም።
</span>

          </div>

        )}

      </div>

    </div>
  );
}