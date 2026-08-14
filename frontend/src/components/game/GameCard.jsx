import {
  Coins,
  Users,
  Trophy,
  ArrowRight,
} from "lucide-react";

import GameStatus from "./GameStatus";

function GameCard({
  game,
  onJoin,
  joining = false,
}) {
  const isWaiting =
    game.status === "waiting";

  const isFull =
    game.currentPlayers >=
    game.maxPlayers;

  return (
    <article className="game-card">

      <div className="game-card-top">
        <GameStatus status={game.status} />

        <span className="game-card-number">
          {game.name}
        </span>
      </div>

      <div className="game-card-title">
        <h3>{game.name}</h3>

        <p>
          Join the game and compete for
          the prize pool.
        </p>
      </div>

      <div className="game-card-stats">

        <div className="game-stat">
          <Coins size={18} />

          <div>
            <span>Entry Fee</span>
            <strong>
              {game.entryFee} ETB
            </strong>
          </div>
        </div>

        <div className="game-stat">
          <Users size={18} />
        </div>

        <div className="game-stat">
          <Trophy size={18} />

          <div>
            <span>Prize Pool</span>
            <strong>
              {game.prizePool} ETB
            </strong>
          </div>
        </div>

      </div>

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
          ? "Joining..."
          : isFull
          ? "Game Full"
          : !isWaiting
          ? "Game Unavailable"
          : "Join Game"}

        {!joining &&
          isWaiting &&
          !isFull && (
            <ArrowRight size={17} />
          )}
      </button>

    </article>
  );
}

export default GameCard;