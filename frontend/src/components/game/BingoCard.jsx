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
   * Normalize values because API values
   * may sometimes arrive as strings.
   *
   * Example:
   * "25" becomes 25
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
     *
     * Only player-clicked numbers
     * become marked.
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
     *
     * Every called number
     * becomes marked automatically.
     */
    return isServerCalled(
      numericNumber
    );
  };


  const handleCellClick = (
    number,
    freeSpace
  ) => {

    if (
      freeSpace
    ) {
      return;
    }


    if (
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

        {numbers.map(
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
                  Number(number);


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

                    /*
                     * IMPORTANT:
                     *
                     * Do NOT disable normal cells.
                     *
                     * The click handler decides
                     * whether the number can
                     * actually be marked.
                     */
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
                      .filter(Boolean)
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