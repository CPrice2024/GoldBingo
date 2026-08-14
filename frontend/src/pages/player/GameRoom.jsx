import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  RefreshCw,
  Trophy,
  Users,
  Coins,
  AlertCircle,
  Radio,
  X,
  Plus,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getGameById,
  getGameState,
  checkBingo,
  claimBingo,
} from "../../api/games.api";

import {
  getMyGamePlayer,
  joinGame,
} from "../../api/gamePlayers.api";

import BingoCard from "../../components/game/BingoCard";

import "../../styles/game.css";
const EMPTY_NUMBERS = [];

function GameRoom() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [gamePlayer, setGamePlayer] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [checking, setChecking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [joining, setJoining] = useState(false);

  const [cardOpen, setCardOpen] = useState(false);
const [cardNotification, setCardNotification] = useState("");
const [bingoMatched, setBingoMatched] = useState(false);

  const pattern = "row";
  

  /* =========================================
     LOAD GAME
  ========================================= */

const fetchGame = useCallback(
  async (showRefresh = false) => {
    if (!gameId) return;

    try {
      if (showRefresh) {
        setRefreshing(true);
      }

      setError("");

      // =========================================
      // 1. GET GLOBAL GAME INFORMATION
      // Works whether player joined or not
      // =========================================

      const gameResponse =
        await getGameById(gameId);

      if (!gameResponse?.success) {
        throw new Error(
          gameResponse?.message ||
            "Game could not be found"
        );
      }

      const nextGame =
        gameResponse.data;

      if (!nextGame?._id) {
        throw new Error(
          "Invalid game response"
        );
      }

      // Global game information
      setGame(nextGame);

      // =========================================
      // 2. GET LIVE GAME STATE
      // =========================================

      try {
        const stateResponse =
          await getGameState(gameId);

        console.log(
          "🔥 GAME:",
          nextGame
        );

        console.log(
          "🔥 GAME STATE:",
          stateResponse
        );

        if (stateResponse?.success) {
          setGameState(
            stateResponse.data || null
          );
        }
      } catch (stateError) {
        console.error(
          "Failed to load live game state:",
          stateError
        );

        // Don't destroy the global game
        // if only live state fails.
      }

      // =========================================
      // 3. PLAYER PARTICIPATION
      // Separate from global game
      // =========================================

      try {
        const playerResponse =
          await getMyGamePlayer(gameId);

        if (playerResponse?.success) {
          setGamePlayer(
            playerResponse.data || null
          );
        } else {
          setGamePlayer(null);
        }
      } catch (playerError) {
  if (playerError?.response?.status === 404) {
    // Player has not joined this game yet.
    setGamePlayer(null);
  } else {
    console.error(
      "Failed to load player participation:",
      playerError?.response?.data || playerError
    );
  }
}
      } catch (err) {
        console.error(
          "Failed to load game:",
          err.response?.data || err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load game"
        );
      } finally {
        setRefreshing(false);
      }


  },
  [gameId]
);

  /* =========================================
     INITIAL LOAD
  ========================================= */

 useEffect(() => {
  let cancelled = false;

  const loadInitialGame = async () => {
    if (!gameId) return;

    setLoading(true);

    try {
      await fetchGame(false);
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  loadInitialGame();

  return () => {
    cancelled = true;
  };
}, [gameId, fetchGame]);

  /* =========================================
     LIVE POLLING
  ========================================= */

  useEffect(() => {
    if (!gameId) return;

    const interval = setInterval(() => {
      fetchGame(true);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [gameId, fetchGame]);

  /* =========================================
     CALLED NUMBERS
  ========================================= */

const calledNumbers =
  gameState?.calledNumbers ??
  game?.calledNumbers ??
  EMPTY_NUMBERS;

  const calledSet = useMemo(
    () => new Set(calledNumbers),
    [calledNumbers]
  );

  const latestNumber =
    calledNumbers.length > 0
      ? calledNumbers[
          calledNumbers.length - 1
        ]
      : null;

  /* =========================================
     BINGO BOARD
  ========================================= */

  const bingoRows = useMemo(
    () => [
      {
        letter: "B",
        start: 1,
        end: 15,
      },
      {
        letter: "I",
        start: 16,
        end: 30,
      },
      {
        letter: "N",
        start: 31,
        end: 45,
      },
      {
        letter: "G",
        start: 46,
        end: 60,
      },
      {
        letter: "O",
        start: 61,
        end: 75,
      },
    ],
    []
  );

  /* =========================================
     PLAYER CARD
  ========================================= */

  const card =
    gamePlayer?.cardId;

  const isJoined =
    Boolean(card);

  /* =========================================
     JOIN GAME
  ========================================= */

  const handleJoinGame = async () => {
    if (!gameId) return;

    try {
      setJoining(true);
      setError("");
      setMessage("");

      const response =
        await joinGame(gameId);

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to join game"
        );
      }

      setMessage(
        "You joined the game."
      );

      await fetchGame(true);

      setCardOpen(true);
    } catch (err) {
  console.log(
    "========== JOIN GAME ERROR =========="
  );

  console.log(
    "STATUS:",
    err.response?.status
  );

  console.log(
    "BACKEND RESPONSE:",
    err.response?.data
  );

  console.log(
    "BACKEND MESSAGE:",
    err.response?.data?.message
  );

  console.log(
    "REQUEST:",
    err.config?.url,
    err.config?.data
  );

  console.log(
    "====================================="
  );

  setError(
    err.response?.data?.message ||
      err.message ||
      "Failed to join game"
  );
} finally {
      setJoining(false);
    }
  };

  /* =========================================
     CHECK BINGO
  ========================================= */

 const handleCheckBingo = async () => {
  if (!gamePlayer?.cardId) {
    setCardNotification("You must join the game first.");
    return;
  }

  try {
    setChecking(true);
    setCardNotification("");
    setError("");

    const response = await checkBingo(
      gameId,
      pattern
    );

    if (response.data?.hasBingo) {
      setBingoMatched(true);

      setCardNotification(
        "🎉 BINGO! Winning pattern found. claim now"
      );
    } else {
      setBingoMatched(false);

      setCardNotification(
        "No Bingo yet. Keep watching the game."
      );
    }
  } catch (err) {
    setBingoMatched(false);

    setCardNotification(
      err.response?.data?.message ||
        "Failed to check Bingo"
    );
  } finally {
    setChecking(false);
  }
};

  /* =========================================
     CLAIM BINGO
  ========================================= */

const handleClaimBingo = async () => {
  if (!gamePlayer?.cardId) {
    setMessage("You must join the game first.");
    return;
  }

  try {
    setClaiming(true);
    setMessage("");
    setError("");

    console.log("1️⃣ CLAIM START");

    const response = await claimBingo(
      gameId,
      pattern
    );

    console.log("2️⃣ CLAIM RESPONSE:", response);
    console.log("3️⃣ CLAIM SUCCESS:", response?.success);
    console.log("4️⃣ TOKEN BEFORE NAVIGATION:",
      localStorage.getItem("accessToken")
    );

    // TEMPORARY TEST
    // Do NOT navigate yet
    setMessage("🎉 Bingo claimed successfully!");

    console.log("5️⃣ CLAIM FINISHED - NOT NAVIGATING");

    /*
    navigate(
      `/player/game/${gameId}/result`,
      {
        state: response.data,
      }
    );
    */

  } catch (err) {
    console.error("❌ CLAIM ERROR:", err);

    console.log(
      "STATUS:",
      err.response?.status
    );

    console.log(
      "RESPONSE:",
      err.response?.data
    );

    setError(
      err.response?.data?.message ||
      "Failed to claim Bingo"
    );

  } finally {
    setClaiming(false);
  }
};

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="bingo-mobile-page">
        <div className="bingo-loading">
          <RefreshCw
            size={20}
            className="spin"
          />
          Loading Bingo...
        </div>
      </div>
    );
  }

  /* =========================================
     ERROR
  ========================================= */

  if (error && !game) {
    return (
      <div className="bingo-mobile-page">
      </div>
    );
  }

  if (!game) {
  return (
    <div className="bingo-mobile-page no-game-page">
      <div className="no-game-card">

        <div className="no-game-icon">
          <Trophy size={42} />
        </div>

        <h1>
          No Active <span>Game</span>
        </h1>

        <p className="no-game-subtitle">
          There is no active Bingo game available right now.
        </p>

        <div className="no-game-divider">
          <span />
          <Trophy size={18} />
          <span />
        </div>

        <div className="no-game-info">
          <div className="no-game-info-icon">
            <AlertCircle size={20} />
          </div>

          <div>
            <strong>No game is currently running</strong>
            <p>
              A new Bingo game will be created automatically.
              Please check again shortly.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="no-game-retry-button"
          onClick={() => fetchGame(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={18}
            className={refreshing ? "spin" : ""}
          />

          {refreshing ? "Checking..." : "Try Again"}
        </button>

        <div className="no-game-footer">
          <Radio size={18} />

          <span>
            New games are created automatically
          </span>
        </div>

      </div>
    </div>
  );
}

  return (
    <div className="bingo-mobile-page">

      {/* =====================================
          TOP BAR
      ====================================== */}

   


      {/* =====================================
          GAME INFO
      ====================================== */}

      <section className="bingo-game-info">

        <div className="bingo-game-info-main">

          <div className="bingo-live-icon">
            <Radio size={18} />
          </div>

          <div>
            <strong>
              {game.name}
            </strong>

            <span>
              {game.status === "active"
                ? "Game is Playing"
                : game.status === "waiting"
                ? "Waiting to Start"
                : "Game Completed"}
            </span>
          </div>

        </div>


        <div className="bingo-info-stats">

          <div>
            <Coins size={16} />

            <span>Price</span>

            <strong>
              {game.entryFee} ETB
            </strong>
          </div>

          <div>
            <Trophy size={16} />

            <span>Prize</span>

            <strong>
              {game.prizePool} ETB
            </strong>
          </div>

        </div>

      </section>


      {/* =====================================
          ERROR
      ====================================== */}

      {error && (
        <div className="bingo-inline-error">
          <AlertCircle size={17} />
          {error}
        </div>
      )}


      {/* =====================================
          MESSAGE
      ====================================== */}

      {message && (
        <div className="bingo-inline-message">
          {message}
        </div>
      )}


      {/* =====================================
          DRAWN
      ====================================== */}

      <section className="bingo-drawn-section">

        <div className="bingo-drawn-label">
          DRAWN
        </div>

        <div className="bingo-drawn-number">
          {latestNumber ?? "--"}
        </div>

        <div className="bingo-drawn-count">
          {calledNumbers.length} / 75
        </div>

      </section>


      {/* =====================================
          BINGO 1-75 BOARD
      ====================================== */}

      <section className="bingo-board-card">

        <div className="bingo-board-title">
          <strong>
            BINGO
          </strong>

          <span>
            {calledNumbers.length === 0
              ? "Waiting..."
              : `${calledNumbers.length} numbers called`}
          </span>
        </div>


        <div className="bingo-board">

          {bingoRows.map(
            (row) => (
              <div
                key={row.letter}
                className="bingo-board-row"
              >

                {/* LETTER */}

                <div
                  className={[
                    "bingo-letter",
                    `bingo-letter-${row.letter.toLowerCase()}`,
                  ].join(" ")}
                >
                  {row.letter}
                </div>


                {/* NUMBERS */}

                {Array.from(
                  {
                    length:
                      row.end -
                      row.start +
                      1,
                  },
                  (_, index) => {
                    const number =
                      row.start +
                      index;

                    const called =
                      calledSet.has(
                        number
                      );

                    const latest =
                      number ===
                      latestNumber;

                    return (
                      <div
                        key={number}
                        className={[
                          "bingo-board-number",
                          called
                            ? "called"
                            : "",
                          latest
                            ? "latest"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {number}
                      </div>
                    );
                  }
                )}

              </div>
            )
          )}

        </div>

      </section>


      {/* =====================================
          LAST CALLED
      ====================================== */}

      {calledNumbers.length > 0 && (
        <section className="bingo-called-history">

          <div className="bingo-history-header">
            <span>
              Called
            </span>

            <strong>
              {calledNumbers.length}
            </strong>
          </div>

          <div className="bingo-history-list">

            {[...calledNumbers]
              .reverse()
              .slice(0, 15)
              .map(
                (number, index) => (
                  <span
                    key={`${number}-${index}`}
                    className={
                      index === 0
                        ? "history-latest"
                        : ""
                    }
                  >
                    {number}
                  </span>
                )
              )}

          </div>

        </section>
      )}


      {/* =====================================
          FIXED CARD BUTTON
      ====================================== */}

      <button
        type="button"
        className="bingo-fixed-card-button"
        onClick={() =>
          setCardOpen(true)
        }
      >
        <span className="bingo-fixed-plus">
          <Plus size={22} />
        </span>

        <span>
          {isJoined
            ? "My Card"
            : "Join Game"}
        </span>
      </button>


      {/* =====================================
          CARD / JOIN MODAL
      ====================================== */}

      {cardOpen && (
        <div
          className="bingo-modal-overlay"
          onClick={() =>
            setCardOpen(false)
          }
        >

          <div
            className="bingo-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="bingo-modal-header">

              <div>
                <strong>
                  {isJoined
                    ? "My Card"
                    : "Join Bingo"}
                </strong>

                <span>
                  {isJoined
                    ? card?.cardNumber
                    : game.name}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCardOpen(false)
                }
                className="bingo-modal-close"
              >
                <X size={20} />
              </button>

            </div>


            {/* =================================
                JOINED
            ================================== */}

            {isJoined ? (

              <>

                {cardNotification && (
  <div
    className={`bingo-card-notification ${
      bingoMatched
        ? "bingo-card-notification-win"
        : ""
    }`}
  >
    {cardNotification}
  </div>
)}

<div className="bingo-player-card">
  <BingoCard
                    numbers={card.numbers}
                    calledNumbers={
                      calledNumbers
                    }
                  />

                </div>


                <div className="bingo-card-actions">

                  <button
                    type="button"
                    onClick={
                      handleCheckBingo
                    }
                    disabled={
                      checking ||
                      game.status !==
                        "active"
                    }
                    className="bingo-check-button"
                  >
                    {checking
                      ? "Checking..."
                      : "Check now"}
                  </button>


                  <button
                    type="button"
                    onClick={
                      handleClaimBingo
                    }
                   disabled={
  claiming ||
  !bingoMatched ||
  game.status !== "active"
}
                    className="bingo-claim-button"
                  >
                    {claiming
  ? "Claiming..."
  : bingoMatched
  ? "🏆 Claim Bingo"
  : "Check Bingo First"}
                  </button>

                </div>

              </>

            ) : (

              /* =================================
                 NOT JOINED
              ================================== */

              <div className="bingo-join-panel">

                <div className="bingo-join-plus">
                  <Plus size={32} />
                </div>

                <h3>
                  Join This Game
                </h3>

                <p>
                  Join the game to receive
                  your Bingo card.
                </p>


                <div className="bingo-join-details">

                  <div>
                    <span>
                      Entry
                    </span>

                    <strong>
                      {game.entryFee} ETB
                    </strong>
                  </div>

                  <div>
                    <span>
                      Players
                    </span>

                    <strong>
                      {game.currentPlayers}/
                      {game.maxPlayers}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Prize
                    </span>

                    <strong>
                      {game.prizePool} ETB
                    </strong>
                  </div>

                </div>


                {game.status ===
                "waiting" ? (

                  <button
                    type="button"
                    className="bingo-join-button"
                    onClick={
                      handleJoinGame
                    }
                    disabled={joining}
                  >
                    {joining
                      ? "Joining..."
                      : `Join for ${game.entryFee} ETB`}
                  </button>

                ) : game.status ===
                  "active" ? (

                  <div className="bingo-watch-only">

                    <Radio size={20} />

                    <strong>
                      Game Already Started
                    </strong>

                    <span>
                      You can watch the
                      live game.
                    </span>

                  </div>

                ) : (

                  <div className="bingo-watch-only">

                    <strong>
                      Game Completed
                    </strong>

                    <span>
                      Wait for the next game.
                    </span>

                  </div>

                )}

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default GameRoom;