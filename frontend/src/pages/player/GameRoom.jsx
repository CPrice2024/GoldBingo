import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  io,
} from "socket.io-client";
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
  Gamepad2,
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
import {
  getPlayerInfo,
} from "../../api/info.api";
import BingoCard from "../../components/game/BingoCard";

import "../../styles/game.css";
const EMPTY_NUMBERS = [];
const SOCKET_URL =
  import.meta.env
    .VITE_API_URL ||
  "http://localhost:5000";

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
    const socketRef =
  useRef(null);

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
/* =========================================
   GAME TYPE CARD LIMIT

   Normal = maximum 25 cards
   Bonus  = maximum 2 cards
========================================= */

const isBonusGame =
  Number(
    game?.gameType ?? 1
  ) === -1;


const MAX_CARDS_PER_PLAYER =
  isBonusGame
    ? 2
    : 25;


const CARD_COUNT_OPTIONS =
  isBonusGame
    ? [
        2,
        1,
      ]
    : [
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

/* =========================================
   PLAYER GAME SETTINGS
========================================= */

const [
  cardSortMode,
  setCardSortMode,
] = useState(
  () =>
    localStorage.getItem(
      "bingoCardSortMode"
    ) || "off"
);


const [
  gridColumns,
  setGridColumns,
] = useState(
  () => {

    const saved =
      Number(
        localStorage.getItem(
          "bingoGridColumns"
        ) || 2
      );

    return [2, 3, 4].includes(
      saved
    )
      ? saved
      : 2;

  }
);

/* =========================================
   LISTEN TO PLAYER LAYOUT GAME SETTINGS
========================================= */

useEffect(() => {

 const handleResetMarked =
  () => {

    /*
     * Force manual mode so
     * Auto Complete cannot
     * immediately mark them again.
     */

    setManualMarkingEnabled(
      true
    );


    /*
     * Remove all player marks.
     */

    setMarkedNumbers(
      []
    );

  };


  const handleGridChange =
    (event) => {

      const value =
        Number(
          event?.detail
            ?.columns ??
          localStorage.getItem(
            "bingoGridColumns"
          )
        );

      if (
        [2, 3, 4].includes(
          value
        )
      ) {

        setGridColumns(
          value
        );

      }

    };


  const handleSortChange =
    (event) => {

      const mode =
        event?.detail
          ?.mode ||
        localStorage.getItem(
          "bingoCardSortMode"
        ) ||
        "off";


      setCardSortMode(
        mode
      );

    };


  window.addEventListener(
    "bingoResetMarkedNumbers",
    handleResetMarked
  );


  window.addEventListener(
    "bingoGridColumnsChanged",
    handleGridChange
  );


  window.addEventListener(
    "bingoCardSortChanged",
    handleSortChange
  );


  return () => {

    window.removeEventListener(
      "bingoResetMarkedNumbers",
      handleResetMarked
    );

    window.removeEventListener(
      "bingoGridColumnsChanged",
      handleGridChange
    );

    window.removeEventListener(
      "bingoCardSortChanged",
      handleSortChange
    );
  };
}, []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [
  playerInfo,
  setPlayerInfo,
] = useState([]);

const [
  playerInfoLoading,
  setPlayerInfoLoading,
] = useState(false);
  const [
  joiningCardId,
  setJoiningCardId,
] = useState(null);

const [
  claimingCardId,
  setClaimingCardId,
] = useState(null);

const [
  confirmedCardId,
  setConfirmedCardId,
] = useState(null);

const joining =
  joiningCardId !== null;

  const callSoundRef =
  useRef(null);
  

const [
  blockedPlayers,
  setBlockedPlayers,
] = useState([]);

const [
  blockedCards,
  setBlockedCards,
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

const [
  selectedBlockedCard,
  setSelectedBlockedCard,
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


  /* =========================================
     INTERNAL BLOCKED PLAYER DATA
  ========================================= */

  setBlockedPlayers(
    Array.isArray(
      nextState?.blockedPlayers
    )
      ? nextState.blockedPlayers
      : []
  );


  /* =========================================
     PUBLIC BLOCKED CARD DATA
  ========================================= */

  setBlockedCards(
    Array.isArray(
      nextState?.blockedCards
    )
      ? nextState.blockedCards
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
   PLAYER INFORMATION
========================================= */

const loadPlayerInfo =
  useCallback(
    async () => {

      try {

        setPlayerInfoLoading(
          true
        );

        const response =
          await getPlayerInfo();

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to load information"
          );
        }

        setPlayerInfo(
          Array.isArray(
            response.data
          )
            ? response.data
            : []
        );

      } catch (error) {

        console.error(
          "Player info loading error:",
          error
        );

        setPlayerInfo([]);

      } finally {

        setPlayerInfoLoading(
          false
        );
      }
    },
    []
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


useEffect(() => {
  loadPlayerInfo();
}, [loadPlayerInfo]);

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
/* =========================================
   SOCKET.IO
   PUBLIC GAME EVENTS
========================================= */

useEffect(() => {

  if (!gameId) {
    return;
  }


  const socket =
    io(
      SOCKET_URL,
      {
        withCredentials:
          true,

        transports: [
          "websocket",
          "polling",
        ],
      }
    );


  socketRef.current =
    socket;


  socket.on(
    "connect",
    () => {

      console.log(
        "[SOCKET] Connected:",
        socket.id
      );

    }
  );


  /* =========================================
     FALSE BINGO FROM ANY PLAYER
  ========================================= */

  socket.on(
    "bingo:blocked",
    async (
      payload
    ) => {

      if (
        String(
          payload?.gameId
        ) !==
        String(gameId)
      ) {
        return;
      }


      console.log(
        "🚫 FALSE BINGO:",
        payload
      );


      /*
       * Reload authoritative
       * MongoDB game state.
       *
       * This updates blocked cards
       * for EVERY player.
       */
      await fetchGame(
        false
      );

    }
  );


  return () => {

    socket.off(
      "bingo:blocked"
    );

    socket.disconnect();

    socketRef.current =
      null;

  };

}, [
  gameId,
  fetchGame,
]);

useEffect(() => {
  setCardCount(1);
 setBingoConfirmed(false);
setConfirmedCardId(null);
setJoiningCardId(null);
setClaimingCardId(null);

setShowLastCalled(false);

  setBlockedPlayers([]);

  setBlockedCards([]);

  setCardNotification("");

  setMarkedNumbers([]);

  setWinnerData(null);

  setWinnerError("");

  setSelectedWinner(null);
  setSelectedBlockedCard(null);


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

const latestPlayerInfo =
  playerInfo.length > 0
    ? playerInfo[0]
    : null;

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

  /* =========================================
   WINNER CLAIM WINDOW
========================================= */

const winnerClaimCountdown =
  liveGame?.status ===
    "active" &&
  liveGame?.firstWinnerAt &&
  !liveGame?.payoutSettledAt
    ? getRemainingSeconds(
        liveGame?.winnerClaimEndsAt
      )
    : null;


const winnerWindowOpen =
  liveGame?.status ===
    "active" &&
  Boolean(
    liveGame?.firstWinnerAt
  ) &&
  !liveGame?.payoutSettledAt &&
  winnerClaimCountdown !==
    null &&
  winnerClaimCountdown > 0;


const liveWinnerCount =
  Number(
    liveGame?.winnerCount ??
      0
  );


const liveMaxWinners =
  Number(
    liveGame?.maxWinners ??
      10
  );

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
     * While game is waiting,
     * + always opens card selection,
     * even if player already owns cards.
     */
    if (
      game?.status ===
      "waiting"
    ) {

      setCardMenuOpen(
        (current) =>
          !current
      );

      return;
    }


    /*
     * Once game starts,
     * + takes player to their cards.
     */
    if (isJoined) {

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

      return;
    }


    setCardOpen(
      true
    );
  };


const handleChooseCardCount =
  async (count) => {

    if (previewCardsLoading) {
      return;
    }

    setCardMenuOpen(false);

    setInlineCardsOpen(true);

    setPreviewCardsLoading(
      true
    );

    setPreviewCardsError("");

    try {

      /* =========================
         CURRENT CARDS
      ========================= */
const currentCards = [
  ...displayCards,
];


const remainingSlots =
  MAX_CARDS_PER_PLAYER -
  currentCards.length;

if (remainingSlots <= 0) {

        setPreviewCardsError(
          `Maximum ${MAX_CARDS_PER_PLAYER} cards allowed.`
        );

        return;
      }


      /*
       * Example:
       *
       * current = 20
       * clicked = 10
       *
       * only add 5
       */

      const amountToAdd =
        Math.min(
          count,
          remainingSlots
        );


      /* =========================
         LOAD AVAILABLE CARDS
      ========================= */

      const response =
        await getAvailableCards();
        console.log(
  "🔥 AVAILABLE CARDS RESPONSE:",
  response
);

console.log(
  "🔥 RESPONSE DATA:",
  response?.data
);

console.log(
  "🔥 IS DATA ARRAY:",
  Array.isArray(response?.data)
);


      const allCards =
  Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
    ? response.data
    : Array.isArray(
        response?.data?.data
      )
    ? response.data.data
    : [];

console.log(
  "🔥 AVAILABLE CARDS RAW:",
  response
);

console.log(
  "🔥 AVAILABLE CARDS COUNT:",
  allCards.length
);


      /* =========================
         REMOVE ALREADY SELECTED
      ========================= */

      const selectedIds =
        new Set(
          currentCards.map(
            (card) =>
              String(card._id)
          )
        );


      const remainingCards =
        allCards.filter(
          (card) =>
            !selectedIds.has(
              String(card._id)
            )
        );


      if (
        remainingCards.length <
        amountToAdd
      ) {

        throw new Error(
          `Only ${remainingCards.length} more cards are currently available.`
        );
      }


      /* =========================
         RANDOMIZE
      ========================= */

      const shuffled =
        [...remainingCards].sort(
          () =>
            Math.random() -
            0.5
        );


      /* =========================
         ADD NEW CARDS
      ========================= */

      const cardsToAdd =
        shuffled.slice(
          0,
          amountToAdd
        );


      const nextCards = [
        ...currentCards,
        ...cardsToAdd,
      ];


      /* =========================
         SAVE
      ========================= */

      setAvailablePreviewCards(
        shuffled
      );


      setSelectedPreviewCards(
        nextCards
      );


      setCardCount(
        nextCards.length
      );


    } catch (err) {

      console.error(
        "Failed to add cards:",
        err
      );

      /*
       * IMPORTANT:
       * Do NOT remove cards already
       * selected when adding fails.
       */

      setPreviewCardsError(
        err.response?.data
          ?.message ||
          err.message ||
          "Failed to add Bingo cards"
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

    handleChooseCardCount(
      1
    );

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
   CARD LEVEL STATUS
========================================= */

const blockedCardIds =
  useMemo(() => {

    const ids =
      new Set();

    blockedPlayers.forEach(
      (blockedPlayer) => {

        const blockedCards =
          Array.isArray(
            blockedPlayer?.cards
          )
            ? blockedPlayer.cards
            : [];

        blockedCards.forEach(
          (card) => {

            const id =
              card?._id ??
              card?.id;

            if (id) {
              ids.add(
                String(id)
              );
            }

          }
        );

      }
    );

    return ids;

  }, [
    blockedPlayers,
  ]);


const getCardId = (
  card
) =>
  String(
    card?._id ??
    card?.id ??
    ""
  );


const isCardBlocked = (
  card
) =>
  blockedCardIds.has(
    getCardId(card)
  );

const isCardJoined = (
  card
) => {

  const cardId =
    getCardId(card);

  return cards.some(
    (joinedCard) =>
      getCardId(
        joinedCard
      ) === cardId
  );

};


const isCardWinner = (
  card
) => {

    const winningCardId =
      gamePlayer?.winningCardId?._id ??
      gamePlayer?.winningCardId ??
      confirmedCardId;

    if (!winningCardId) {
      return false;
    }

    return (
      String(
        winningCardId
      ) ===
      getCardId(card)
    );

  };


/* =========================================
   DISPLAY CARDS
   JOINED + PREVIEW CARDS
========================================= */

const previewCardIds =
  new Set(
    selectedPreviewCards.map(
      (card) =>
        getCardId(card)
    )
  );


const displayCards = [
  ...selectedPreviewCards,

  ...cards.filter(
    (card) =>
      !previewCardIds.has(
        getCardId(card)
      )
  ),
];

/* =========================================
   CARD SORT HELPERS
========================================= */

const sortCalledSet =
  useMemo(
    () =>
      new Set(
        calledNumbers
          .map((number) =>
            Number(number)
          )
          .filter((number) =>
            Number.isFinite(
              number
            )
          )
      ),
    [calledNumbers]
  );


/* =========================================
   NORMALIZE CARD TO DISPLAY 5 x 5
========================================= */

const getCardMatrix =
  (card) => {

    const numbers =
      card?.numbers;


    if (
      !Array.isArray(
        numbers
      )
    ) {
      return [];
    }


    /* Flat 25-number card */

    if (
      numbers.length === 25 &&
      numbers.every(
        (value) =>
          !Array.isArray(
            value
          )
      )
    ) {

      return Array.from(
        {
          length: 5,
        },
        (_, rowIndex) =>
          numbers
            .slice(
              rowIndex * 5,
              rowIndex * 5 + 5
            )
            .map((value) =>
              Number(value)
            )
      );

    }


    /* Must be 5 x 5 */

    if (
      numbers.length !== 5 ||
      !numbers.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 5
      )
    ) {
      return [];
    }


    /*
     * Detect database orientation:
     *
     * [
     *   [B,B,B,B,B],
     *   [I,I,I,I,I],
     *   [N,N,N,N,N],
     *   [G,G,G,G,G],
     *   [O,O,O,O,O]
     * ]
     */

    const ranges = [
      [1, 15],
      [16, 30],
      [31, 45],
      [46, 60],
      [61, 75],
    ];


    const columnOriented =
      numbers.every(
        (
          group,
          groupIndex
        ) => {

          const [
            min,
            max,
          ] =
            ranges[
              groupIndex
            ];


          return group.every(
            (
              value,
              valueIndex
            ) => {

              /*
               * FREE CENTER
               */

              if (
                groupIndex === 2 &&
                valueIndex === 2
              ) {
                return true;
              }


              const numericValue =
                Number(value);


              return (
                Number.isFinite(
                  numericValue
                ) &&
                numericValue >= min &&
                numericValue <= max
              );

            }
          );

        }
      );


    const matrix =
      columnOriented
        ? Array.from(
            {
              length: 5,
            },
            (
              _,
              rowIndex
            ) =>
              Array.from(
                {
                  length: 5,
                },
                (
                  __,
                  columnIndex
                ) =>
                  numbers[
                    columnIndex
                  ][
                    rowIndex
                  ]
              )
          )
        : numbers;


    return matrix.map(
      (row) =>
        row.map(
          (value) =>
            Number(value)
        )
    );

  };


/* =========================================
   CELL MATCH
========================================= */

const isSortCellMatched =
  (
    matrix,
    row,
    column
  ) => {

    /*
     * FREE center always counts.
     */

    if (
      row === 2 &&
      column === 2
    ) {
      return true;
    }


    const number =
      Number(
        matrix?.[
          row
        ]?.[
          column
        ]
      );


    return (
      Number.isFinite(
        number
      ) &&
      sortCalledSet.has(
        number
      )
    );

  };


/* =========================================
   TOTAL CALLED NUMBERS ON THIS CARD
========================================= */

const getMostCalledScore =
  (card) => {

    const matrix =
      getCardMatrix(
        card
      );


    if (
      matrix.length !== 5
    ) {
      return 0;
    }


    let matched =
      0;


    for (
      let row = 0;
      row < 5;
      row += 1
    ) {

      for (
        let column = 0;
        column < 5;
        column += 1
      ) {

        /*
         * Don't count FREE
         * as a called number.
         */

        if (
          row === 2 &&
          column === 2
        ) {
          continue;
        }


        if (
          isSortCellMatched(
            matrix,
            row,
            column
          )
        ) {

          matched += 1;

        }

      }

    }


    return matched;

  };


/* =========================================
   COUNT ONE SHAPE
========================================= */

const countShapeMatches =
  (
    matrix,
    cells
  ) => {

    return cells.reduce(
      (
        total,
        [
          row,
          column,
        ]
      ) =>
        total +
        (
          isSortCellMatched(
            matrix,
            row,
            column
          )
            ? 1
            : 0
        ),
      0
    );

  };


/* =========================================
   STANDARD LINE SHAPES
   5 horizontal
   5 vertical
   2 diagonal
========================================= */

const LINE_PATTERNS =
  (() => {

    const patterns =
      [];


    for (
      let index = 0;
      index < 5;
      index += 1
    ) {

      /* Horizontal */

      patterns.push(
        Array.from(
          {
            length: 5,
          },
          (
            _,
            column
          ) => [
            index,
            column,
          ]
        )
      );


      /* Vertical */

      patterns.push(
        Array.from(
          {
            length: 5,
          },
          (
            _,
            row
          ) => [
            row,
            index,
          ]
        )
      );

    }


    /* Diagonal \ */

    patterns.push(
      Array.from(
        {
          length: 5,
        },
        (
          _,
          index
        ) => [
          index,
          index,
        ]
      )
    );


    /* Diagonal / */

    patterns.push(
      Array.from(
        {
          length: 5,
        },
        (
          _,
          index
        ) => [
          index,
          4 - index,
        ]
      )
    );


    return patterns;

  })();


/* =========================================
   2 x 2 SQUARES
========================================= */

const SQUARE_PATTERNS =
  (() => {

    const patterns =
      [];


    for (
      let row = 0;
      row < 4;
      row += 1
    ) {

      for (
        let column = 0;
        column < 4;
        column += 1
      ) {

        patterns.push([
          [
            row,
            column,
          ],
          [
            row,
            column + 1,
          ],
          [
            row + 1,
            column,
          ],
          [
            row + 1,
            column + 1,
          ],
        ]);

      }

    }


    return patterns;

  })();


/* =========================================
   RECTANGLES
   2 x 3 and 3 x 2
========================================= */

const RECTANGLE_PATTERNS =
  (() => {

    const patterns =
      [];


    const sizes = [
      [2, 3],
      [3, 2],
    ];


    sizes.forEach(
      ([
        height,
        width,
      ]) => {

        for (
          let row = 0;
          row <=
          5 - height;
          row += 1
        ) {

          for (
            let column = 0;
            column <=
            5 - width;
            column += 1
          ) {

            const cells =
              [];


            for (
              let r = 0;
              r < height;
              r += 1
            ) {

              for (
                let c = 0;
                c < width;
                c += 1
              ) {

                cells.push([
                  row + r,
                  column + c,
                ]);

              }

            }


            patterns.push(
              cells
            );

          }

        }

      }
    );


    return patterns;

  })();


/* =========================================
   + CROSS
========================================= */

const CROSS_PATTERNS = [
  [
    [0, 2],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3],
    [2, 4],
    [3, 2],
    [4, 2],
  ],
];


/* =========================================
   X SHAPE
========================================= */

const X_PATTERNS = [
  [
    [0, 0],
    [0, 4],

    [1, 1],
    [1, 3],

    [2, 2],

    [3, 1],
    [3, 3],

    [4, 0],
    [4, 4],
  ],
];


/* =========================================
   FOUR CORNERS
========================================= */

const FOUR_CORNER_PATTERNS = [
  [
    [0, 0],
    [0, 4],
    [4, 0],
    [4, 4],
  ],
];


/* =========================================
   T SHAPES
   Supports all 4 rotations
========================================= */

const T_PATTERNS = [

  /* T */

  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],

    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
  ],


  /* upside-down T */

  [
    [4, 0],
    [4, 1],
    [4, 2],
    [4, 3],
    [4, 4],

    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
  ],


  /* T facing right */

  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],

    [2, 1],
    [2, 2],
    [2, 3],
    [2, 4],
  ],


  /* T facing left */

  [
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 4],
    [4, 4],

    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3],
  ],

];


/* =========================================
   SCORE A SET OF POSSIBLE SHAPES
========================================= */

const getPatternScore =
  (
    card,
    patterns
  ) => {

    const matrix =
      getCardMatrix(
        card
      );


    if (
      matrix.length !== 5 ||
      patterns.length === 0
    ) {
      return 0;
    }


    const results =
      patterns.map(
        (cells) => {

          const matched =
            countShapeMatches(
              matrix,
              cells
            );


          return {
            matched,

            complete:
              matched ===
              cells.length,
          };

        }
      );


    const completedShapes =
      results.filter(
        (result) =>
          result.complete
      ).length;


    const bestShape =
      Math.max(
        0,
        ...results.map(
          (result) =>
            result.matched
        )
      );

    const totalCalled =
      getMostCalledScore(
        card
      );

   return (
  completedShapes *
    1000000 +

  bestShape *
    10000 +

  totalCalled
);

  };


/* =========================================
   SCORE CARD BY SELECTED SORT MODE
========================================= */

const getCardSortScore =
  (
    card,
    mode
  ) => {

    switch (
      mode
    ) {

      case "most_called":

        return getMostCalledScore(
          card
        );


      case "lines":

        return getPatternScore(
          card,
          LINE_PATTERNS
        );


      case "squares":

        return getPatternScore(
          card,
          SQUARE_PATTERNS
        );


      case "rectangles":

        return getPatternScore(
          card,
          RECTANGLE_PATTERNS
        );


      case "cross":

        return getPatternScore(
          card,
          CROSS_PATTERNS
        );


      case "t_shape":

        return getPatternScore(
          card,
          T_PATTERNS
        );


      case "x_shape":

        return getPatternScore(
          card,
          X_PATTERNS
        );


      case "four_corners":

        return getPatternScore(
          card,
          FOUR_CORNER_PATTERNS
        );


      default:

        return 0;

    }

  };


/* =========================================
   SORT DISPLAY CARDS
========================================= */

const sortedDisplayCards =
  cardSortMode === "off"

    ? displayCards

    : [...displayCards]
        .sort(
          (
            firstCard,
            secondCard
          ) => {

            const firstScore =
              getCardSortScore(
                firstCard,
                cardSortMode
              );


            const secondScore =
              getCardSortScore(
                secondCard,
                cardSortMode
              );


            if (
              secondScore !==
              firstScore
            ) {

              return (
                secondScore -
                firstScore
              );

            }


            /*
             * Stable tie breaker:
             * card number.
             */

            return String(
              firstCard
                ?.cardNumber ||
                ""
            ).localeCompare(
              String(
                secondCard
                  ?.cardNumber ||
                  ""
              ),
              undefined,
              {
                numeric: true,
              }
            );

          }
        );
/* =========================================
   MY ACCEPTED BINGO STATUS
========================================= */

useEffect(() => {

  setBingoConfirmed(
    gamePlayer?.status ===
      "won"
  );

}, [
  gamePlayer?.status,
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
  liveGame?.status ===
    "completed";

  if (
    !gameFinished
  ) {
    return;
  }

  fetchGameWinners();

}, [
  liveGame?.status,
  isJoined,
  fetchGameWinners,
]);

const totalJoinFee =
  Number(
    game?.entryFee || 0
  ) * cardCount;

  /* =========================================
   JOIN ONE CARD
========================================= */

const handleJoinCard =
  async (card) => {

    if (!gameId) {
      return;
    }

    const cardId =
      getCardId(card);

    if (!cardId) {
      setError(
        "Invalid Bingo card."
      );

      return;
    }


    if (
      liveGame?.status !==
      "waiting"
    ) {
      setError(
        "This game is no longer accepting players."
      );

      return;
    }


    try {

      setJoiningCardId(
        cardId
      );

      setError("");
      setMessage("");
      setPreviewCardsError("");


      /*
       * IMPORTANT:
       * The API will be changed next
       * to send this exact cardId.
       */
      const response =
        await joinGame(
          gameId,
          cardId
        );


      if (
        !response?.success
      ) {
        throw new Error(
          response?.message ||
            "Failed to join card"
        );
      }


      setMessage(
        `Card ${card.cardNumber} joined successfully.`
      );

      await fetchGame(
        true
      );

    } catch (err) {

      console.error(
        "JOIN CARD ERROR:",
        err
      );

      setError(
        err.response?.data
          ?.message ||
          err.message ||
          "Failed to join Bingo card"
      );

    } finally {

      setJoiningCardId(
        null
      );

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
   CLAIM BINGO FOR ONE CARD
========================================= */

const handleClaimBingo =
  async (card) => {

    if (!isJoined) {

      setCardNotification(
        "You must join the game first."
      );

      return;
    }


    const cardId =
      getCardId(card);


    if (!cardId) {

      setCardNotification(
        "Invalid Bingo card."
      );

      return;
    }


    /*
     * Only THIS card is checked.
     */
    if (
      isCardBlocked(card)
    ) {

      setCardNotification(
        `Card ${card.cardNumber} is blocked from claiming Bingo.`
      );

      return;
    }


    if (
      bingoConfirmed
    ) {

      setCardNotification(
        "Your Bingo has already been accepted."
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

      setClaimingCardId(
        cardId
      );

      setMessage("");
      setError("");
      setCardNotification(
        ""
      );


      /*
       * We will update games.api.js
       * next so cardId is sent to backend.
       */
      const response =
        await claimBingo(
          gameId,
          cardId
        );


      /* =====================================
         FALSE BINGO - THIS CARD ONLY
      ====================================== */

      if (
        response?.code ===
        "FALSE_BINGO"
      ) {


        /*
         * Reload backend state.
         * blockedCardIds will make ONLY
         * this card show BLOCKED.
         */
        await fetchGame(
          true
        );

        return;
      }


      /* =====================================
         VALID BINGO
      ====================================== */

      if (
        response?.code ===
        "BINGO_WIN"
      ) {

        const winner =
          response?.data
            ?.winner;


        setConfirmedCardId(
          winner?.cardId ||
            cardId
        );


        /*
         * One player can only become
         * one accepted winner.
         */
        setBingoConfirmed(
          true
        );


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
          winner?.cardNumber ||
          card.cardNumber;


        setMessage(
          `🎉 BINGO accepted! Card ${winningCard}. Waiting for other winners...`
        );


        await fetchGame(
          true
        );

        return;
      }


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


      /*
       * THIS CARD WAS ALREADY BLOCKED
       */
      if (
        backendResponse?.code ===
        "BINGO_BLOCKED"
      ) {

        setCardNotification(
          backendResponse
            ?.message ||
            `Card ${card.cardNumber} is blocked.`
        );


        await fetchGame(
          true
        );

        return;
      }


      if (
        backendResponse?.code ===
        "GAME_FINISHED"
      ) {

        setCardNotification(
          backendResponse
            ?.message ||
            "The Bingo winner window has closed."
        );


        await fetchGame(
          true
        );

        return;
      }


      setCardNotification(
        backendResponse
          ?.message ||
          err.message ||
          "Failed to submit Bingo."
      );


    } finally {

      setClaimingCardId(
        null
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
  ? t("game.hide")
  : t("game.show")}

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
      <div className="bingo-info-demo">

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
    </span>
  </button>
  

</div>

  
{/* =====================================
    ADMIN INFORMATION
===================================== */}

{playerInfoLoading ? (

  <div className="bingo-admin-info-loading">
    {t("game.info")}:{" "}
{latestPlayerInfo.content}
  </div>

) : latestPlayerInfo ? (

  <div
    className={[
      "bingo-admin-info",
      `bingo-admin-info-${latestPlayerInfo.category}`,
    ].join(" ")}
  >
    
    <p className="bingo-admin-info-content">
      Info:-
      {latestPlayerInfo.content}
    </p>

  </div>

) : null}
<div class="bingo-history-header">
    

    <div className="bingo-live-icon">
      <QrCode size={19} />
    </div>

    <div className="bingo-game-main-details">

      <strong>
        {liveGame?.name ||
          game.name}
      </strong>

      

    </div>
    <span className="bingo-game-status">
      {t("game.status")}:{" "}

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
  <div className="bingo-info-stats">

  {/* PRICE */}
  <div>
    <Coins size={16} />

    <span>
      {t("game.price")}
    </span>

    <strong>
  {Number(
    liveGame?.gameType ??
      game?.gameType ??
      1
  ) === -1
    ? `0 ${t("game.birr")}`
    : `${
        liveGame?.entryFee ??
        game?.entryFee ??
        0
      } ${t("game.birr")}`}
</strong>
  </div>


  {/* GAME TYPE */}
  <div>
    <Gamepad2 size={16} />

    <span>
      {t("game.gameType")}
    </span>

    <strong
      className={
        Number(
          liveGame?.gameType ??
            game?.gameType ??
            1
        ) === -1
          ? "bingo-game-type bonus"
          : "bingo-game-type normal"
      }
    >
      {Number(
        liveGame?.gameType ??
          game?.gameType ??
          1
      ) === -1
        ? "-1"
        : "1"}
    </strong>
  </div>

  {/* PRIZE */}
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
      {t("game.birr")}
    </strong>
  </div>

</div>

</section>
)}
{/* =====================================
    PUBLIC FALSE BINGO CARDS
====================================== */}

{blockedCards.length > 0 && (

  <section className="bingo-winners-section bingo-blocked-cards-section">



    <div className="bingo-winner-grid">

      {blockedCards
        .slice(0, 16)
        .map(
          (
            blocked,
            index
          ) => {

            const isMyBlockedCard =
              String(
                blocked?.gamePlayerId
              ) ===
              String(
                gamePlayer?._id
              );


            return (

              <button
                type="button"
                key={
                  blocked?.card?.id ||
                  blocked?.card?._id ||
                  `${blocked?.gamePlayerId}-${index}`
                }
                className={`bingo-winner-card-button ${
                  isMyBlockedCard
                    ? "mine"
                    : ""
                }`}
                onClick={() =>
                  setSelectedBlockedCard(
                    blocked
                  )
                }
              >

                <AlertCircle
                  size={14}
                />


                <span>
                  {blocked?.card
                    ?.cardNumber ||
                    `${t("game.card")} ${index + 1}`}
                </span>


                {isMyBlockedCard && (

                  <small>
                    {t("game.you")}
                  </small>

                )}

              </button>

            );

          }
        )}

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
          BINGO 1-75 BOARD
      ====================================== */}
{!cardFocusMode && (
      <section className="bingo-board-card">

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

     {(inlineCardsOpen ||
    isJoined) && (

        <section
          id="bingo-inline-card-selection"
          className="bingo-inline-card-section"
        >
          


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

{displayCards.length > 0 && (

  <div
    className="bingo-inline-card-grid"
    style={{
      gridTemplateColumns:
        `repeat(${gridColumns}, minmax(0, 1fr))`,
    }}
  >

  {sortedDisplayCards.map(
  (
    card,
    index
  ) => {

    const cardId =
      getCardId(card);

    const cardJoined =
      isCardJoined(card);

    const cardBlocked =
      cardJoined &&
      isCardBlocked(card);

    const cardWinner =
      cardJoined &&
      isCardWinner(card);

    const cardJoining =
      joiningCardId ===
      cardId;

    const cardClaiming =
      claimingCardId ===
      cardId;


    return (

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


                    {!cardJoined &&
  liveGame?.status ===
    "waiting" && (

  <button
    type="button"
    className="bingo-inline-card-remove"
    onClick={() =>
      handleRemovePreviewCard(
        card._id
      )
    }
    aria-label={t("game.removeCard")}
  >
    <X size={21} />
  </button>

)}

                  </div>


{/* =============================
    CARD JOIN ACTION
============================= */}

<div className="bingo-inline-card-actions">

  <button
    type="button"

    className={[
      "bingo-claim-button",

      !cardJoined
        ? "bingo-button-join"
        : "",

      cardBlocked
        ? "bingo-button-blocked"
        : "",

      cardWinner
        ? "bingo-button-confirmed"
        : "",
    ]
      .filter(Boolean)
      .join(" ")}

    onClick={() => {

      if (cardJoined) {

        handleClaimBingo(
          card
        );

      } else {

        handleJoinCard(
          card
        );

      }

    }}

    disabled={
      cardJoining ||
      cardClaiming ||

      (
        !cardJoined &&
        liveGame?.status !==
          "waiting"
      ) ||

      (
        cardJoined &&
        (
          liveGame?.status !==
            "active" ||
          cardBlocked ||
          cardWinner ||
          bingoConfirmed
        )
      )
    }
  >

    {cardJoining ||
    cardClaiming ? (

      <LoaderCircle
        size={21}
        className="spin bingo-pending-icon"
      />

    ) : cardWinner ? (

  <span className="bingo-confirm-content">

    <CircleCheckBig
      size={22}
      strokeWidth={3}
    />

    <span>
      {t("game.winner")}
    </span>

  </span>

) : cardBlocked ? (

  t("game.bingoBlocked")

) : cardJoined ? (

  t("game.bingo")

) : (

  t("game.join")

)}

  </button>

</div>


{/* CARD BODY */}

<div className="bingo-inline-card-body">

                    <BingoCard
  numbers={
    card.numbers
  }

  calledNumbers={
    cardJoined
      ? calledNumbers
      : []
  }

  markedNumbers={
    cardJoined
      ? markedNumbers
      : []
  }

  manualMarkingEnabled={
    cardJoined
      ? manualMarkingEnabled
      : false
  }

  onNumberClick={
    cardJoined
      ? handleCardNumberClick
      : undefined
  }
/>

                  </div>

                </article>

    );
  }
)}
{/* LOADING NEW CARD */}

{previewCardsLoading && (

  <article className="bingo-inline-card-item bingo-inline-loading-card">

    <div className="bingo-inline-card-loading-inner">

      <LoaderCircle
        size={28}
        className="spin"
      />

      <strong>
  {t("game.loadingCard")}
</strong>

<span>
  {t(
    "game.currentCardsStayActive"
  )}
</span>

    </div>

  </article>

)}

            </div>

          )}


          {/* ADD CARD */}
<div 
className="bingo-inline-card-grid"
>
          {!previewCardsLoading &&
  displayCards.length <
MAX_CARDS_PER_PLAYER && (

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

              {t("game.addCard")}

            </button>

          )}
          </div>

        </section>

      )}




{/* =====================================
    MY JOINED CARDS
    INLINE BELOW BINGO BOARD
===================================== */}

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

  {game?.status ===
    "waiting" &&
  cards.length <
    MAX_CARDS_PER_PLAYER && (

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
  liveGame?.status ===
    "completed"
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
  (
    card,
    index
  ) => (

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

        <strong>
  {selectedWinner.prizeAmount || 0}{" "}
  {t("game.birr")}
</strong>

      </div>


      <select
  className="bingo-card-count-select"
  value=""
  onChange={(event) => {

    const count =
      Number(
        event.target.value
      );

    if (!count) {
      return;
    }

    handleChooseCardCount(
      count
    );

  }}
  disabled={
    joining ||
    previewCardsLoading ||
    displayCards.length >=
  MAX_CARDS_PER_PLAYER
  }
>

  <option
    value=""
    disabled
  >
    {t("game.addCards")}
  </option>

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

  <strong className="bingo-card-total">
  {totalJoinFee}{" "}
  {t("game.birr")}
</strong>
</div>

    </div>

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
    BLOCKED CARD DETAIL POPUP
========================================= */}

{selectedBlockedCard && (

  <div
    className="bingo-winner-detail-overlay"
    onClick={() =>
      setSelectedBlockedCard(
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
            {t("game.falseBingo")}
          </span>


          <strong className="bingo-winner-phone">
           {t("game.card")}{" "}
  {selectedBlockedCard?.card?.cardNumber || "-"}
          </strong>


          <small>
            {selectedBlockedCard
              ?.player
              ?.fullName ||
              t("game.player")}
          </small>

        </div>


        <button
          type="button"
          className="bingo-winner-detail-close"
          onClick={() =>
            setSelectedBlockedCard(
              null
            )
          }
        >

          <X size={20} />

        </button>

      </div>


      {/* BLOCK INFORMATION */}

      <div className="bingo-winner-summary">

        <div>

          <span>
            {t("game.blockedCard")}
          </span>

          <strong>
            {selectedBlockedCard
              ?.card
              ?.cardNumber ||
              "-"}
          </strong>

        </div>


        <div>

          <span>
            {t("game.reason")}
          </span>

          <strong>
            {selectedBlockedCard
  ?.blockedReason ||
  t("game.falseBingo")}
          </strong>

        </div>

      </div>


      {/* ACTUAL BLOCKED CARD */}

      {selectedBlockedCard
        ?.card
        ?.numbers && (

        <div className="bingo-winner-actual-card">

          <BingoCard
            numbers={
              selectedBlockedCard
                .card
                .numbers
            }

            calledNumbers={
              calledNumbers
            }

            markedNumbers={
              []
            }

            manualMarkingEnabled={
              false
            }
          />

        </div>

      )}


      <div className="bingo-winner-detail-note">

  {t("game.blockedCardNote")}

</div>

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
  {t("game.total")}:{" "}
  {totalJoinFee}{" "}
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