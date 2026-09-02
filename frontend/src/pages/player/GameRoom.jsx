import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import callSound from "../../assets/sounds/call.mp3";
import claimSound from "../../assets/sounds/claim.mp3";
import bingoBallBlue from "../../assets/bingo-balls/bingo-ball-blue.png";
import bingoBallPink from "../../assets/bingo-balls/bingo-ball-pink.png";
import bingoBallGreen from "../../assets/bingo-balls/bingo-ball-green.png";
import bingoBallGold from "../../assets/bingo-balls/bingo-ball-gold.png";
import bingoBallRed from "../../assets/bingo-balls/bingo-ball-red.png";
import {
  getWinningPatternLabel,
} from "../../constants/winningPatterns";
import {
  getAvailableCards,
} from "../../api/cards.api";
import {
  useLanguage,
} from "../../context/LanguageContext";
import WinningPatternPreview
  from "../../components/game/WinningPatternPreview";

import {
  RefreshCw,
  Trophy,
  Coins,
  AlertCircle,
  Radio,
  X,
  QrCode,
  Plus,
  LoaderCircle,
  CircleCheckBig,
} from "lucide-react";

import {
  useParams,
} from "react-router-dom";

import {
  getGameById,
  getGameState,
  claimBingo,
  getGameWinners,
} from "../../api/games.api";

import {
  getMyGamePlayer,
  joinGame,
} from "../../api/gamePlayers.api";

import BingoCard from "../../components/game/BingoCard";

import "../../styles/game.css";
const EMPTY_NUMBERS = [];

const isGameSoundEnabled = () =>
  localStorage.getItem(
    "bingoSoundEnabled"
  ) !== "false";

const BALL_LEGEND = [
  {
    letter: "B",
    range: "1 - 15",
    image: bingoBallBlue,
  },
  {
    letter: "I",
    range: "16 - 30",
    image: bingoBallPink,
  },
  {
    letter: "N",
    range: "31 - 45",
    image: bingoBallGreen,
  },
  {
    letter: "G",
    range: "46 - 60",
    image: bingoBallGold,
  },
  {
    letter: "O",
    range: "61 - 75",
    image: bingoBallRed,
  },
];

function GameRoom() {
  const { gameId } =
    useParams();

  const { t } =
    useLanguage();

  const [nowMs, setNowMs] =
    useState(Date.now());
    const [
  patternPreviewOpen,
  setPatternPreviewOpen,
] = useState(false);

  const [game, setGame] =
    useState(null);
  const [gameState, setGameState] = useState(null);
  const [gamePlayer, setGamePlayer] = useState(null);
  const [
  cardCount,
  setCardCount,
] = useState(1);
const [
  showLastCalled,
  setShowLastCalled,
] = useState(false);


const cardFocusMode =
  showLastCalled;

const [
  markedNumbers,
  setMarkedNumbers,
] = useState([]);
/* =========================================
   INLINE CARD SELECTION
========================================= */

const [
  inlineCardsOpen,
  setInlineCardsOpen,
] = useState(false);


const [
  availablePreviewCards,
  setAvailablePreviewCards,
] = useState([]);


const [
  selectedPreviewCards,
  setSelectedPreviewCards,
] = useState([]);


const [
  previewCardsLoading,
  setPreviewCardsLoading,
] = useState(false);

const [
  bingoConfirmed,
  setBingoConfirmed,
] = useState(false);


const [
  previewCardsError,
  setPreviewCardsError,
] = useState("");
const CARD_COUNT_OPTIONS = [
  10,
  5,
  3,
  2,
  1,
];

const [
  cardMenuOpen,
  setCardMenuOpen,
] = useState(false);


const [
  manualMarkingEnabled,
  setManualMarkingEnabled,
] = useState(() => {
  return (
    localStorage.getItem(
      "bingoManualMarkingEnabled"
    ) !== "false"
  );
});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [claiming, setClaiming] = useState(false);
  const [joining, setJoining] = useState(false);
  const callSoundRef =
  useRef(null);
  const [
  bingoBlocked,
  setBingoBlocked,
] = useState(false);

const [
  blockedPlayers,
  setBlockedPlayers,
] = useState([]);

const claimSoundRef =
  useRef(null);

const previousCalledCountRef =
  useRef(null);

  const [cardOpen, setCardOpen] = useState(false);
const [cardNotification, setCardNotification] = useState("");
const [
  winnerData,
  setWinnerData,
] = useState(null);

const [
  winnerLoading,
  setWinnerLoading,
] = useState(false);

const [
  winnerError,
  setWinnerError,
] = useState("");

const [
  selectedWinner,
  setSelectedWinner,
] = useState(null);

  

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
  const nextState =
    stateResponse.data || null;

  setGameState(
    nextState
  );

  setBlockedPlayers(
    Array.isArray(
      nextState?.blockedPlayers
    )
      ? nextState.blockedPlayers
      : []
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
   GAME SOUNDS
========================================= */

useEffect(() => {
  callSoundRef.current =
    new Audio(
      callSound
    );

  claimSoundRef.current =
    new Audio(
      claimSound
    );

  callSoundRef.current.preload =
    "auto";

  claimSoundRef.current.preload =
    "auto";

  return () => {
    if (
      callSoundRef.current
    ) {
      callSoundRef.current.pause();
    }

    if (
      claimSoundRef.current
    ) {
      claimSoundRef.current.pause();
    }
  };
}, []);
  /* =========================================
   COUNTDOWN CLOCK
========================================= */

useEffect(() => {
  const timer =
    setInterval(() => {
      setNowMs(
        Date.now()
      );
    }, 250);

  return () => {
    clearInterval(
      timer
    );
  };
}, []);

useEffect(() => {
  setCardCount(1);
  setBingoConfirmed(false);

  setBingoBlocked(false);
  setShowLastCalled(false);

  setBlockedPlayers([]);

  setCardNotification("");

  setMarkedNumbers([]);

  setWinnerData(null);

  setWinnerError("");

  setSelectedWinner(null);


  previousCalledCountRef.current =
    null;
}, [gameId]);

  /* =========================================
     CALLED NUMBERS
  ========================================= */

const calledNumbers =
  gameState?.game?.calledNumbers ??
  gameState?.calledNumbers ??
  game?.calledNumbers ??
  EMPTY_NUMBERS;

  /* =========================================
   AUTO COMPLETE / AUTO MARK
========================================= */

useEffect(() => {

  // Manual marking ON:
  // do not auto mark.
  if (manualMarkingEnabled) {
    return;
  }

  const autoMarkedNumbers =
    calledNumbers
      .map((number) =>
        Number(number)
      )
      .filter((number) =>
        Number.isFinite(number)
      );

 setMarkedNumbers(
  (currentNumbers) => {

    const same =
      currentNumbers.length ===
        autoMarkedNumbers.length &&
      currentNumbers.every(
        (number, index) =>
          number ===
          autoMarkedNumbers[index]
      );

    return same
      ? currentNumbers
      : autoMarkedNumbers;

  }
);
}, [
  calledNumbers,
  manualMarkingEnabled,
]);
/* =========================================
   LIVE COUNTDOWN
========================================= */
const liveGame =
  gameState?.game ??
  game;
  const currentWinningPattern =
  liveGame?.winningPatternLabel ||
  getWinningPatternLabel(
    liveGame?.winningPattern ||
      game?.winningPattern ||
      "3_lines"
  );

const getRemainingSeconds = (
  endsAt
) => {
  if (!endsAt) {
    return null;
  }

  const endTime =
    new Date(
      endsAt
    ).getTime();

  if (
    !Number.isFinite(
      endTime
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.ceil(
      (
        endTime -
        nowMs
      ) / 1000
    )
  );
};

const startCountdown =
  liveGame?.status ===
  "waiting"
    ? getRemainingSeconds(
        liveGame?.joiningEndsAt
      )
    : null;

const callCountdown =
  liveGame?.status ===
  "active"
    ? getRemainingSeconds(
        liveGame?.nextCallAt
      )
    : null;

const formatCountdown = (
  seconds
) => {
  const safeSeconds =
    Math.max(
      0,
      Number(seconds) || 0
    );

  const minutes =
    Math.floor(
      safeSeconds / 60
    );

  const secs =
    safeSeconds % 60;

  return `${String(
    minutes
  ).padStart(
    2,
    "0"
  )}:${String(
    secs
  ).padStart(
    2,
    "0"
  )}`;
};
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
      const getBingoBall = (number) => {
  if (!number) {
    return null;
  }

  if (number >= 1 && number <= 15) {
    return {
      letter: "B",
      image: bingoBallBlue,
    };
  }

  if (number >= 16 && number <= 30) {
    return {
      letter: "I",
      image: bingoBallPink,
    };
  }

  if (number >= 31 && number <= 45) {
    return {
      letter: "N",
      image: bingoBallGreen,
    };
  }

  if (number >= 46 && number <= 60) {
    return {
      letter: "G",
      image: bingoBallGold,
    };
  }

  return {
    letter: "O",
    image: bingoBallRed,
  };
};
/* =========================================
   NEW NUMBER CALL SOUND
========================================= */

useEffect(() => {
  const currentCount =
    calledNumbers.length;

  /*
   * Wait until initial game
   * loading is finished.
   */
  if (loading) {
    return;
  }

  /*
   * First real game state:
   * remember current number count
   * without playing sound.
   */
  if (
    previousCalledCountRef.current ===
    null
  ) {
    previousCalledCountRef.current =
      currentCount;

    return;
  }

  /*
   * New number actually arrived.
   */
  if (
    currentCount >
    previousCalledCountRef.current
  ) {
    const audio =
  callSoundRef.current;

if (
  audio &&
  isGameSoundEnabled()
) {
  audio.currentTime =
    0;

  audio
    .play()
    .catch((error) => {
      console.log(
        "Call sound blocked:",
        error
      );
    });
}
  }

  previousCalledCountRef.current =
    currentCount;
}, [
  calledNumbers.length,
  loading,
]);
useEffect(() => {

  const handleStorageChange =
    () => {

      setManualMarkingEnabled(
        localStorage.getItem(
          "bingoManualMarkingEnabled"
        ) !== "false"
      );

    };


  window.addEventListener(
    "storage",
    handleStorageChange
  );


  window.addEventListener(
    "bingoManualMarkingChanged",
    handleStorageChange
  );


  return () => {

    window.removeEventListener(
      "storage",
      handleStorageChange
    );

    window.removeEventListener(
      "bingoManualMarkingChanged",
      handleStorageChange
    );

  };

}, []);

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
const handleMainCardButton =
  () => {

    /*
     * Player already joined:
     * open their actual cards.
     */

    if (isJoined) {

  document
    .getElementById(
      "bingo-my-cards-section"
    )
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

  return;
}


    /*
     * Only show card selection
     * while game is waiting.
     */

    if (
      game?.status !== "waiting"
    ) {

      setCardOpen(true);

      return;
    }


    setCardMenuOpen(
      (current) =>
        !current
    );

  };


const handleChooseCardCount =
  async (count) => {

    setCardMenuOpen(false);

    setCardCount(count);

    setInlineCardsOpen(true);

    setPreviewCardsLoading(
      true
    );

    setPreviewCardsError("");


    try {

      const response =
        await getAvailableCards();


      const allCards =
        Array.isArray(
          response?.data
        )
          ? response.data
          : [];


      if (
        allCards.length <
        count
      ) {

        throw new Error(
          `Only ${allCards.length} cards are currently available.`
        );

      }


      /*
       * Randomize the available
       * card pool before showing it.
       */

      const shuffled =
        [...allCards].sort(
          () =>
            Math.random() -
            0.5
        );


      const selected =
        shuffled.slice(
          0,
          count
        );


      setAvailablePreviewCards(
        shuffled
      );

      setSelectedPreviewCards(
        selected
      );


      /*
       * Smoothly move player
       * down to the cards.
       */

      setTimeout(() => {

        document
          .getElementById(
            "bingo-inline-card-selection"
          )
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start",
          });

      }, 100);


    } catch (err) {

      console.error(
        "Failed to load cards:",
        err
      );


      setSelectedPreviewCards(
        []
      );


      setPreviewCardsError(
        err.response?.data
          ?.message ||
          err.message ||
          "Failed to load cards"
      );

    } finally {

      setPreviewCardsLoading(
        false
      );

    }

  };
  /* =========================================
   REMOVE PREVIEW CARD
========================================= */

const handleRemovePreviewCard =
  (cardId) => {

    setSelectedPreviewCards(
      (current) => {

        const next =
          current.filter(
            (card) =>
              String(
                card._id
              ) !==
              String(
                cardId
              )
          );


        setCardCount(
          next.length
        );


        return next;

      }
    );

  };


/* =========================================
   ADD ANOTHER PREVIEW CARD
========================================= */

const handleAddPreviewCard =
  () => {

    if (
      selectedPreviewCards.length >=
      10
    ) {
      return;
    }


    const selectedIds =
      new Set(
        selectedPreviewCards.map(
          (card) =>
            String(
              card._id
            )
        )
      );


    const nextCard =
      availablePreviewCards.find(
        (card) =>
          !selectedIds.has(
            String(
              card._id
            )
          )
      );


    if (!nextCard) {

      setPreviewCardsError(
        "No more available cards."
      );

      return;

    }


    const next =
      [
        ...selectedPreviewCards,
        nextCard,
      ];


    setSelectedPreviewCards(
      next
    );

    setCardCount(
      next.length
    );

    setPreviewCardsError("");

  };
  /* =========================================
     PLAYER CARD
  ========================================= */

const cards =
  Array.isArray(
    gamePlayer?.cardIds
  ) &&
  gamePlayer.cardIds.length > 0
    ? gamePlayer.cardIds
    : gamePlayer?.cardId
    ? [gamePlayer.cardId]
    : [];

const isJoined =
  cards.length > 0;

  /* =========================================
   MY BINGO BLOCK STATUS
========================================= */

useEffect(() => {
  if (
    !gamePlayer?._id
  ) {
    setBingoBlocked(false);
    return;
  }

  const blocked =
    blockedPlayers.some(
      (item) =>
        String(
          item.gamePlayerId
        ) ===
        String(
          gamePlayer._id
        )
    );

  setBingoBlocked(
    blocked
  );
}, [
  blockedPlayers,
  gamePlayer?._id,
]);

/* =========================================
   FETCH GAME WINNERS
========================================= */

const fetchGameWinners =
  useCallback(
    async () => {

      if (
        !gameId ||
        !isJoined
      ) {
        return;
      }

      try {

        setWinnerLoading(
          true
        );

        setWinnerError(
          ""
        );

        const response =
          await getGameWinners(
            gameId
          );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Failed to load winner"
          );
        }

        setWinnerData(
          response.data ||
            null
        );

      } catch (err) {

        console.error(
          "Failed to load winners:",
          err
        );

        setWinnerError(
          err.response?.data
            ?.message ||
            err.message ||
            "Failed to load winner"
        );

      } finally {

        setWinnerLoading(
          false
        );

      }

    },
    [
      gameId,
      isJoined,
    ]
  );

/* =========================================
   LOAD WINNER AFTER GAME ENDS
========================================= */

useEffect(() => {

  if (
    !isJoined
  ) {
    return;
  }

  const gameFinished =
    game?.status ===
      "completed" ||
    gamePlayer?.status ===
      "won" ||
    gamePlayer?.status ===
      "lost";

  if (
    !gameFinished
  ) {
    return;
  }

  fetchGameWinners();

}, [
  game?.status,
  gamePlayer?.status,
  isJoined,
  fetchGameWinners,
]);

const totalJoinFee =
  Number(
    game?.entryFee || 0
  ) * cardCount;

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
  await joinGame(
    gameId,
    cardCount
  );

      if (!response.success) {
        throw new Error(
          response.message ||
            "Failed to join game"
        );
      }

      setMessage(
  `${t("game.joinedWith")} ${cardCount} ${
    cardCount === 1
      ? t("game.card")
      : t("game.cards")
  }.`
);

      await fetchGame(true);

setInlineCardsOpen(false);

setSelectedPreviewCards([]);

setTimeout(() => {

  document
    .getElementById(
      "bingo-my-cards-section"
    )
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

}, 250);
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
   MANUAL CARD NUMBER MARKING
========================================= */

const handleCardNumberClick = (
  number
) => {

  if (
    !manualMarkingEnabled
  ) {
    return;
  }


  const numericNumber =
    Number(number);


  setMarkedNumbers(
    (currentNumbers) => {

      if (
        currentNumbers.includes(
          numericNumber
        )
      ) {

        return currentNumbers.filter(
          (item) =>
            item !== numericNumber
        );

      }


      return [
        ...currentNumbers,
        numericNumber,
      ];

    }
  );
};



/* =========================================
   SINGLE BINGO BUTTON
========================================= */

const handleClaimBingo =
  async () => {

    if (!isJoined) {
      setCardNotification(
        "You must join the game first."
      );

      return;
    }


    if (bingoBlocked) {
      setCardNotification(
        "Your BINGO button is blocked for this game."
      );

      return;
    }


    if (
      liveGame?.status !==
      "active"
    ) {
      setCardNotification(
        "The game is not active."
      );

      return;
    }


    try {

      setClaiming(true);

      setMessage("");

      setError("");

      setCardNotification(
        ""
      );


      /*
       * Backend automatically:
       * - loads every purchased card
       * - uses game winning pattern
       * - determines false/winning Bingo
       */
      const response =
        await claimBingo(
          gameId
        );


      /* =====================================
         FALSE BINGO
      ====================================== */

      if (
        response?.code ===
        "FALSE_BINGO"
      ) {

        setBingoBlocked(
          true
        );

        setCardNotification(
          response?.message ||
            "False Bingo. Your BINGO button has been blocked."
        );


        const blockedData =
          response?.data;

        if (
          blockedData
            ?.gamePlayerId
        ) {

          setBlockedPlayers(
            (current) => {

              const alreadyExists =
                current.some(
                  (item) =>
                    String(
                      item.gamePlayerId
                    ) ===
                    String(
                      blockedData
                        .gamePlayerId
                    )
                );


              if (
                alreadyExists
              ) {
                return current;
              }


              return [
                ...current,

                {
                  gamePlayerId:
                    blockedData
                      .gamePlayerId,

                  player: {
                    id:
                      blockedData
                        .playerId,

                    fullName:
                      "Player",
                  },

                  blockedAt:
                    blockedData
                      .blockedAt,

                  blockedReason:
                    "False Bingo",

                  cards:
                    blockedData
                      .cards || [],
                },
              ];
            }
          );

        }


        return;
      }


      /* =====================================
         VALID WINNER
      ====================================== */

      if (
        response?.code ===
        "BINGO_WIN"
      ) {
        setBingoConfirmed(true);

        const claimAudio =
          claimSoundRef.current;


        if (
          claimAudio &&
          isGameSoundEnabled()
        ) {

          claimAudio.currentTime =
            0;

          claimAudio
            .play()
            .catch(
              (audioError) => {

                console.log(
                  "Claim sound blocked:",
                  audioError
                );

              }
            );
        }


        const winningCard =
          response?.data
            ?.winner
            ?.cardNumber;


        setMessage(
          winningCard
            ? `🎉 BINGO! Winning card ${winningCard}`
            : "🎉 BINGO! You won the game!"
        );


        await fetchGame(
          true
        );

        await fetchGameWinners();

        return;
      }


      /*
       * Fallback response
       */
      await fetchGame(
        true
      );


    } catch (err) {

      console.error(
        "BINGO ERROR:",
        err
      );


      const backendResponse =
        err.response?.data;


      /* =====================================
         ALREADY BLOCKED
      ====================================== */

      if (
        backendResponse?.code ===
        "BINGO_BLOCKED"
      ) {

        setBingoBlocked(
          true
        );

        setCardNotification(
          backendResponse
            ?.message ||
            "Your BINGO button is blocked for this game."
        );

        return;
      }


      /* =====================================
         ANOTHER PLAYER WON
      ====================================== */

      if (
        backendResponse?.code ===
        "GAME_FINISHED"
      ) {

        setCardNotification(
          backendResponse
            ?.message ||
            "Another player already won this game."
        );

        await fetchGame(
          true
        );

        await fetchGameWinners();

        return;
      }


      setCardNotification(
        backendResponse
          ?.message ||
          err.message ||
          "Failed to submit Bingo."
      );

    } finally {

      setClaiming(
        false
      );

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
          {t("game.loadingBingo")}
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
  {t("game.noActiveGame")}
</h1>

<p className="no-game-subtitle">
  {t(
    "game.noActiveGameDescription"
  )}
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

          <strong>
  {t("game.noGameRunning")}
</strong>

<p>
  {t("game.newGameAutomatic")}
</p>
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

          {refreshing
  ? t("game.checking")
  : t("game.tryAgain")}
        </button>

        <div className="no-game-footer">
          <Radio size={18} />

          <span>
  {t(
    "game.newGamesAutomatic"
  )}
</span>
        </div>

      </div>
    </div>
  );
}

  return (
    <div className="bingo-mobile-page">

      {/* =====================================
    GLOBAL LAST CALLED
===================================== */}

{calledNumbers.length > 0 && (

  <section className="bingo-called-history bingo-global-last-called">

    <div className="bingo-history-header">

      <div>

        <span>
          {t(
            "game.lastCalled"
          )}
        </span>

        <strong>
          {
            calledNumbers.length
          }
        </strong>

      </div>


      <button
        type="button"
        className="bingo-card-last-called-toggle"
        onClick={() =>
          setShowLastCalled(
            (current) =>
              !current
          )
        }
      >

        {showLastCalled
          ? "Hide"
          : "Show"}

      </button>

    </div>


    {showLastCalled && (

      <div className="bingo-history-list bingo-history-list-expand">

        {[...calledNumbers]
          .reverse()
          .slice(
            0,
            8
          )
          .map(
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
                  key={`${number}-${index}`}
                  className={`bingo-history-ball ${
                    index === 0
                      ? "history-latest"
                      : ""
                  }`}
                >

                  <img
                    src={
                      ball.image
                    }
                    alt={`${ball.letter}${number}`}
                    className="bingo-history-ball-image"
                  />


                  <div className="bingo-history-ball-content">

                    <span>
                      {
                        ball.letter
                      }
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

    )}

  </section>

)}
   


      {/* =====================================
          GAME INFO
      ====================================== */}

      {!cardFocusMode && (

  <section className="bingo-game-info">
    {/* CURRENT WINNING PATTERN */}
      <div className="bingo-info-stats">

  <span className="bingo-current-pattern-span">
    {t("game.gameType")}
  </span>

  <button
    type="button"
    className="bingo-current-pattern-button"
    onClick={() =>
      setPatternPreviewOpen(true)
    }
  >
    <span>
      {currentWinningPattern}
    </span>

    <span className="bingo-pattern-help-icon">
      ?
    </span>
  </button>

</div>

  <div className="bingo-game-info-main">
    

    <div className="bingo-live-icon">
      <QrCode size={19} />
    </div>

    <div className="bingo-game-main-details">

      <strong>
        {liveGame?.name ||
          game.name}
      </strong>

      <span className="bingo-game-status">

        {liveGame?.status ===
"waiting" ? (
  <>
    <span>
      {t(
        "game.waitingToStart"
      )}
    </span>

    {startCountdown !==
      null && (
      <strong className="bingo-status-countdown">
        {formatCountdown(
          startCountdown
        )}
      </strong>
    )}
  </>
) : liveGame?.status ===
  "active" ? (
  <span>
    {t("game.active")}
  </span>
) : (
  <span>
    {t(
      "game.gameCompleted"
    )}
  </span>
)}

      </span>


      

    </div>

  </div>


  <div className="bingo-info-stats">

    <div>
      <Coins size={16} />

      <span>
  {t("game.price")}
</span>

<strong>
  {liveGame?.entryFee ??
    game.entryFee}{" "}
  {t("game.birr")}
</strong>
    </div>

    <div>
  <Trophy size={16} />

  <span>
    {t("game.prize")}
  </span>

  <strong>
  {Number(
    liveGame?.prizeAmount ??
      game?.prizeAmount ??
      liveGame?.prizePool ??
      game?.prizePool ??
      0
  ).toLocaleString()}{" "}
  Birr
</strong>
</div>

  </div>

</section>
)}


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
          BINGO 1-75 BOARD
      ====================================== */}
{!cardFocusMode && (
      <section className="bingo-board-card">

        <div className="bingo-board-title">
          <strong>
            BINGO
          </strong>

          <span>
  {calledNumbers.length === 0
    ? t("game.waiting")
    : `${calledNumbers.length} ${t(
        "game.numbersCalled"
      )}`}
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
    `bingo-number-${row.letter.toLowerCase()}`,
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
           )}


      {/* =====================================
          INLINE CARD SELECTION
          DIRECTLY BELOW BINGO BOARD
      ====================================== */}

      {!isJoined &&
        inlineCardsOpen && (

        <section
          id="bingo-inline-card-selection"
          className="bingo-inline-card-section"
        >

          {/* HEADER */}

          <div className="bingo-inline-card-section-header">

            <div>

              <strong>
                Cards
              </strong>

              <span>
                {selectedPreviewCards.length}
                {" "}
                selected
              </span>

            </div>


            <strong className="bingo-inline-card-total">

              {Number(
                game?.entryFee ||
                0
              ) *
                selectedPreviewCards.length}
              {" "}
              {t("game.birr")}

            </strong>

          </div>


          {/* LOADING */}

          {previewCardsLoading && (

            <div className="bingo-inline-card-loading">

              <RefreshCw
                size={19}
                className="spin"
              />

              <span>
                Loading cards...
              </span>

            </div>

          )}


          {/* ERROR */}

          {previewCardsError && (

            <div className="bingo-inline-card-error">

              <AlertCircle
                size={17}
              />

              {previewCardsError}

            </div>

          )}


          {/* CARDS */}

          {!previewCardsLoading &&
            selectedPreviewCards.length >
              0 && (

            <div className="bingo-inline-card-grid">

              {selectedPreviewCards.map(
                (
                  card,
                  index
                ) => (

                <article
                  key={
                    card._id ||
                    card.cardNumber
                  }
                  className="bingo-inline-card-item"
                >

                  {/* CARD TITLE */}

                  <div className="bingo-inline-card-top">

                    <div className="bingo-inline-card-number">

                      <span className="bingo-inline-card-icon">
                        ▣
                      </span>

                      <strong>
                        {card.cardNumber ||
                          `Card ${
                            index + 1
                          }`}
                      </strong>

                    </div>


                    <button
                      type="button"
                      className="bingo-inline-card-remove"
                      onClick={() =>
                        handleRemovePreviewCard(
                          card._id
                        )
                      }
                      aria-label="Remove card"
                    >

                      <X
                        size={21}
                      />

                    </button>

                  </div>


                  {/* CARD BODY */}

                  <div className="bingo-inline-card-body">

                    <BingoCard
                      numbers={
                        card.numbers
                      }
                      calledNumbers={
                        []
                      }
                      markedNumbers={
                        []
                      }
                      manualMarkingEnabled={
                        false
                      }
                    />

                  </div>

                </article>

              ))}

            </div>

          )}


          {/* ADD CARD */}
<div 
className="bingo-inline-card-grid"
>
          {!previewCardsLoading &&
            selectedPreviewCards.length <
              10 && (

            <button
              type="button"
              className="bingo-inline-add-card"
              onClick={
                handleAddPreviewCard
              }
            >

              <Plus
                size={18}
              />

              Add Card

            </button>

          )}

          {/* JOIN */}

          {selectedPreviewCards.length >
            0 && (

            <button
              type="button"
              className="bingo-inline-add-card"
              onClick={
                handleJoinGame
              }
              disabled={
                joining ||
                previewCardsLoading
              }
            >

              {joining
                ? t(
                    "game.joining"
                  )
                : `Join ${
                    selectedPreviewCards.length
                  
                  }`}

            </button>

          )}
          </div>

        </section>

      )}




{/* =====================================
    MY JOINED CARDS
    INLINE BELOW BINGO BOARD
===================================== */}

{isJoined && (

  <section
    id="bingo-my-cards-section"
    className="bingo-inline-my-cards-section"
  >

    {/* =================================
        HEADER
    ================================= */}

    <div className="bingo-inline-my-cards-header">

      <div>

        <strong>
          {cards.length > 1
            ? `${t(
                "game.myCards"
              )} (${cards.length})`
            : t(
                "game.myCard"
              )}
        </strong>

        <span>
          {cards.length}
          {" "}
          {cards.length === 1
            ? t("game.card")
            : t("game.cards")}
        </span>

      </div>


      <span className="bingo-inline-my-cards-badge">
        JOINED
      </span>

    </div>


    {/* =================================
        BINGO CHECK MESSAGE
    ================================= */}

    {cardNotification && (
  <div className="bingo-card-notification">
    {cardNotification}
  </div>
)}


    {/* =================================
        WINNER CARDS
    ================================= */}

    {(
      game?.status ===
        "completed" ||
      gamePlayer?.status ===
        "won" ||
      gamePlayer?.status ===
        "lost"
    ) && (

      <section className="bingo-winners-section">

        <div className="bingo-winners-header">

          <div>

            <strong>
              {t(
                "game.winnerCards"
              )}
            </strong>

            <span>
              {t(
                "game.tapWinnerCard"
              )}
            </span>

          </div>


          <div className="bingo-winner-count">

            <Trophy
              size={14}
            />

            {winnerData
              ?.winnerCount ||
              0}

          </div>

        </div>


        {winnerLoading ? (

          <div className="bingo-winner-loading">

            <RefreshCw
              size={16}
              className="spin"
            />

            {t(
              "game.loadingWinner"
            )}

          </div>

        ) : winnerError ? (

          <div className="bingo-winner-error">

            {winnerError}

          </div>

        ) : winnerData
            ?.winners
            ?.length > 0 ? (

          <div className="bingo-winner-grid">

            {winnerData.winners
              .slice(0, 16)
              .map(
                (
                  winner,
                  index
                ) => {

                  const isMyWinningCard =
                    String(
                      winner.gamePlayerId
                    ) ===
                    String(
                      gamePlayer?._id
                    );


                  return (

                    <button
                      type="button"
                      key={
                        winner
                          .gamePlayerId ||
                        index
                      }
                      className={`bingo-winner-card-button ${
                        isMyWinningCard
                          ? "mine"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedWinner(
                          winner
                        )
                      }
                    >

                      <Trophy
                        size={14}
                      />


                      <span>
                        {winner.card
                          ?.cardNumber ||
                          t(
                            "game.winner"
                          )}
                      </span>


                      {isMyWinningCard && (

                        <small>
                          {t(
                            "game.you"
                          )}
                        </small>

                      )}

                    </button>

                  );

                }
              )}

          </div>

        ) : (

          <div className="bingo-no-winner">

            {t(
              "game.noClaimedWinner"
            )}

          </div>

        )}

      </section>

    )}


    {/* =================================
        REAL PLAYER CARDS
    ================================= */}

    <div className="bingo-inline-player-card-grid">

      {cards.map(
        (
          card,
          index
        ) => (

         <article
  id={`joined-card-${String(
    card?._id ||
    card?.id ||
    index
  )}`}
  key={
    card._id ||
    card.id ||
    index
  }
  className="bingo-inline-player-card-item"
>

            {/* CARD HEADER */}

            <div className="bingo-inline-player-card-header">

              <div>

                <strong>
                  {card.cardNumber}
                </strong>

              </div>


              <span className="bingo-inline-card-active">
                ACTIVE
              </span>

            </div>


            {/* =============================
                BINGO CARD
            ============================= */}

            <div className="bingo-inline-player-card-body">

              <BingoCard
                numbers={
                  card.numbers
                }
                calledNumbers={
                  calledNumbers
                }
                markedNumbers={
                  markedNumbers
                }
                manualMarkingEnabled={
                  manualMarkingEnabled
                }
                onNumberClick={
                  handleCardNumberClick
                }
              />

            </div>

          </article>

        )
      )}

    </div>

  {/* =================================
    SINGLE BINGO BUTTON
================================= */}

<div className="bingo-inline-card-actions">

  <button
    type="button"

    onClick={
      handleClaimBingo
    }

    disabled={
      claiming ||
      bingoBlocked ||
      bingoConfirmed ||
      liveGame?.status !==
        "active"
    }

    aria-busy={
      claiming
    }

    className={[
      "bingo-claim-button",

      bingoBlocked
        ? "bingo-button-blocked"
        : "",

      bingoConfirmed
        ? "bingo-button-confirmed"
        : "",
    ]
      .filter(Boolean)
      .join(" ")}
  >

    {claiming ? (

      <LoaderCircle
        size={24}
        className="spin bingo-pending-icon"
      />

    ) : bingoConfirmed ? (

      <span className="bingo-confirm-content">

        <CircleCheckBig
          size={27}
          strokeWidth={3}
          className="bingo-confirm-icon"
        />

        <span>
          WINNER
        </span>

      </span>

    ) : bingoBlocked ? (

      "BINGO BLOCKED"

    ) : (

      "BINGO"

    )}

  </button>

</div>

  </section>

)}


     {/* =====================================
    CARD SPEED DIAL
===================================== */}

<div
  className={`bingo-card-speed-dial ${
    cardMenuOpen
      ? "open"
      : ""
  }`}
>

  {/* ===============================
      1 / 2 / 3 / 5 / 10
  =============================== */}

  {!isJoined &&
    game?.status === "waiting" && (

      <div className="bingo-card-speed-options">

        {CARD_COUNT_OPTIONS.map(
          (
            count,
            index
          ) => (

            <button
              key={count}
              type="button"
              className="bingo-card-speed-option"
              style={{
                "--option-index":
                  index,
              }}
              onClick={() =>
                handleChooseCardCount(
                  count
                )
              }
            >

              {count}

            </button>

          )
        )}

      </div>

    )}


  {/* ===============================
      MAIN +
  =============================== */}

  <button
    type="button"
    className="bingo-fixed-card-button"
    onClick={
      handleMainCardButton
    }
    aria-expanded={
      cardMenuOpen
    }
  >

    <span className="bingo-fixed-plus">

      <Plus
        size={25}
      />

    </span>

  </button>

</div>

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
    ? cards.length > 1
      ? `${t(
          "game.myCards"
        )} (${cards.length})`
      : t("game.myCard")
    : t("game.joinBingo")}
</strong>

<span>
  {isJoined
    ? `${cards.length} ${
        cards.length > 1
          ? t("game.cards")
          : t("game.card")
      }`
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
  <div className="bingo-card-notification">
    {cardNotification}
  </div>
)}
{/* =====================================
    WINNER CARD LIST
====================================== */}

{(
  game?.status ===
    "completed" ||
  gamePlayer?.status ===
    "won" ||
  gamePlayer?.status ===
    "lost"
) && (

  <section className="bingo-winners-section">

    <div className="bingo-winners-header">

      <div>

        <strong>
  {t("game.winnerCards")}
</strong>

        <span>
  {t("game.tapWinnerCard")}
</span>

      </div>

      <div className="bingo-winner-count">

        <Trophy
          size={14}
        />

        {winnerData
          ?.winnerCount ||
          0}

      </div>

    </div>


    {winnerLoading ? (

      <div className="bingo-winner-loading">

        <RefreshCw
          size={16}
          className="spin"
        />

        {t("game.loadingWinner")}

      </div>

    ) : winnerError ? (

      <div className="bingo-winner-error">

        {winnerError}

      </div>

    ) : winnerData
        ?.winners
        ?.length > 0 ? (

      <div className="bingo-winner-grid">

        {winnerData.winners
          .slice(0, 16)
          .map(
            (
              winner,
              index
            ) => {

              const isMyWinningCard =
                String(
                  winner.gamePlayerId
                ) ===
                String(
                  gamePlayer?._id
                );

              return (

                <button
                  type="button"
                  key={
                    winner
                      .gamePlayerId ||
                    index
                  }
                  className={`bingo-winner-card-button ${
                    isMyWinningCard
                      ? "mine"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedWinner(
                      winner
                    )
                  }
                >

                  <Trophy
                    size={14}
                  />

                  <span>
                    {winner.card
                      ?.cardNumber ||
                      t("game.winner")}
                  </span>

                  {isMyWinningCard && (
                    <small>
  {t("game.you")}
</small>
                  )}

                </button>

              );
            }
          )}

      </div>

    ) : (

      <div className="bingo-no-winner">
  {t("game.noClaimedWinner")}
</div>

    )}

  </section>

)}

<div className="bingo-player-card-list">

  {cards.map(
    (card, index) => (
      <div
        key={
          card._id ||
          card.id ||
          index
        }
        className="bingo-player-card-item"
      >

        <div className="bingo-player-card-title">

 <strong>
  {t("game.card")}{" "}
  {index + 1}
</strong>

  <span>
    {card.cardNumber}
  </span>

</div>

<div className="bingo-player-card">

          <BingoCard
  numbers={
    card.numbers
  }

  calledNumbers={
    calledNumbers
  }

  markedNumbers={
    markedNumbers
  }

  manualMarkingEnabled={
    manualMarkingEnabled
  }

  onNumberClick={
    handleCardNumberClick
  }
/>

        </div>

      </div>
    )
  )}

</div>
<div className="bingo-card-actions">

  <button
    type="button"

    onClick={
      handleClaimBingo
    }

    disabled={
      claiming ||
      bingoBlocked ||
      bingoConfirmed ||
      liveGame?.status !==
        "active"
    }

    aria-busy={
      claiming
    }

    className={[
      "bingo-claim-button",

      bingoBlocked
        ? "bingo-button-blocked"
        : "",

      bingoConfirmed
        ? "bingo-button-confirmed"
        : "",
    ]
      .filter(Boolean)
      .join(" ")}
  >

    {claiming ? (

      <LoaderCircle
        size={24}
        className="spin bingo-pending-icon"
      />

    ) : bingoConfirmed ? (

      <span className="bingo-confirm-content">

        <CircleCheckBig
          size={27}
          strokeWidth={3}
          className="bingo-confirm-icon"
        />

        <span>
          WINNER
        </span>

      </span>

    ) : bingoBlocked ? (

      "BINGO BLOCKED"

    ) : (

      "BINGO"

    )}

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

                <strong>
  {t(
    "game.numberOfCartela"
  )}
</strong>

<span>
  {t("game.chooseCards")}
</span>
                {game.status ===
"waiting" ? (

  <>

    <div className="bingo-card-count-section">

      <div className="bingo-card-count-header">

        <div>
          <strong>
  {t(
    "game.numberOfCartela"
  )}
</strong>

<span>
  {t("game.chooseCards")}
</span>
        </div>

        <strong className="bingo-card-total">
  {totalJoinFee}{" "}
  {t("game.birr")}
</strong>

      </div>


      <select
        className="bingo-card-count-select"
        value={cardCount}
        onChange={(event) =>
          setCardCount(
            Number(
              event.target.value
            )
          )
        }
        disabled={joining}
      >
        <option value={1}>
  1 {t("game.card")}
</option>

<option value={2}>
  2 {t("game.cards")}
</option>

<option value={3}>
  3 {t("game.cards")}
</option>

<option value={5}>
  5 {t("game.cards")}
</option>

<option value={10}>
  10 {t("game.cards")}
</option>
      </select>


      <div className="bingo-card-price-summary">
  <span>
    {game.entryFee}{" "}
    {t("game.birr")} ×{" "}
    {cardCount}
  </span>

  <strong>
    {t("game.total")}:{" "}
    {totalJoinFee}{" "}
    {t("game.birr")}
  </strong>
</div>

    </div>


    <button
      type="button"
      className="bingo-join-button"
      onClick={
        handleJoinGame
      }
      disabled={joining}
    >

      {joining
  ? t("game.joining")
  : `${t("game.joinGame")} ${cardCount} ${
      cardCount === 1
        ? t("game.card")
        : t("game.cards")
    } - ${totalJoinFee} ${t(
      "game.birr"
    )}`}

    </button>

  </>

) : game.status ===
                  "active" ? (

                  <div className="bingo-watch-only">
  <Radio size={20} />

  <strong>
    {t(
      "game.gameAlreadyStarted"
    )}
  </strong>

  <span>
    {t(
      "game.watchLiveGame"
    )}
  </span>
</div>

                ) : (

                  <div className="bingo-watch-only">
  <strong>
    {t(
      "game.gameCompleted"
    )}
  </strong>

  <span>
    {t("game.waitNextGame")}
  </span>
</div>

                )}

              </div>
            )}

          </div>

        </div>
      )}
      {/* =========================================
    WINNER DETAIL POPUP
========================================= */}

{selectedWinner && (

  <div
    className="bingo-winner-detail-overlay"
    onClick={() =>
      setSelectedWinner(
        null
      )
    }
  >

    <div
      className="bingo-winner-detail-modal"
      onClick={(
        event
      ) =>
        event.stopPropagation()
      }
    >

      {/* HEADER */}

      <div className="bingo-winner-detail-header">

        <div>

          <span>
            {t("game.winner")}
          </span>

          {/* PHONE ABOVE */}

          <strong className="bingo-winner-phone">
            {selectedWinner
              .player
              ?.phone ||
              "-"}
          </strong>

          <small>
            {selectedWinner
              .player
             ?.fullName ||
t("game.player")}
          </small>

        </div>


        <button
          type="button"
          className="bingo-winner-detail-close"
          onClick={() =>
            setSelectedWinner(
              null
            )
          }
        >
          <X size={20} />
        </button>

      </div>


      {/* CARD / PRIZE INFO */}

      <div className="bingo-winner-summary">

        <div>

          <span>
             {t("game.winningCard")}
          </span>

          <strong>
            {selectedWinner
              .card
              ?.cardNumber ||
              "-"}
          </strong>

        </div>


        <div>

          <span>
            {t("game.prize")}
          </span>

          <strong>
  {selectedWinner.prizeAmount || 0}{" "}
  {t("game.birr")}
</strong>

        </div>

      </div>


      {/* WINNING PATTERN */}

      <button
        type="button"
        className="bingo-winner-pattern-button"
        onClick={() => {
  setSelectedWinner(null);

  setPatternPreviewOpen(true);
}}
      >

        <div>

          <span>
            {t(
    "game.winningPattern"
  )}
          </span>

          <strong>
            {getWinningPatternLabel(
              selectedWinner
                .pattern ||
                winnerData
                  ?.game
                  ?.winningPattern ||
                game
                  ?.winningPattern ||
                "3_lines"
            )}
          </strong>

        </div>

        <span className="bingo-winner-pattern-help">
          ?
        </span>

      </button>


      {/* ACTUAL WINNING BINGO CARD */}

      {selectedWinner
        .card
        ?.numbers && (

        <div className="bingo-winner-actual-card">

          <BingoCard
            numbers={
              selectedWinner
                .card
                .numbers
            }

            calledNumbers={
              winnerData
                ?.game
                ?.calledNumbers ||
              calledNumbers
            }

            markedNumbers={[]}

            manualMarkingEnabled={
              false
            }
          />

        </div>

      )}


      <div className="bingo-winner-detail-note">

        {t("game.validatedNote")}

      </div>

    </div>

  </div>

)}

      <WinningPatternPreview
  open={
    patternPreviewOpen
  }

  onClose={() =>
    setPatternPreviewOpen(false)
  }

  patternId={
    liveGame?.winningPattern ||
    game?.winningPattern ||
    "3_lines"
  }

  patternLabel={
    currentWinningPattern
  }
/>

    </div>
  );
}

export default GameRoom;