import {
  Coins,
  Users,
  Trophy,
  ArrowRight,
  AlignCenter,
} from "lucide-react";

import GameStatus from "./GameStatus";

import bingoBallBlue
  from "../../assets/bingo-balls/bingo-ball-blue.png";

import bingoBallPink
  from "../../assets/bingo-balls/bingo-ball-pink.png";

import bingoBallGreen
  from "../../assets/bingo-balls/bingo-ball-green.png";

import bingoBallGold
  from "../../assets/bingo-balls/bingo-ball-gold.png";

import bingoBallRed
  from "../../assets/bingo-balls/bingo-ball-red.png";
import {
  useLanguage,
} from "../../context/LanguageContext";

/* =========================================
   GET BINGO BALL
========================================= */

const getBingoBall = (
  number
) => {

  const value =
    Number(number);


  if (
    value >= 1 &&
    value <= 15
  ) {
    return {
      letter: "B",
      image:
        bingoBallBlue,
    };
  }


  if (
    value >= 16 &&
    value <= 30
  ) {
    return {
      letter: "I",
      image:
        bingoBallPink,
    };
  }


  if (
    value >= 31 &&
    value <= 45
  ) {
    return {
      letter: "N",
      Align: "center",
      image:
        bingoBallGreen,
    };
  }


  if (
    value >= 46 &&
    value <= 60
  ) {
    return {
      letter: "G",
      image:
        bingoBallGold,
    };
  }


  return {
    letter: "O",
    image:
      bingoBallRed,
  };
};


function GameCard({
  game,
  onJoin,
  joining = false,
}) {
  const { t } =
  useLanguage();

  const isWaiting =
    game.status ===
    "waiting";



  const isFull =
    game.currentPlayers >=
    game.maxPlayers;


  const calledNumbers =
    Array.isArray(
      game.calledNumbers
    )
      ? game.calledNumbers
      : [];


  /*
   * Latest numbers first.
   */
  const lastCalled =
    [...calledNumbers]
      .reverse()
      .slice(
        0,
        15
      );


  return (
    <article className="game-card">

      {/* =====================================
          TOP
      ====================================== */}

      <div className="game-card-top">

        <GameStatus
          status={
            game.status
          }
        />

        <span className="game-card-number">
          {game.name}
        </span>

      </div>


      {/* =====================================
          TITLE
      ====================================== */}

      <div className="game-card-title">

        <h3>
          {game.name}
        </h3>

        <p>
  {t(
    "game.cardDescription"
  )}
</p>

      </div>


      {/* =====================================
          GAME ID
      ====================================== */}

      <div className="game-card-id">

        <span>
  {t("game.gameId")}
</span>

        <strong>
          {game._id}
        </strong>

      </div>


      {/* =====================================
          LAST CALLED
      ====================================== */}

      <div className="game-card-last-called">

        <div className="game-card-last-called-header">

         <span>
  {t("game.lastCalled")}
</span>

          <strong>
            {calledNumbers.length}
          </strong>

        </div>


        {lastCalled.length >
        0 ? (

          <div className="game-card-last-called-list">

            {lastCalled.map(
              (
                number,
                index
              ) => {

                const ball =
                  getBingoBall(
                    number
                  );


                return (

                  <div
                    key={
                      `${number}-${index}`
                    }
                    className={[
                      "game-card-called-ball",

                      index === 0
                        ? "latest"
                        : "",
                    ]
                      .filter(
                        Boolean
                      )
                      .join(" ")}
                  >

                    <img
                      src={
                        ball.image
                      }
                      alt={
                        `${ball.letter}${number}`
                      }
                    />


                    <div className="game-card-called-ball-content">

                      <span>
                        {ball.letter}
                      </span>

                      <strong>
                        {number}
                      </strong>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        ) : (

          <div className="game-card-no-called">
  {t(
    "game.noNumbersCalled"
  )}
</div>

        )}

      </div>


      {/* =====================================
          STATS
      ====================================== */}

      <div className="game-card-stats">

        <div className="game-stat">

          <Coins size={18} />

          <div>

           <span>
  {t("game.entryFee")}
</span>

            <strong>
              {game.entryFee}
              {" "}
              ETB
            </strong>

          </div>

        </div>


        <div className="game-stat">

          <Users size={18} />

          <div>

            <span>
  {t("game.entryFee")}
</span>

            <strong>
              {game.currentPlayers}/
              {game.maxPlayers}
            </strong>

          </div>

        </div>


        <div className="game-stat">

          <Trophy size={18} />

          <div>

           <span>
  {t("game.prizePool")}
</span>

            <strong>
              {game.prizePool}
              {" "}
              Birr
            </strong>

          </div>

        </div>

      </div>


      {/* =====================================
          JOIN BUTTON
      ====================================== */}

      <button
        type="button"
        className="game-join-btn"
        disabled={
          !isWaiting ||
          isFull ||
          joining
        }
        onClick={() =>
          onJoin(game)
        }
      >

        {joining
  ? t("game.joining")
  : isFull
  ? t("game.gameFull")
  : !isWaiting
  ? t(
      "game.gameUnavailable"
    )
  : t("game.joinGame")}


        {!joining &&
          isWaiting &&
          !isFull && (

            <ArrowRight
              size={17}
            />

          )}

      </button>

    </article>
  );
}


export default GameCard;