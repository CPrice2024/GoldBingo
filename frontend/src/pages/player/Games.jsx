import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Gamepad2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getGames,
} from "../../api/games.api";

import GameCard from "../../components/game/GameCard";

import "../../styles/game.css";


function Games() {
  const navigate =
    useNavigate();

  const [games, setGames] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [error, setError] =
    useState("");


  const fetchGames =
    useCallback(
      async (
        showRefresh = false
      ) => {
        try {
          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const response =
            await getGames();

          setGames(
            response.data || []
          );

        } catch (err) {
          console.error(
            "Failed to load games:",
            err
          );

          setError(
            err.response?.data
              ?.message ||
              "Failed to load games"
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );


  useEffect(() => {
    fetchGames();
  }, [fetchGames]);


  /*
   * Do NOT join here.
   *
   * Player first enters
   * GameRoom and chooses
   * how many cards to buy.
   */
  const handleJoin = (
    game
  ) => {
    navigate(
      `/player/game/${game._id}`
    );
  };


  if (loading) {
    return (
      <div className="games-page">

        <div className="games-loading">

          <RefreshCw
            size={20}
            className="spin"
          />

          <span>
            Loading available games...
          </span>

        </div>

      </div>
    );
  }


  return (
    <div className="games-page">

      {/* HEADER */}
      <div className="games-header">

        <div className="games-header-content">

          <div className="games-header-icon">
            <Gamepad2 size={24} />
          </div>

          <div>

            <h1>
              Games
            </h1>

            <p>
              Join a live game and
              compete for the prize pool.
            </p>

          </div>

        </div>


        <button
          type="button"
          className="games-refresh-btn"
          onClick={() =>
            fetchGames(true)
          }
          disabled={refreshing}
        >

          <RefreshCw
            size={17}
            className={
              refreshing
                ? "spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>


      {/* ERROR */}
      {error && (
        <div className="games-error">

          <AlertCircle
            size={19}
          />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              fetchGames()
            }
          >
            Try Again
          </button>

        </div>
      )}


      {/* EMPTY */}
      {!error &&
        games.length === 0 && (

          <div className="games-empty">

            <div className="games-empty-icon">
              <Gamepad2
                size={42}
              />
            </div>

            <h2>
              No games available
            </h2>

            <p>
              There are currently no
              Bingo games available
              to join.
            </p>

            <button
              type="button"
              onClick={() =>
                fetchGames(true)
              }
            >

              <RefreshCw
                size={17}
              />

              Refresh Games

            </button>

          </div>
        )}


      {/* GAMES */}
      {games.length > 0 && (

        <div className="games-grid">

          {games.map(
            (game) => (

              <GameCard
                key={game._id}
                game={game}
                onJoin={
                  handleJoin
                }
                joining={false}
              />

            )
          )}

        </div>

      )}

    </div>
  );
}


export default Games;