import {
  Star,
} from "lucide-react";


function BingoCard({
  numbers = [],
  calledNumbers = [],
  markedNumbers = [],
  manualMarkingEnabled = true,
  onNumberClick,
}) {

  /*
   * =========================================
   * NORMALIZE CARD ORIENTATION
   * =========================================
   *
   * Some cards are stored as:
   *
   * [
   *   [B,B,B,B,B],
   *   [I,I,I,I,I],
   *   [N,N,N,N,N],
   *   [G,G,G,G,G],
   *   [O,O,O,O,O],
   * ]
   *
   * We convert them for display to:
   *
   * [
   *   [B,I,N,G,O],
   *   [B,I,N,G,O],
   *   ...
   * ]
   */

  const displayNumbers = (() => {

    if (
      !Array.isArray(numbers) ||
      numbers.length !== 5 ||
      !numbers.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 5
      )
    ) {
      return numbers;
    }


    const ranges = [
      [1, 15],
      [16, 30],
      [31, 45],
      [46, 60],
      [61, 75],
    ];


    /*
     * Detect whether outer arrays
     * represent B / I / N / G / O.
     */

    const columnOriented =
      numbers.every(
        (
          group,
          groupIndex
        ) => {

          const [
            min,
            max,
          ] = ranges[
            groupIndex
          ];


          return group.every(
            (
              value,
              valueIndex
            ) => {

              const numericValue =
                Number(value);


              /*
               * FREE CENTER
               */

              if (
                groupIndex === 2 &&
                valueIndex === 2 &&
                numericValue === 0
              ) {
                return true;
              }


              return (
                numericValue >= min &&
                numericValue <= max
              );

            }
          );

        }
      );


    /*
     * Already in correct display format.
     */

    if (!columnOriented) {
      return numbers;
    }


    /*
     * TRANSPOSE CARD
     */

    return Array.from(
      {
        length: 5,
      },
      (
        _,
        rowIndex
      ) =>
        Array.from(
          {
            length: 5,
          },
          (
            _,
            columnIndex
          ) =>
            numbers[
              columnIndex
            ][
              rowIndex
            ]
        )
    );

  })();


  /*
   * =========================================
   * NORMALIZE CALLED NUMBERS
   * =========================================
   */

  const normalizedCalledNumbers =
    calledNumbers.map(
      (number) =>
        Number(number)
    );


  const normalizedMarkedNumbers =
    markedNumbers.map(
      (number) =>
        Number(number)
    );


  /*
   * =========================================
   * SERVER CALLED
   * =========================================
   */

  const isServerCalled = (
    number
  ) => {

    const numericNumber =
      Number(number);


    if (
      numericNumber === 0
    ) {
      return true;
    }


    return normalizedCalledNumbers.includes(
      numericNumber
    );

  };


  /*
   * =========================================
   * MARKED
   * =========================================
   */

  const isMarked = (
    number
  ) => {

    const numericNumber =
      Number(number);


    if (
      numericNumber === 0
    ) {
      return true;
    }


    /*
     * MANUAL MODE
     */

    if (
      manualMarkingEnabled
    ) {

      return normalizedMarkedNumbers.includes(
        numericNumber
      );

    }


    /*
     * AUTO MODE
     */

    return isServerCalled(
      numericNumber
    );

  };


  /*
   * =========================================
   * CELL CLICK
   * =========================================
   */

  const handleCellClick = (
    number,
    freeSpace
  ) => {

    if (
      freeSpace ||
      !manualMarkingEnabled
    ) {
      return;
    }


    const numericNumber =
      Number(number);


    onNumberClick?.(
      numericNumber
    );

  };


  return (

    <div className="bingo-card-wrapper">

      {/* B I N G O */}

      <div className="bingo-card-header">

        {[
          "B",
          "I",
          "N",
          "G",
          "O",
        ].map(
          (letter) => (

            <div
              key={letter}
              className="bingo-column"
            >
              {letter}
            </div>

          )
        )}

      </div>


      {/* CARD */}

      <div className="bingo-grid">

        {displayNumbers.map(
          (
            row,
            rowIndex
          ) =>

            row.map(
              (
                number,
                columnIndex
              ) => {

                const numericNumber =
                  Number(
                    number
                  );


                const freeSpace =
                  rowIndex === 2 &&
                  columnIndex === 2;


                const marked =
                  freeSpace ||
                  isMarked(
                    numericNumber
                  );


                const availableToMark =
                  !freeSpace &&
                  manualMarkingEnabled;


                return (

                  <button
                    type="button"

                    key={
                      `${rowIndex}-${columnIndex}`
                    }

                    onClick={() =>
                      handleCellClick(
                        numericNumber,
                        freeSpace
                      )
                    }

                    disabled={
                      freeSpace
                    }

                    className={[
                      "bingo-cell",

                      marked
                        ? "called"
                        : "",

                      freeSpace
                        ? "free"
                        : "",

                      availableToMark
                        ? "bingo-cell-clickable"
                        : "",

                      availableToMark &&
                      !marked
                        ? "bingo-cell-waiting-mark"
                        : "",

                      manualMarkingEnabled
                        ? "manual-mode"
                        : "auto-mode",
                    ]
                      .filter(
                        Boolean
                      )
                      .join(" ")}
                  >

                    {freeSpace ? (

                      <Star
                        size={18}
                        fill="currentColor"
                      />

                    ) : (

                      numericNumber

                    )}

                  </button>

                );

              }
            )
        )}

      </div>

    </div>

  );

}


export default BingoCard;