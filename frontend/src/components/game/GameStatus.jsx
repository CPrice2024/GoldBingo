import {
  Clock3,
  PlayCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function GameStatus({ status }) {
  const config = {
    waiting: {
      label: "Waiting",
      icon: Clock3,
      className: "waiting",
    },

    active: {
      label: "Live",
      icon: PlayCircle,
      className: "active",
    },

    completed: {
      label: "Completed",
      icon: CheckCircle2,
      className: "completed",
    },

    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      className: "cancelled",
    },
  };

  const current =
    config[status] || config.waiting;

  const Icon = current.icon;

  return (
    <span
      className={`game-status ${current.className}`}
    >
      <Icon size={15} />
      {current.label}
    </span>
  );
}

export default GameStatus;