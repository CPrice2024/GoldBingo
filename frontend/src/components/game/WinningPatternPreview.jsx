import {
  ImageOff,
  Lightbulb,
} from "lucide-react";

import {
  WINNING_PATTERNS,
} from "../../constants/winningPatterns";

import {
  useLanguage,
} from "../../context/LanguageContext";


/* =========================================
   LOAD ALL WINNING PATTERN IMAGES

   IMPORTANT:
   Image filename must match
   winningPattern value exactly.

   Examples:

   half_house_diagonal.png
   3_lines.png
   4_squares.png
========================================= */

const patternImageModules =
  import.meta.glob(
    "../../assets/winning-patterns/*.{png,jpg,jpeg,webp}",
    {
      eager: true,
      import: "default",
    }
  );


/* =========================================
   CREATE IMAGE MAP

   Example:

   {
     full_house: "...png",
     half_house: "...png",
     half_house_diagonal: "...png",
     "3_lines": "...png"
   }
========================================= */

const PATTERN_IMAGES =
  Object.fromEntries(
    Object.entries(
      patternImageModules
    ).map(
      ([
        path,
        image,
      ]) => {

        const fileName =
          path
            .split("/")
            .pop() || "";


        const patternId =
          fileName.replace(
            /\.(png|jpg|jpeg|webp)$/i,
            ""
          );


        return [
          patternId,
          image,
        ];

      }
    )
  );


/* =========================================
   WINNING PATTERN PREVIEW
========================================= */

export default function WinningPatternPreview({
  open,
  onClose,
  patternId,
  patternLabel,
}) {

  const { t } =
    useLanguage();


  /*
   * Do not render modal
   * while closed.
   */

  if (!open) {
    return null;
  }


  /* =========================================
     NORMALIZE PATTERN ID
  ========================================= */

  const normalizedPatternId =
    String(
      patternId || ""
    ).trim();


  /* =========================================
     FIND CURRENT PATTERN
  ========================================= */

  const pattern =
    WINNING_PATTERNS.find(
      (item) =>
        String(
          item.value
        ) ===
        normalizedPatternId
    );


  /* =========================================
     LOCALIZED PATTERN LABEL

     First try:
     winningPatterns.3_lines

     If translation does not exist:
     use patternLabel / original catalog label.
  ========================================= */

  const patternTranslationKey =
    normalizedPatternId
      ? `winningPatterns.${normalizedPatternId}`
      : "";


  const translatedPatternLabel =
    patternTranslationKey
      ? t(
          patternTranslationKey
        )
      : "";


  const hasTranslatedPatternLabel =
    Boolean(
      translatedPatternLabel &&
      translatedPatternLabel !==
        patternTranslationKey
    );


  const displayLabel =
    hasTranslatedPatternLabel
      ? translatedPatternLabel

      : patternLabel ||
        pattern?.label ||
        normalizedPatternId ||
        t("common.unknown");


  /* =========================================
     FIND PATTERN IMAGE
  ========================================= */

  const patternImage =
    PATTERN_IMAGES[
      normalizedPatternId
    ];


  /* =========================================
     CLOSE WITH OVERLAY

     Clicking modal itself
     does not close it.
  ========================================= */

  const handleOverlayClick =
    () => {

      if (
        typeof onClose ===
        "function"
      ) {
        onClose();
      }

    };


  const handleModalClick =
    (event) => {

      event.stopPropagation();

    };


  /* =========================================
     RENDER
  ========================================= */

  return (

    <div
      className="pattern-hints-overlay"
      onClick={
        handleOverlayClick
      }
      role="presentation"
    >

      <div
        className="pattern-hints-modal"
        onClick={
          handleModalClick
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="pattern-hints-title"
      >


        {/* =====================================
            TITLE
        ====================================== */}

        <div className="pattern-hints-title">

          <Lightbulb
            size={34}
            aria-hidden="true"
          />

          <strong
            id="pattern-hints-title"
          >

            {t(
              "winningPatternHint.title"
            )}

          </strong>

        </div>


        {/* =====================================
            DESCRIPTION
        ====================================== */}

        <div className="pattern-hints-description">

          <span>

            {t(
              "winningPatternHint.description"
            )}

          </span>

          <strong className="pattern-hints-pattern-name">

            &quot;
            {displayLabel}
            &quot;

          </strong>

        </div>


        {/* =====================================
            IMAGE
        ====================================== */}

        <div className="pattern-hints-image-area">

          {patternImage ? (

            <img
              src={
                patternImage
              }
              alt={
                `${displayLabel} - ${t(
                  "winningPatternHint.imageAlt"
                )}`
              }
              className="pattern-hints-image"
              loading="eager"
              draggable="false"
            />

          ) : (

            <div className="pattern-hints-image-missing">

              <ImageOff
                size={30}
                aria-hidden="true"
              />

              <strong>

                {displayLabel}

              </strong>

              <span>

                {t(
                  "winningPatternHint.imageNotAvailable"
                )}

              </span>

            </div>

          )}

        </div>


        {/* =====================================
            CORRECT / WRONG EXPLANATION
        ====================================== */}

        <div className="pattern-hints-legend">

          <span className="pattern-hints-legend-item">

            <i
              className="pattern-hints-correct-dot"
              aria-hidden="true"
            />

            {t(
              "winningPatternHint.correct"
            )}

          </span>


          <span className="pattern-hints-legend-item">

            <i
              className="pattern-hints-wrong-dot"
              aria-hidden="true"
            />

            {t(
              "winningPatternHint.wrong"
            )}

          </span>

        </div>


        {/* =====================================
            CLOSE
        ====================================== */}

        <div className="pattern-hints-footer">

          <button
            type="button"
            className="pattern-hints-close"
            onClick={
              onClose
            }
          >

            {t(
              "common.close"
            )}

          </button>

        </div>


      </div>

    </div>

  );

}