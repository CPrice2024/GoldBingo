import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentGame } from "../../api/games.api";

const MobileBackHeader = ({
  title,
}) => {
  const navigate = useNavigate();

  const handleBack = async () => {
    try {
      const response =
        await getCurrentGame();

      const currentGame =
        response?.data?.data?._id
          ? response.data.data
          : response?.data?._id
          ? response.data
          : response;

      if (currentGame?._id) {
        navigate(
          `/player/game/${currentGame._id}`
        );

        return;
      }

      navigate(
        "/player/dashboard"
      );
    } catch (error) {
      console.error(
        "Failed to load current game:",
        error
      );

      navigate(
        "/player/dashboard"
      );
    }
  };

  return (
    <div className="player-mobile-back-header">

      <button
        type="button"
        className="player-mobile-back-button"
        onClick={handleBack}
        aria-label="Back to game"
      >
        <ArrowLeft size={21} />
      </button>

      <h2 className="player-mobile-back-title">
        {title}
      </h2>

    </div>
  );
};

export default MobileBackHeader;