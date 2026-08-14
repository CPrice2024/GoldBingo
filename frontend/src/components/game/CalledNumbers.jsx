import { Volume2 } from "lucide-react";

function CalledNumbers({
  numbers = [],
}) {
  const latest =
    numbers.length > 0
      ? numbers[numbers.length - 1]
      : null;

  return (
    <section className="called-numbers-card">

      <div className="called-numbers-header">

        <div>
          <h3>Called Numbers</h3>

          <p>
            Numbers called during this game
          </p>
        </div>

        <Volume2 size={18} />

      </div>

      {latest !== null && (
        <div className="latest-number">

          <span>Latest</span>

          <strong>{latest}</strong>

        </div>
      )}

      <div className="called-numbers-list">

        {numbers.length === 0 ? (
          <div className="no-called-numbers">
            No numbers called yet
          </div>
        ) : (
          numbers.map((number, index) => (
            <span
              key={`${number}-${index}`}
              className={
                index ===
                numbers.length - 1
                  ? "number latest"
                  : "number"
              }
            >
              {number}
            </span>
          ))
        )}

      </div>

    </section>
  );
}

export default CalledNumbers;