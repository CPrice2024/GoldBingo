import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getPlayerPromotions,
} from "../../api/promotion.api";


const PlayerSidebarSlider = () => {
  const [slides, setSlides] =
    useState([]);

  const [current, setCurrent] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const navigate = useNavigate();


  const loadPromotions =
    async () => {
      try {
        setLoading(true);

        const response =
          await getPlayerPromotions();

        if (response?.success) {
          setSlides(
            response.data || []
          );

          setCurrent(0);
        }
      } catch (error) {
        console.error(
          "Failed to load sidebar promotions:",
          error
        );

        setSlides([]);
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadPromotions();
  }, []);


  useEffect(() => {
    if (
      slides.length <= 1
    ) {
      return;
    }

    const interval =
      setInterval(() => {
        setCurrent(
          (prev) =>
            prev >=
            slides.length - 1
              ? 0
              : prev + 1
        );
      }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [slides.length]);


  if (
    loading ||
    slides.length === 0
  ) {
    return null;
  }


  const slide =
    slides[current];


  const handleClick = () => {
    if (!slide?.link) {
      return;
    }

    if (
      /^https?:\/\//i.test(
        slide.link
      )
    ) {
      window.open(
        slide.link,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    navigate(slide.link);
  };


  return (
    <div className="sidebar-promo-slider">

      <div
        className="sidebar-promo-image"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (
            event.key ===
              "Enter" ||
            event.key === " "
          ) {
            handleClick();
          }
        }}
      >
        <img
          src={slide.image}
          alt={
            slide.title ||
            "Promotion"
          }
        />
      </div>


      {slides.length > 1 && (
        <div className="sidebar-promo-dots">

          {slides.map(
            (item, index) => (
              <button
                key={item._id}
                type="button"
                className={`sidebar-promo-dot ${
                  current === index
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setCurrent(index)
                }
                aria-label={`Slide ${
                  index + 1
                }`}
              />
            )
          )}

        </div>
      )}

    </div>
  );
};

export default PlayerSidebarSlider;