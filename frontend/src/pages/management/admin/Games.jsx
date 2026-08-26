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
  const [refreshing, setRefreshing] = useState(false);

  const [status, setStatus] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

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

    name: "",

    entryFee: "",

    maxPlayers: "",

    winningPattern:
      "3_lines",

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
      setError("");

      const response = await getGames(
        status || undefined
      );

      setGames(response?.data || []);
    } catch (err) {
      console.error("Failed to load games:", err);

      setError(
        err?.response?.data?.message ||
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

    if (!form.name.trim()) {
      setError("Game name is required");
      return;
    }

    if (
      form.entryFee === "" ||
      Number(form.entryFee) < 0
    ) {
      setError(
        "Entry fee must be a valid number"
      );
      return;
    }

    if (
      form.maxPlayers === "" ||
      Number(form.maxPlayers) <= 0
    ) {
      setError(
        "Maximum players must be greater than zero"
      );
      return;
    }

    try {
      setCreating(true);

      await createGame({
  name:
    form.name.trim(),

  entryFee:
    Number(form.entryFee),

  maxPlayers:
    Number(form.maxPlayers),

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
});

      setForm({
  name: "",
  entryFee: "",
  maxPlayers: "",
  winningPattern:
    "3_lines",

  prizeAmount: "",

  scheduledStartAt: "",
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
            className="admin-secondary-button"
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

  className="admin-primary-button"

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

                <span
                  className={getStatusClass(
                    game.status
                  )}
                >
                  {game.status}
                </span>

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
                  className="admin-view-button"
                  onClick={() =>
                    window.location.href =
                      `/admin/games/${game._id}`
                  }
                >
                  <Eye size={16} />
                  View
                </button>


                {game.status === "waiting" && (
                  <button
                    type="button"
                    className="admin-start-button"
                    onClick={() =>
                      handleStart(game._id)
                    }
                    disabled={
                      game.currentPlayers <= 0
                    }
                  >
                    <Play size={16} />
                    Start
                  </button>
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


            <form
              onSubmit={handleCreate}
              className="admin-create-game-form"
            >

              <div className="admin-form-group">

                <label>
                  Game Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="Bingo Game #023"
                />

              </div>


              <div className="admin-form-group">

                <label>
                  Entry Fee
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.entryFee}
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
                  Amount in ETB
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
          {pattern.label}
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