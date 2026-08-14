import { Star } from "lucide-react";

function BingoCard({
  numbers = [],
  calledNumbers = [],
}) {
  const isCalled = (number) => {
    if (number === 0) {
      return true;
    }

    return calledNumbers.includes(number);
  };

  return (
    <div className="bingo-card-wrapper">

      <div className="bingo-card-header">
        {["B", "I", "N", "G", "O"].map(
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

      <div className="bingo-grid">
        {numbers.map((row, rowIndex) =>
          row.map((number, columnIndex) => {
            const freeSpace =
              rowIndex === 2 &&
              columnIndex === 2;

            const called =
              freeSpace || isCalled(number);

            return (
              <div
                key={`${rowIndex}-${columnIndex}`}
                className={`bingo-cell ${
                  called
                    ? "called"
                    : ""
                } ${
                  freeSpace
                    ? "free"
                    : ""
                }`}
              >
                {freeSpace ? (
                  <Star
                    size={18}
                    fill="currentColor"
                  />
                ) : (
                  number
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

export default BingoCard;