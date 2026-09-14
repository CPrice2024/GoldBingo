import { useEffect, useState } from "react";
import {
  RefreshCw,
  Plus,
  Play,
  Eye,
  Gamepad2,
  Users,
  Trophy,
  Clock,
} from "lucide-react";

import {
  getGames,
  createGame,
  startGame,
  cancelGame,
  getAutomaticGameSetting,
  updateAutomaticGameSetting,
} from "../../../api/game.api";

import {
  WINNING_PATTERNS,
  getWinningPatternLabel,
} from "../../../constants/winningPatterns";

export default function AdminGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const generateGameName = () => {
  const letters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const numbers =
    "0123456789";

  let result = "";


  for (let i = 0; i < 3; i++) {
    result +=
      letters[
        Math.floor(
          Math.random() *
            letters.length
        )
      ];
  }


  for (let i = 0; i < 3; i++) {
    result +=
      numbers[
        Math.floor(
          Math.random() *
            numbers.length
        )
      ];
  }


  return result;
};
  const [refreshing, setRefreshing] = useState(false);

  const [status, setStatus] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  /* =========================================
   ERROR DISPLAY TIMER
   Keep error visible for 20 seconds
========================================= */

useEffect(() => {
  if (!error) {
    return;
  }

  const timer = setTimeout(() => {
    setError("");
  }, 20000);

  return () => {
    clearTimeout(timer);
  };
}, [error]);

  const [
  automaticGameEnabled,
  setAutomaticGameEnabled,
] = useState(false);


const [
  automaticGameLoading,
  setAutomaticGameLoading,
] = useState(true);


const [
  automaticGameSaving,
  setAutomaticGameSaving,
] = useState(false);

const [form, setForm] =
  useState({

    /*
     * 1  = Normal
     * -1 = Bonus
     */
    gameType: 1,

    entryFee: "",

    callIntervalSeconds:
  "15",

    maxPlayers: "",

    winningPattern:
      "3_lines",

    callMode:
  "automatic",

    scheduledStartAt:
      "",

    prizeAmount:
      "",

  });

  const loadAutomaticGameSetting =
  async () => {

    try {

      setAutomaticGameLoading(
        true
      );


      const response =
        await getAutomaticGameSetting();


      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to load automatic game setting"
        );
      }


      setAutomaticGameEnabled(
        Boolean(
          response.data?.enabled
        )
      );

    } catch (err) {

      console.error(
        "Failed to load automatic game setting:",
        err
      );


      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load automatic game setting"
      );

    } finally {

      setAutomaticGameLoading(
        false
      );

    }

  };

const loadGames = async () => {
  try {
    const response =
      await getGames(
        status || undefined
      );

    setGames(
      response?.data || []
    );
  } catch (err) {
    console.error(
      "Failed to load games:",
      err
    );

    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load games"
    );
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};


useEffect(() => {
  loadGames();
}, [status]);


useEffect(() => {
  const interval =
    setInterval(() => {
      loadGames();
    }, 2000);

  return () => {
    clearInterval(interval);
  };
}, [status]);

  useEffect(() => {
  loadAutomaticGameSetting();
}, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGames();
  };

  const handleAutomaticGameToggle =
  async () => {

    const nextValue =
      !automaticGameEnabled;


    try {

      setAutomaticGameSaving(
        true
      );

      setError("");


      const response =
        await updateAutomaticGameSetting(
          nextValue
        );


      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update automatic game mode"
        );
      }


      setAutomaticGameEnabled(
        Boolean(
          response.data?.enabled
        )
      );


    } catch (err) {

      console.error(
        "Failed to update automatic game:",
        err
      );


      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update automatic game mode"
      );

    } finally {

      setAutomaticGameSaving(
        false
      );

    }

  };

const handleCreate = async (e) => {
  e.preventDefault();

  setError("");


  /* =========================================
     NORMAL GAME VALIDATION
  ========================================= */

  if (
    Number(form.gameType) !== -1 &&
    (
      form.entryFee === "" ||
      Number(form.entryFee) < 0
    )
  ) {

    setError(
      "Entry fee must be a valid number"
    );

    return;
  }


  /* =========================================
     BONUS GAME VALIDATION
  ========================================= */

  if (
    Number(form.gameType) === -1 &&
    (
      form.prizeAmount === "" ||
      !Number.isFinite(
        Number(
          form.prizeAmount
        )
      ) ||
      Number(
        form.prizeAmount
      ) <= 0
    )
  ) {

    setError(
      "Bonus games require a prize amount greater than zero"
    );

    return;
  }


  /* =========================================
     CALL INTERVAL
  ========================================= */

  if (
    form.callIntervalSeconds === "" ||
    !Number.isFinite(
      Number(
        form.callIntervalSeconds
      )
    ) ||
    Number(
      form.callIntervalSeconds
    ) < 1
  ) {

    setError(
      "Call interval must be at least 1 second"
    );

    return;
  }


  /* =========================================
     MAX PLAYERS
  ========================================= */

  if (
    form.maxPlayers === "" ||
    Number(
      form.maxPlayers
    ) <= 0
  ) {

    setError(
      "Maximum players must be greater than zero"
    );

    return;
  }


  /* =========================================
     CREATE GAME
  ========================================= */

  try {

    setCreating(true);


    const generatedGameName =
      generateGameName();


    await createGame({

      name:
        generatedGameName,

      gameType:
        Number(
          form.gameType
        ) === -1
          ? -1
          : 1,

      entryFee:
        Number(
          form.gameType
        ) === -1
          ? 0
          : Number(
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

      callIntervalSeconds:
        Number(
          form.callIntervalSeconds
        ),

      scheduledStartAt:
        form.scheduledStartAt
          ? new Date(
              form.scheduledStartAt
            ).toISOString()
          : null,

      callMode:
        form.callMode,

    });


    /* =========================================
       RESET FORM
    ========================================= */

    setForm({

      gameType: 1,

      entryFee: "",

      maxPlayers: "",

      winningPattern:
        "3_lines",

      prizeAmount: "",

      scheduledStartAt: "",

      callMode:
        "automatic",

      callIntervalSeconds:
        "15",

    });


    setShowCreate(false);


    await loadGames();

  } catch (err) {

    console.error(
      "Failed to create game:",
      err
    );


    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to create game"
    );

  } finally {

    setCreating(false);

  }
};

  const handleStart = async (gameId) => {
    const confirmed = window.confirm(
      "Are you sure you want to start this game?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await startGame(gameId);

      await loadGames();
    } catch (err) {
      console.error(
        "Failed to start game:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to start game"
      );
    }
  };

const handleCancelGame =
  async (gameId) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this game?"
      );

    if (!confirmed) {
      return;
    }

    try {

      setError("");

      await cancelGame(
        gameId
      );

      await loadGames();

    } catch (err) {

      console.error(
        "Failed to cancel game:",
        err
      );

      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          "Failed to cancel game"
      );

    }

  };

  const getStatusClass = (gameStatus) => {
    switch (gameStatus) {
      case "active":
        return "game-status active";

      case "waiting":
        return "game-status waiting";

      case "completed":
        return "game-status completed";

      case "cancelled":
        return "game-status cancelled";

      default:
        return "game-status";
    }
  };

  return (
    <div className="admin-games-page">

      {/* Header */}
      <div className="admin-games-header">
        <div>
          <h1>Games</h1>

          <p>
            Manage games.
          </p>
        </div>

        <div className="admin-games-actions">

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            class="management-refresh-button"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "admin-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
  type="button"

  onClick={() =>
    setShowCreate(true)
  }

  class="management-refresh-button"

  disabled={
    automaticGameEnabled ||
    automaticGameLoading
  }

  title={
    automaticGameEnabled
      ? "Turn Automatic Game Mode OFF to create games manually."
      : "Create a new Bingo game"
  }
>
  <Plus size={18} />

  {automaticGameEnabled
    ? "Automatic Mode"
    : "Create Game"}
</button>

        </div>
      </div>


      {/* Error */}
      {error && (
        <div className="admin-games-error">
          {error}
        </div>
      )}

      {/* =====================================
    AUTOMATIC GAME MODE
===================================== */}

<div
  className={`admin-auto-game-card ${
    automaticGameEnabled
      ? "enabled"
      : "disabled"
  }`}
>

  <div className="admin-auto-game-info">

    <div
      className={`admin-auto-game-indicator ${
        automaticGameEnabled
          ? "on"
          : "off"
      }`}
    />

    <div>

      <strong>
        Automatic Game Mode
      </strong>

      <span>
        {automaticGameEnabled
          ? "Games are automatically created after each completed game."
          : "Automatic games are disabled. Admin must create games manually."}
      </span>

    </div>

  </div>


  {automaticGameLoading ? (

    <span className="admin-auto-game-loading">
      Loading...
    </span>

  ) : (

    <div className="admin-auto-game-control">

      <strong>
        {automaticGameEnabled
          ? "ON"
          : "OFF"}
      </strong>


      <button
        type="button"
        className={`admin-auto-game-switch ${
          automaticGameEnabled
            ? "active"
            : ""
        }`}
        onClick={
          handleAutomaticGameToggle
        }
        disabled={
          automaticGameSaving
        }
        aria-label="Toggle automatic game mode"
      >

        <span />

      </button>

    </div>

  )}

</div>


      {/* Filter */}
      <div className="admin-games-toolbar">

        <div className="admin-games-filter">

          <label>
            Game Status
          </label>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
          >
            <option value="">
              All Games
            </option>

            <option value="waiting">
              Waiting
            </option>

            <option value="active">
              Active
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

        </div>

      </div>


      {/* Games */}
      {loading ? (
        <div className="admin-games-loading">
          Loading games...
        </div>
      ) : games.length === 0 ? (
        <div className="admin-games-empty">

          <Gamepad2 size={42} />

          <h3>
            No games found
          </h3>

          <p>
            There are no games matching
            your current filter.
          </p>

        </div>
      ) : (
        <div className="admin-games-grid">

          {games.map((game) => (
            <div
              key={game._id}
              className="admin-game-card"
            >

              {/* Card header */}
              <div className="admin-game-card-header">

  <div className="admin-game-icon">
    <Gamepad2 size={20} />
  </div>

  <div className="admin-game-card-badges">

    <span
      className={`admin-game-type-badge ${
        Number(
          game.gameType ?? 1
        ) === -1
          ? "bonus"
          : "normal"
      }`}
    >
      {Number(
        game.gameType ?? 1
      ) === -1
        ? "BONUS"
        : "NORMAL"}
    </span>

    <span
      className={getStatusClass(
        game.status
      )}
    >
      {game.status}
    </span>

  </div>

</div>


              {/* Game name */}
              <h2>
                {game.name}
              </h2>


              {/* Game information */}
              <div className="admin-game-info">

                <div>
                  <Users size={16} />

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
  <Trophy size={16} />

  <span>
    Total Amount
  </span>

  <strong>
    {Number(
      game.prizePool || 0
    ).toLocaleString()}{" "}
    Birr
  </strong>
</div>


<div>
  <Trophy size={16} />

  <span>
    Prize
  </span>

  <strong>
    {Number(
      game.prizeAmount ??
        game.prizePool ??
        0
    ).toLocaleString()}{" "}
    Birr
  </strong>
</div>


<div>
  <Clock size={16} />

  <span>
    Start Time
  </span>

  <strong>
    {game.scheduledStartAt
      ? new Date(
          game.scheduledStartAt
        ).toLocaleString()

      : game.status === "waiting"
      ? "Manual Start"

      : game.startedAt
      ? new Date(
          game.startedAt
        ).toLocaleString()

      : "—"}
  </strong>
</div>

                <div>
  <Gamepad2 size={16} />

  <span>
    Entry Fee
  </span>

  <strong>
    {game.entryFee} ETB
  </strong>
</div>

<div>
  <Trophy size={16} />

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
  <Clock size={16} />

  <span>
    Numbers Called
  </span>
  <div>
  <Gamepad2 size={16} />

  <span>
    Number Calling
  </span>

  <strong>
    {game.callMode === "manual"
      ? "Manual"
      : "Automatic"}
  </strong>
</div>

<div>

  <Clock size={18} />

  <span>
    Call Interval
  </span>

  <strong>
    {Number(
      game.callIntervalSeconds ??
        15
    )}{" "}
    {Number(
      game.callIntervalSeconds ??
        15
    ) === 1
      ? "Second"
      : "Seconds"}
  </strong>

</div>

  <strong>
    {game.calledNumbers?.length || 0}
    {" / 75"}
  </strong>
</div>

              </div>

              {/* Actions */}
              <div className="admin-game-card-actions">

                <button
                  type="button"
                  class="management-refresh-button"
                  onClick={() =>
                    window.location.href =
                      `/admin/games/${game._id}`
                  }
                >
                  <Eye size={16} />
                  View
                </button>


                {game.status === "waiting" && (
  <>
    <button
      type="button"
      className="management-refresh-button"
      onClick={() =>
        handleStart(
          game._id
        )
      }
      disabled={
        game.currentPlayers <= 0
      }
      title={
        game.currentPlayers <= 0
          ? "At least one player must join before the game can start."
          : "Start game"
      }
    >
      <Play size={16} />
      Start
    </button>

    {Number(
      game.currentPlayers || 0
    ) === 0 && (
      <button
        type="button"
        className="management-refresh-button"
        onClick={() =>
          handleCancelGame(
            game._id
          )
        }
      >
        Cancel Game
      </button>
    )}
  </>
)}

              </div>

            </div>
          ))}

        </div>
      )}


      {/* Create Game Modal */}
      {showCreate && (
        <div
          className="admin-modal-overlay"
          onClick={() =>
            setShowCreate(false)
          }
        >

          <div
            className="admin-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="admin-modal-header">

              <div>
                <h2>
                  Create Bingo Game
                </h2>

                <p>
                  Configure a new game.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="admin-modal-close"
              >
                ×
              </button>

            </div>
            {error && (
  <div className="admin-games-error">
    {error}
  </div>
)}


            <form
              onSubmit={handleCreate}
              className="admin-create-game-form"
            >
              <div className="admin-form-group">

  <label>
    Game Type
  </label>

  <select
  
    className="admin-winning-pattern-select"
    value={
      form.gameType
    }
    onChange={(e) => {

      const nextGameType =
        Number(
          e.target.value
        );

      setForm({
        ...form,

        gameType:
          nextGameType,

        /*
         * Bonus cards are free.
         */
        entryFee:
          nextGameType === -1
            ? "0"
            : form.entryFee === "0"
            ? ""
            : form.entryFee,
      });

    }}
  >

    <option value={1}>
      Normal Game
    </option>

    <option value={-1}>
      Bonus Game
    </option>

  </select>

  <small>
    Bonus games allow only
    2 free cards per player.
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
    Number(
      form.gameType
    ) === -1
      ? 0
      : form.entryFee
  }

  disabled={
    Number(
      form.gameType
    ) === -1
  }

  onChange={(e) =>
    setForm({
      ...form,

      entryFee:
        e.target.value,
    })
  }

  placeholder="20"
/>

                <small>
  {Number(
    form.gameType
  ) === -1
    ? "Bonus game cards are free."
    : "Amount in ETB"}
</small>

              </div>


              <div className="admin-form-group">

                <label>
                  Maximum Players
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.maxPlayers}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxPlayers:
                        e.target.value,
                    })
                  }
                  placeholder="500"
                />

              </div>
              <div className="admin-form-group">

  <label>
    Call Number Interval
  </label>

  <input
    type="number"
    min="1"
    step="1"

    value={
      form.callIntervalSeconds
    }

    onChange={(e) =>
      setForm({
        ...form,

        callIntervalSeconds:
          e.target.value,
      })
    }

    placeholder="5"
  />

  <small>
    Seconds between each
    Bingo number.
  </small>

</div>
              <div className="admin-form-group">

  <label>
    Number Call Mode
  </label>


  <div className="admin-auto-game-control">

    <div>
      <strong>
        {form.callMode ===
        "manual"
          ? "Manual Call"
          : "Automatic Call"}
      </strong>

      <small
        style={{
          display: "block",
          marginTop: "4px",
        }}
      >
        {form.callMode ===
        "manual"
          ? "Admin chooses each Bingo number."
          : "System automatically chooses each Bingo number."}
      </small>
    </div>


    <button
      type="button"

      className={`admin-auto-game-switch ${
        form.callMode ===
        "manual"
          ? "active"
          : ""
      }`}

      onClick={() =>
        setForm(
          (current) => ({
            ...current,

            callMode:
              current.callMode ===
              "manual"
                ? "automatic"
                : "manual",
          })
        )
      }

      aria-label="Toggle manual number calling"
    >
      <span />
    </button>

  </div>

</div>

              <div className="admin-form-group">

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
    collected amount as prize.
  </small>

</div>
{!automaticGameEnabled && (

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
      Optional. Leave empty
      for manual Admin start.
    </small>

  </div>

)}

  <label>
    Winning Pattern
  </label>

  <select
    className="admin-winning-pattern-select"
    value={
      form.winningPattern
    }
    onChange={(e) =>
      setForm({
        ...form,
        winningPattern:
          e.target.value,
      })
    }
  >
    {WINNING_PATTERNS.map(
  (pattern) => (
    <option
      key={pattern.value}
      value={pattern.value}
    >
      {getWinningPatternLabel(
        pattern.value
      )}
    </option>
  )
)}
  </select>

  <small>
    የጨዋታ ዓይነት
  </small>

</div>


              <div className="admin-modal-actions">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                  className="admin-secondary-button"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="admin-primary-button"
                >
                  {creating
                    ? "Creating..."
                    : "Create Game"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}