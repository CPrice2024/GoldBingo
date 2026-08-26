import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Gamepad2,
} from "lucide-react";
import sadRobot from "../../assets/sad-gold-bingo-robot.png.png";
import { getCurrentGame } from "../../api/games.api";

export default function Play() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

const openCurrentGame = useCallback(
  async (showLoading = true) => {

    try {

      if (showLoading) {
        setLoading(true);
        setError("");
      }

      const response =
        await getCurrentGame();

      const game =
        response?.data;


      if (!game?._id) {

        setError(
          "No Bingo game available"
        );

        return;
      }


      console.log(
        "Current Bingo game:",
        game
      );


      navigate(
        `/player/game/${game._id}`,
        {
          replace: true,
        }
      );


    } catch (err) {

      console.error(
        "Failed to open current game:",
        err
      );


      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No Bingo game available"
      );


    } finally {

      if (showLoading) {
        setLoading(false);
      }

    }

  },
  [navigate]
);

useEffect(() => {

  openCurrentGame(true);

}, [openCurrentGame]);

/* =====================================================
   AUTO CHECK FOR NEXT GAME
===================================================== */

useEffect(() => {

  const interval =
    setInterval(() => {

      openCurrentGame(false);

    }, 3000);


  return () => {

    clearInterval(interval);

  };

}, [openCurrentGame]);

  /* =====================================================
     LOADING SKELETON
     ===================================================== */

  if (loading) {
    return (
      <div className="play-page-skeleton">

        <div className="skeleton-header">
          <div className="skeleton-icon skeleton-pulse" />

          <div className="skeleton-header-text">
            <div className="skeleton-line skeleton-title skeleton-pulse" />
            <div className="skeleton-line skeleton-subtitle skeleton-pulse" />
          </div>
        </div>

        <div className="skeleton-game-card">

          <div className="skeleton-game-top">

            <div className="skeleton-game-icon skeleton-pulse" />

            <div className="skeleton-game-info">
              <div className="skeleton-line skeleton-game-title skeleton-pulse" />
              <div className="skeleton-line skeleton-game-subtitle skeleton-pulse" />
            </div>

            <div className="skeleton-status skeleton-pulse" />

          </div>

          <div className="skeleton-stats">

            <div className="skeleton-stat skeleton-pulse">
              <div className="skeleton-stat-small" />
              <div className="skeleton-stat-large" />
            </div>

            <div className="skeleton-stat skeleton-pulse">
              <div className="skeleton-stat-small" />
              <div className="skeleton-stat-large" />
            </div>

            <div className="skeleton-stat skeleton-pulse">
              <div className="skeleton-stat-small" />
              <div className="skeleton-stat-large" />
            </div>

          </div>

          <div className="skeleton-content skeleton-pulse" />

          <div className="skeleton-content-small skeleton-pulse" />

          <div className="skeleton-button skeleton-pulse" />

        </div>

        <div className="skeleton-loading-message">

          <RefreshCw
            size={18}
            className="spin"
          />

          <span>
            Checking for an available Bingo game...
          </span>

        </div>

      </div>
    );
  }

 /* =====================================================
   NO GAME
===================================================== */

return (

  <div className="play-page">

    <div className="play-empty-state">

      <div className="play-robot-wrapper">

        <div className="play-robot-glow" />

        <img
          src={sadRobot}
          alt="No Bingo game available"
          className="play-sad-robot"
        />

      </div>


      <div className="play-empty-content">


        <p>
          No Bingo Game Available
        </p>



        <div className="play-waiting-status">

          <div className="play-waiting-dots">
            <span />
            <span />
            <span />
          </div>

          <span>
            Waiting for the next game...
          </span>

        </div>


        <button
          type="button"
          className="play-refresh-button"
          onClick={() =>
            openCurrentGame(true)
          }
        >

          <RefreshCw size={17} />

          Check Again

        </button>

      </div>

    </div>

  </div>

);

}