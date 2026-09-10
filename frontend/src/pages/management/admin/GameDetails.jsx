import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Gamepad2,
  Users,
  Trophy,
  Coins,
  Clock,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getGameById,
  updateGame,
  callNumber,
} from "../../../api/game.api";

import {
  WINNING_PATTERNS,
  getWinningPatternLabel,
} from "../../../constants/winningPatterns";


const BINGO_NUMBER_ROWS = [
  {
    letter: "B",
    numbers: Array.from(
      { length: 15 },
      (_, index) => index + 1
    ),
  },

  {
    letter: "I",
    numbers: Array.from(
      { length: 15 },
      (_, index) => index + 16
    ),
  },

  {
    letter: "N",
    numbers: Array.from(
      { length: 15 },
      (_, index) => index + 31
    ),
  },

  {
    letter: "G",
    numbers: Array.from(
      { length: 15 },
      (_, index) => index + 46
    ),
  },

  {
    letter: "O",
    numbers: Array.from(
      { length: 15 },
      (_, index) => index + 61
    ),
  },
];

export default function GameDetails() {
  const { gameId } =
    useParams();

  const navigate =
    useNavigate();

  const [game, setGame] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
  callingNumber,
  setCallingNumber,
] = useState(null);

const [
  currentTime,
  setCurrentTime,
] = useState(
  Date.now()
);

 const [form, setForm] =
  useState({
    name: "",
    entryFee: "",
    maxPlayers: "",
    winningPattern:
      "3_lines",

    prizeAmount: "",

    scheduledStartAt: "",
  });
const toDateTimeLocal = (
  value
) => {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  const offset =
    date.getTimezoneOffset();


  return new Date(
    date.getTime() -
      offset * 60 * 1000
  )
    .toISOString()
    .slice(0, 16);
};

 const loadGame = async (
  silent = false
) => {
  try {

    if (!silent) {
      setLoading(true);
    }
      setError("");

      const response =
        await getGameById(
          gameId
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to load game"
        );
      }

      const nextGame =
        response.data;

      setGame(nextGame);

setForm({
  name:
    nextGame.name || "",

  entryFee:
    nextGame.entryFee ?? "",

  maxPlayers:
    nextGame.maxPlayers ?? "",

  winningPattern:
    nextGame.winningPattern ||
    "3_lines",

  prizeAmount:
    nextGame.prizeAmount ??
    "",

  scheduledStartAt:
    toDateTimeLocal(
      nextGame.scheduledStartAt
    ),
});
    } catch (err) {
      console.error(
        "Failed to load game:",
        err
      );

      setError(
        err?.response?.data
          ?.message ||
          err.message ||
          "Failed to load game"
      );
   } finally {

  if (!silent) {
    setLoading(false);
  }

}
  };


  useEffect(() => {
    loadGame();
  }, [gameId]);

  /* =========================================
   LIVE CLOCK
========================================= */

useEffect(() => {

  const timer =
    setInterval(
      () => {
        setCurrentTime(
          Date.now()
        );
      },
      250
    );


  return () => {
    clearInterval(
      timer
    );
  };

}, []);


/* =========================================
   LIVE GAME REFRESH
========================================= */

useEffect(() => {

  const timer =
    setInterval(
      () => {

        if (!editing) {
          void loadGame(
            true
          );
        }

      },
      2000
    );


  return () => {
    clearInterval(
      timer
    );
  };

}, [
  gameId,
  editing,
]);


  const handleCancelEdit =
    () => {
      if (!game) {
        return;
      }

      setForm({
  name:
    game.name || "",

  entryFee:
    game.entryFee ?? "",

  maxPlayers:
    game.maxPlayers ?? "",

  winningPattern:
    game.winningPattern ||
    "3_lines",

  prizeAmount:
    game.prizeAmount ??
    "",

  scheduledStartAt:
    toDateTimeLocal(
      game.scheduledStartAt
    ),
});

      setEditing(false);
      setError("");
    };


  const handleSave =
    async (event) => {
      event.preventDefault();

      if (
        !form.name.trim()
      ) {
        setError(
          "Game name is required"
        );

        return;
      }

      if (
        form.entryFee === "" ||
        Number(
          form.entryFee
        ) < 0
      ) {
        setError(
          "Invalid entry fee"
        );

        return;
      }

      if (
        form.maxPlayers === "" ||
        Number(
          form.maxPlayers
        ) <= 0
      )
      
       {
        setError(
          "Maximum players must be greater than zero"
        );

        return;
      }
      if (
  form.prizeAmount !== "" &&
  Number(form.prizeAmount) < 0
) {
  setError(
    "Prize amount cannot be negative"
  );

  return;
}
if (
  form.scheduledStartAt &&
  Number.isNaN(
    new Date(
      form.scheduledStartAt
    ).getTime()
  )
) {
  setError(
    "Invalid scheduled start time"
  );

  return;
}

      try {
        setSaving(true);
        setError("");
        setMessage("");

        const response =
          await updateGame(
  gameId,
  {
    name:
      form.name.trim(),

    entryFee:
      Number(
        form.entryFee
      ),

    maxPlayers:
      Number(
        form.maxPlayers
      ),

    winningPattern:
      form.winningPattern,

    prizeAmount:
      form.prizeAmount === ""
        ? null
        : Number(
            form.prizeAmount
          ),

    scheduledStartAt:
      form.scheduledStartAt
        ? new Date(
            form.scheduledStartAt
          ).toISOString()
        : null,
  }
);

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to update game"
          );
        }

        setMessage(
          "Game updated successfully."
        );

        setEditing(false);

        await loadGame();
      } catch (err) {
        console.error(
          "Failed to update game:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            err.message ||
            "Failed to update game"
        );
      } finally {
        setSaving(false);
      }
    };
    /* =========================================
   MANUAL NUMBER CALL
========================================= */

const handleManualCall =
  async (number) => {

    if (!game) {
      return;
    }


    if (
      game.callMode !==
      "manual"
    ) {
      return;
    }


    if (
      game.status !==
      "active"
    ) {
      return;
    }


    if (
      game.firstWinnerAt
    ) {
      return;
    }


    const alreadyCalled =
      Array.isArray(
        game.calledNumbers
      ) &&
      game.calledNumbers.includes(
        number
      );


    if (alreadyCalled) {
      return;
    }


    const nextCallTime =
      game.nextCallAt
        ? new Date(
            game.nextCallAt
          ).getTime()
        : 0;


    if (
      nextCallTime >
      Date.now()
    ) {
      return;
    }


    try {

      setCallingNumber(
        number
      );

      setError("");
      setMessage("");


      const response =
        await callNumber(
          gameId,
          number
        );


      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to call number"
        );
      }


      setMessage(
        `Number ${number} called successfully.`
      );


      await loadGame(
        true
      );

    } catch (err) {

      console.error(
        "Manual number call failed:",
        err
      );


      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          "Failed to call number"
      );


      await loadGame(
        true
      );

    } finally {

      setCallingNumber(
        null
      );

    }

  };

  if (loading) {
    return (
      <div className="admin-game-details-loading">
        Loading game...
      </div>
    );
  }


  if (!game) {
    return (
      <div className="admin-game-details-page">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/admin/games"
            )
          }
          className="admin-secondary-button"
        >
          <ArrowLeft
            size={17}
          />

          Back
        </button>

        <div className="admin-games-error">
          {error ||
            "Game not found"}
        </div>

      </div>
    );
  }


  const canEdit =
    game.status ===
    "waiting";

  const calledNumbers =
  Array.isArray(
    game.calledNumbers
  )
    ? game.calledNumbers
    : [];


const calledNumberSet =
  new Set(
    calledNumbers
  );


const nextCallTime =
  game.nextCallAt
    ? new Date(
        game.nextCallAt
      ).getTime()
    : 0;


const manualCountdown =
  nextCallTime
    ? Math.max(
        0,
        Math.ceil(
          (
            nextCallTime -
            currentTime
          ) / 1000
        )
      )
    : 0;


const manualCallReady =
  game.callMode ===
    "manual" &&
  game.status ===
    "active" &&
  !game.firstWinnerAt &&
  manualCountdown ===
    0 &&
  calledNumbers.length <
    75 &&
  callingNumber ===
    null;


  return (
    <div className="admin-game-details-page">

      {/* HEADER */}

      <div className="admin-game-details-header">

        <div>

          <button
            type="button"
            className="admin-game-back-button"
            onClick={() =>
              navigate(
                "/admin/games"
              )
            }
          >
            <ArrowLeft
              size={18}
            />

            Games
          </button>

          <h1>
            {game.name}
          </h1>

          <p>
            View and manage game
            configuration.
          </p>

        </div>


        {!editing &&
          canEdit && (
            <button
              type="button"
              className="admin-primary-button"
              onClick={() =>
                setEditing(true)
              }
            >
              <Edit3
                size={17}
              />

              Edit Game
            </button>
          )}

      </div>


      {error && (
        <div className="admin-games-error">
          {error}
        </div>
      )}


      {message && (
        <div className="admin-game-success">
          {message}
        </div>
      )}


      {/* BASIC INFORMATION */}

      <div className="admin-game-detail-card">

        <div className="admin-game-detail-card-header">

          <Gamepad2
            size={20}
          />

          <div>
            <strong>
              Game Information
            </strong>

            <span>
              Current configuration
            </span>
          </div>

          <span
            className={`game-status ${game.status}`}
          >
            {game.status}
          </span>

        </div>


        {!editing ? (

          <div className="admin-game-detail-grid">

            <div>
              <Gamepad2
                size={18}
              />

              <span>
                Game Name
              </span>

              <strong>
                {game.name}
              </strong>
            </div>


            <div>
              <Coins size={18} />

              <span>
                Entry Fee
              </span>

              <strong>
                {game.entryFee}
                {" ETB"}
              </strong>
            </div>


            <div>
              <Users size={18} />

              <span>
                Players
              </span>

              <strong>
                {game.currentPlayers}
                {" / "}
                {game.maxPlayers}
              </strong>
            </div>


            <div>
  <Trophy size={18} />

  <span>
    Total Amount
  </span>

  <strong>
    {Number(
      game.prizePool || 0
    ).toLocaleString()}{" "}
    ETB
  </strong>
</div>


<div>
  <Trophy size={18} />

  <span>
    Prize
  </span>

  <strong>
    {Number(
      game.prizeAmount ??
      game.prizePool ??
      0
    ).toLocaleString()}{" "}
    ETB
  </strong>
</div>


<div>
  <Clock size={18} />

  <span>
    Start Time
  </span>

  <strong>
    {game.scheduledStartAt
      ? new Date(
          game.scheduledStartAt
        ).toLocaleString()

      : game.status ===
          "waiting"
      ? "Manual Start"

      : game.startedAt
      ? new Date(
          game.startedAt
        ).toLocaleString()

      : "—"}
  </strong>
</div>


            <div>
              <Trophy size={18} />

              <span>
                Winning Pattern
              </span>

              <strong>
                {getWinningPatternLabel(
                  game.winningPattern ||
                    "3_lines"
                )}
              </strong>
            </div>


            <div>
              <Clock size={18} />

              <span>
                Numbers Called
              </span>

              <strong>
                {game.calledNumbers
                  ?.length || 0}
                {" / 75"}
              </strong>
            </div>
            <div>

  <Gamepad2 size={18} />

  <span>
    Number Calling
  </span>

  <strong>
    {game.callMode ===
    "manual"
      ? "Manual"
      : "Automatic"}
  </strong>

</div>

          </div>

        ) : (

          /* EDIT FORM */

          <form
            onSubmit={
              handleSave
            }
            className="admin-game-edit-form"
          >

            <div className="admin-form-group">

              <label>
                Game Name
              </label>

              <input
                type="text"
                value={
                  form.name
                }
                onChange={(
                  event
                ) =>
                  setForm({
                    ...form,
                    name:
                      event
                        .target
                        .value,
                  })
                }
              />

            </div>
            <div className="admin-form-group">

  <label>
    Players Joined
  </label>

  <input
    type="text"

    value={`${game?.currentPlayers || 0} / ${
      game?.maxPlayers || 0
    }`}

    disabled
  />

  <small>
    This value is updated
    automatically when players join.
  </small>

</div>
<div className="admin-form-group">

  <label>
    Total Amount
  </label>

  <input
    type="text"

    value={`${Number(
      game?.prizePool || 0
    ).toLocaleString()} ETB`}

    disabled
  />

  <small>
    Total collected entry amount.
  </small>

</div>
<div className="admin-form-group">

  <label>
    Prize Amount
  </label>

  <input
    type="number"

    min="0"

    value={
      form.prizeAmount
    }

    onChange={(e) =>
      setForm({
        ...form,

        prizeAmount:
          e.target.value,
      })
    }

    placeholder="Automatic"
  />

  <small>
    Leave empty to use the
    total collected amount.
  </small>

</div>
<div className="admin-form-group">

  <label>
    Start Time
  </label>

  <input
    type="datetime-local"

    value={
      form.scheduledStartAt
    }

    onChange={(e) =>
      setForm({
        ...form,

        scheduledStartAt:
          e.target.value,
      })
    }
  />

  <small>
    Leave empty for manual
    Admin start.
  </small>

</div>


            <div className="admin-form-group">

              <label>
                Entry Fee
              </label>

              <input
  type="number"
  min="0"

  value={
    form.entryFee
  }

  disabled={
    Number(
      game.currentPlayers || 0
    ) > 0
  }

  onChange={(event) =>
    setForm({
      ...form,

      entryFee:
        event.target.value,
    })
  }
/>
{Number(
  game.currentPlayers || 0
) > 0 && (

  <small>
    Entry fee cannot be changed
    after players have joined.
  </small>

)}

            </div>


            <div className="admin-form-group">

              <label>
                Maximum Players
              </label>

              <input
                type="number"
                min="1"
                value={
                  form.maxPlayers
                }
                onChange={(
                  event
                ) =>
                  setForm({
                    ...form,
                    maxPlayers:
                      event
                        .target
                        .value,
                  })
                }
              />

            </div>


            <div className="admin-form-group">

              <label>
                Winning Pattern
              </label>

              <select
                value={
                  form.winningPattern
                }
                onChange={(
                  event
                ) =>
                  setForm({
                    ...form,
                    winningPattern:
                      event
                        .target
                        .value,
                  })
                }
              >

                {WINNING_PATTERNS.map(
                  (
                    pattern
                  ) => (
                    <option
                      key={
                        pattern.value
                      }
                      value={
                        pattern.value
                      }
                    >
                      {
                        pattern.label
                      }
                    </option>
                  )
                )}

              </select>

            </div>


            <div className="admin-game-edit-actions">

              <button
                type="button"
                onClick={
                  handleCancelEdit
                }
                className="admin-secondary-button"
              >
                <X size={17} />

                Cancel
              </button>


              <button
                type="submit"
                disabled={
                  saving
                }
                className="admin-primary-button"
              >
                <Save
                  size={17}
                />

                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </form>
        )}


        {!canEdit && (
          <div className="admin-game-edit-warning">
            This game is{" "}
            <strong>
              {game.status}
            </strong>
            . Core game settings can
            no longer be edited.
          </div>
        )}

      </div>
    {/* =====================================
    MANUAL NUMBER CALL BOARD
===================================== */}

{game.callMode ===
  "manual" && (

  <div className="admin-game-detail-card admin-manual-call-card">

    <div className="admin-game-detail-card-header admin-manual-call-header">

      <Gamepad2
        size={20}
      />

      <div>

        <strong>
          Manual Number Call
        </strong>

        <span>
          Admin controlled Bingo numbers
        </span>

      </div>

    </div>


    {/* COUNTDOWN */}

    <div className="admin-manual-countdown">

      <div className="admin-manual-countdown-label">
  NEXT CALL
</div>


      <strong
  className={`admin-manual-countdown-value ${
  manualCallReady
    ? "ready"
    : ""
}`}
>
  {String(
    manualCountdown
  ).padStart(
    2,
    "0"
  )}
</strong>


      <div className="admin-manual-countdown-status">

        {game.status ===
        "waiting"
          ? "Start the game to activate manual calling."

          : game.status !==
            "active"
          ? "Game is not active."

          : game.firstWinnerAt
          ? "Winner window open. Number calling is frozen."

          : manualCountdown >
            0
          ? "Wait for the countdown."

          : calledNumbers.length >=
            75
          ? "All 75 numbers have been called."

          : "Choose the next number."}

      </div>

    </div>


    {/* BINGO BOARD */}

    <div className="admin-manual-board-scroll">

      <div className="admin-manual-board">

        {BINGO_NUMBER_ROWS.map(
          (row) => (

            <div
  key={row.letter}
  className="admin-manual-board-row"
>

              {/* LETTER */}

              <div
  className={`admin-manual-letter letter-${row.letter.toLowerCase()}`}
>
  {row.letter}
</div>


              {/* NUMBERS */}

              {row.numbers.map(
                (number) => {

                  const isCalled =
                    calledNumberSet.has(
                      number
                    );


                  const isCalling =
                    callingNumber ===
                    number;


                  return (

                    <button
                      key={
                        number
                      }

                      type="button"

                      onClick={() =>
                        handleManualCall(
                          number
                        )
                      }

                      disabled={
                        isCalled ||
                        isCalling ||
                        !manualCallReady
                      }

                      title={
                        isCalled
                          ? `Number ${number} already called`

                          : manualCallReady
                          ? `Call number ${number}`

                          : `Wait ${manualCountdown} second${
                              manualCountdown ===
                              1
                                ? ""
                                : "s"
                            }`
                      }

                      className={`admin-manual-number ${
  isCalled
    ? "called"
    : ""
} ${
  isCalling
    ? "calling"
    : ""
} ${
  manualCallReady &&
  !isCalled
    ? "ready"
    : ""
}`}
                    >

                      {isCalling
                        ? "..."
                        : number}

                    </button>

                  );

                }
              )}

            </div>

          )
        )}

      </div>

    </div>


    <div className="admin-manual-called-count">
      Called:{" "}
      <strong>
        {calledNumbers.length}
        {" / 75"}
      </strong>
    </div>

  </div>

)}
    </div>
  );
}