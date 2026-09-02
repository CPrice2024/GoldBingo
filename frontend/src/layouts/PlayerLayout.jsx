import {
  useEffect,
  useState,
} from "react";
import {
  getMyWallet,
} from "../api/wallet.api";
import {
  registerPushNotifications,
} from "../services/pushNotifications";
import {
  Bell,
  Gamepad2,
  LogOut,
  User,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  ReceiptText,
  Menu,
  X,
  Globe,
  Check,
  ChevronDown,
  FileText,
  Settings,
  ChevronRight,
  RefreshCw,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from "lucide-react";
import PlayerSidebarSlider from "../components/player/PlayerSidebarSlider";
import { useLanguage } from "../context/LanguageContext";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useNotifications } from "../context/NotificationContext";
import PlayerAvatar from "../components/PlayerAvatar";

const PlayerLayout = () => {
  const { user, logout } = useAuth();

  const {
    language,
    languages,
    changeLanguage,
    t,
  } = useLanguage();

  const navigate =
  useNavigate();

  const { unreadCount } =
  useNotifications();

/* =========================================
   GAME SETTINGS
========================================= */

const [
  gameSettingsOpen,
  setGameSettingsOpen,
] = useState(false);
const [
  sortDropdownOpen,
  setSortDropdownOpen,
] = useState(false);
const [
  gridDropdownOpen,
  setGridDropdownOpen,
] = useState(false);


const [
  colorDropdownOpen,
  setColorDropdownOpen,
] = useState(false);


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
  () =>
    Number(
      localStorage.getItem(
        "bingoGridColumns"
      ) || 2
    )
);


const [
  autoComplete,
  setAutoComplete,
] = useState(
  () =>
    localStorage.getItem(
      "bingoManualMarkingEnabled"
    ) === "true"
);


const [
  selectionColor,
  setSelectionColor,
] = useState(
  () =>
    localStorage.getItem(
      "bingoSelectionColor"
    ) || "green"
);


const GAME_SORT_OPTIONS = [
  {
    id: "off",
    label: "Off",
  },
  {
    id: "lines",
    label: "By Lines",
  },
  {
    id: "most_called",
    label: "By Most Called",
  },
  {
    id: "squares",
    label: "By Squares",
  },
  {
    id: "rectangles",
    label:
      "By Rectangles",
  },
  {
    id: "cross",
    label: "By + Cross",
  },
  {
    id: "t_shape",
    label: "By T-shape",
  },
  {
    id: "x_shape",
    label: "By X-shape",
  },
  {
    id: "four_corners",
    label: "By 4 Corners",
  },
];


const SELECTION_COLORS = {
  green: "#43c765",
  blue: "#3981f1",
  gold: "#d4a72c",
  red: "#ef4444",
  pink: "#ec4899",
};

  const [
  profileDrawerOpen,
  setProfileDrawerOpen,
] = useState(false);
  
  const [languageOpen, setLanguageOpen] =
  useState(false);
  const [
  themeOpen,
  setThemeOpen,
] = useState(false);
  const [
  theme,
  setTheme,
] = useState(
  () =>
    localStorage.getItem(
      "playerTheme"
    ) || "day"
);


const [
  soundEnabled,
  setSoundEnabled,
] = useState(
  () =>
    localStorage.getItem(
      "bingoSoundEnabled"
    ) !== "false"
);
const [
  wallet,
  setWallet,
] = useState(null);


const [
  walletLoading,
  setWalletLoading,
] = useState(false);


const [
  walletError,
  setWalletError,
] = useState("");


useEffect(() => {

  document.documentElement
    .setAttribute(
      "data-theme",
      theme
    );

  localStorage.setItem(
    "playerTheme",
    theme
  );

}, [theme]);


const handleSoundToggle =
  () => {

    const next =
      !soundEnabled;

    setSoundEnabled(
      next
    );

    localStorage.setItem(
      "bingoSoundEnabled",
      String(next)
    );

    window.dispatchEvent(
      new Event(
        "bingoSoundChanged"
      )
    );

  };
  
  /* =========================================
   LOAD PLAYER WALLET
========================================= */

const loadWallet =
  async () => {

    try {

      setWalletLoading(true);

      setWalletError("");


      const result =
        await getMyWallet();


      if (!result?.success) {

        throw new Error(
          result?.message ||
          "Failed to load wallet"
        );

      }


      setWallet(
        result.data ||
        null
      );


    } catch (error) {

      console.error(
        "Wallet loading error:",
        error
      );


      setWalletError(
        error.response?.data
          ?.message ||
        error.message ||
        "Failed to load wallet"
      );


    } finally {

      setWalletLoading(false);

    }

  };

  const handleProfileRefresh =
  async () => {

    await loadWallet();

    setProfileDrawerOpen(
      false
    );

    navigate(
      "/player/play"
    );

  };
/* =========================================
   GAME SETTINGS HANDLERS
========================================= */

const handleCardSortModeChange =
  (mode) => {

    setCardSortMode(
      mode
    );


    localStorage.setItem(
      "bingoCardSortMode",
      mode
    );


    window.dispatchEvent(
      new CustomEvent(
        "bingoCardSortChanged",
        {
          detail: {
            mode,
          },
        }
      )
    );

  };


const handleResetMarkedNumbers =
  () => {

    window.dispatchEvent(
      new Event(
        "bingoResetMarkedNumbers"
      )
    );

  };

const handleSelectMultipleCards =
  () => {

    setGameSettingsOpen(
      false
    );


    window.dispatchEvent(
      new Event(
        "bingoOpenMultiCardSelect"
      )
    );

  };


const handleGridColumnsChange =
  (columns) => {

    const value =
      Number(columns);


    setGridColumns(
      value
    );


    localStorage.setItem(
      "bingoGridColumns",
      String(value)
    );


    window.dispatchEvent(
      new CustomEvent(
        "bingoGridColumnsChanged",
        {
          detail: {
            columns:
              value,
          },
        }
      )
    );

  };


const handleAutoCompleteToggle =
  () => {

    const next =
      !autoComplete;


    setAutoComplete(
      next
    );


    /*
     * Auto Complete ON
     * means manual marking OFF.
     */

    localStorage.setItem(
      "bingoManualMarkingEnabled",
      String(!next)
    );


    window.dispatchEvent(
      new Event(
        "bingoManualMarkingChanged"
      )
    );

  };


const handleSelectionColorChange =
  (color) => {

    setSelectionColor(
      color
    );


    localStorage.setItem(
      "bingoSelectionColor",
      color
    );


    document.documentElement
      .style
      .setProperty(
        "--bingo-selection-color",
        SELECTION_COLORS[
          color
        ] ||
          SELECTION_COLORS.green
      );


    window.dispatchEvent(
      new CustomEvent(
        "bingoSelectionColorChanged",
        {
          detail: {
            color,
          },
        }
      )
    );

  };
  /* =========================================
   REFRESH WALLET WHEN DRAWER OPENS
========================================= */

useEffect(() => {

  if (!profileDrawerOpen) {
    return;
  }


  loadWallet();

}, [profileDrawerOpen]);


useEffect(() => {

  if (!user) {
    return;
  }


  registerPushNotifications();

}, [
  user?._id,
]);


useEffect(() => {

  document.documentElement
    .style
    .setProperty(
      "--bingo-selection-color",
      SELECTION_COLORS[
        selectionColor
      ] ||
        SELECTION_COLORS.green
    );

}, [
  selectionColor,
]);

/* =========================================
   WALLET BALANCE CALCULATION
========================================= */

const depositBalance =
  Number(
    wallet?.balance || 0
  );


const winningBalance =
  Number(
    wallet?.winningBalance || 0
  );


const reservedWinningBalance =
  Number(
    wallet?.reservedWinningBalance ||
    0
  );


/*
 * Total money owned by player:
 * deposit + winnings
 */
const totalBalance =
  depositBalance +
  winningBalance;


/*
 * Only winnings not already
 * reserved for withdrawal.
 */
const withdrawableBalance =
  Number(
    wallet?.withdrawableWinningBalance ??
    Math.max(
      0,
      winningBalance -
        reservedWinningBalance
    )
  );


const formatMoney =
  (value) =>
    Number(
      value || 0
    ).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

 const navigation = [
  
  {
    label: t("navigation.play"),
    path: "/player/play",
    icon: Gamepad2,
  },
  {
    label: t("navigation.wallet"),
    path: "/player/wallet",
    icon: Wallet,
  },
  {
    label: t("navigation.deposit"),
    path: "/player/deposit",
    icon: ArrowDownToLine,
  },
  {
    label: t("navigation.withdraw"),
    path: "/player/withdraw",
    icon: ArrowUpFromLine,
  },
  {
    label: t("navigation.transactions"),
    path: "/player/transactions",
    icon: ReceiptText,
  },
  {
    label: t("navigation.notifications"),
    path: "/player/notifications",
    icon: Bell,
  },
  {
    label: t("navigation.profile"),
    path: "/player/profile",
    icon: User,
  },
];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="player-app">
      <aside className="player-sidebar player-desktop-sidebar">
        <PlayerSidebarSlider />

        <nav className="player-navigation">
          {navigation.map(
            ({
              label,
              path,
              icon: Icon,
            }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() =>
                  setProfileDrawerOpen(false)
                }
                className={({ isActive }) =>
                  `player-nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                <Icon size={19} />
                <span>{label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="player-sidebar-bottom">

  {/* TERMS */}

  <NavLink
  to="/player/terms"
  className="player-terms-link"
  onClick={() =>
    setProfileDrawerOpen(false)
  }
>
  <FileText size={19} />

  <span>
    Terms & Conditions
  </span>
</NavLink>


  {/* TELEGRAM SUPPORT */}

  <a
    href="https://t.me/goldbingo75"
    target="_blank"
    rel="noopener noreferrer"
    className="player-telegram-support"
    onClick={() =>
      setProfileDrawerOpen(false)
    }
  >
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M21.944 2.506a1.5 1.5 0 0 0-1.54-.214L2.724 9.065c-1.227.469-1.21 1.158-.224 1.46l4.537 1.416 10.5-6.625c.496-.302.95-.14.577.191l-8.508 7.68-.331 4.81c.484 0 .697-.221.968-.485l2.324-2.258 4.833 3.57c.891.491 1.532.239 1.754-.826l2.998-14.13c.307-1.23-.47-1.787-.208-1.362Z"
      />
    </svg>

    <span>
      Ask support
    </span>
  </a>


  {/* LOGOUT */}

  <button
    className="player-logout"
    onClick={handleLogout}
  >
    <LogOut size={19} />

    <span>
      {t("navigation.logout")}
    </span>
  </button>

</div>
      </aside>

      

      <div className="player-main">

        <header className="player-topbar">
          

          <div>
            <h1>
  {user?.fullName
    ? `${t("common.welcome")}, ${user.fullName}`
    : t("common.welcome")}
</h1>



            <p>
              Play & Win now
            </p>
          </div>

          <div className="player-topbar-actions">

  <div className="player-language">

    <button
      type="button"
      className="player-language-button"
      onClick={() =>
        setLanguageOpen(
          (prev) => !prev
        )
      }
    >
      <Globe size={18} />

      <span>
        {languages[language]?.nativeName}
      </span>

      <ChevronDown
        size={15}
        className={
          languageOpen
            ? "language-chevron-open"
            : ""
        }
      />
    </button>

    {languageOpen && (
      <div className="player-language-dropdown">

        <div className="player-language-title">
          <Globe size={15} />
          <span>
            {languages[language]?.name}
          </span>
        </div>

        {Object.values(languages).map(
          (item) => (
            <button
              key={item.code}
              type="button"
              className={`player-language-option ${
                language === item.code
                  ? "selected"
                  : ""
              }`}
              onClick={() => {
                changeLanguage(
                  item.code
                );

                setLanguageOpen(false);
              }}
            >
              <span>
                {item.nativeName}
              </span>

              {language ===
                item.code && (
                <Check size={16} />
              )}
            </button>
          )
        )}

      </div>
    )}

  </div>

  <NavLink
    to="/player/notifications"
  className="notification-button"
  title={
    unreadCount > 0
      ? `${unreadCount} unread notifications`
      : "Notifications"
  }
>
  <Bell size={20} />

  {unreadCount > 0 && (
    <span className="notification-badge">
      {unreadCount > 99
        ? "99+"
        : unreadCount}
    </span>
  )}
</NavLink>

          <button
  type="button"
  className={`player-game-settings-trigger ${
    gameSettingsOpen
      ? "active"
      : ""
  }`}
  onClick={() =>
    setGameSettingsOpen(
      true
    )
  }
  title="Game Settings"
  aria-label="Game Settings"
>

  <Settings
    size={24}
  />

</button>
            <div className="player-mobile-header">

  <button
    type="button"
    className="mobile-menu-button"
    onClick={() =>
      setProfileDrawerOpen(
        true
      )
    }
  >
    <Menu size={22} />
  </button>

</div>

          </div>
                

        </header>

        <main className="player-content">
  <Outlet />
</main>
{/* =====================================
    GAME SETTINGS MINI PAGE
===================================== */}

{gameSettingsOpen && (

  <div
    className="player-game-settings-backdrop"
    onClick={() =>
      setGameSettingsOpen(
        false
      )
    }
  >

    <section
      className="player-game-settings-modal"
      onClick={(event) =>
        event.stopPropagation()
      }
    >

      {/* HEADER */}

      <div className="player-game-settings-header">

        <div className="player-game-settings-heading">

          <Settings
            size={26}
          />

          <strong>
            Game Settings
          </strong>

        </div>


        <button
          type="button"
          className="player-game-settings-close"
          onClick={() =>
            setGameSettingsOpen(
              false
            )
          }
        >

          <X
            size={26}
          />

        </button>

      </div>


      {/* =============================
          ACTIONS
      ============================== */}

      <section className="player-settings-card">

        <div className="player-settings-card-title">

          <Settings
            size={19}
          />

          <strong>
            Actions
          </strong>

        </div>


        {/* RESET */}

        <div className="player-settings-row">

          <div className="player-settings-row-left">

            <RefreshCw
              size={22}
              className="settings-reset-icon"
            />

            <strong>
              Reset/Clear Marked Numbers
            </strong>

          </div>


          <button
            type="button"
            className="player-settings-reset-btn"
            onClick={
              handleResetMarkedNumbers
            }
          >
            Reset
          </button>

        </div>

      </section>


      {/* =============================
          SETTINGS
      ============================== */}

      <section className="player-settings-card">

        <div className="player-settings-card-title">

          <Settings
            size={19}
          />

          <strong>
            Settings
          </strong>

        </div>


        {/* SORT */}

        <div className="player-settings-row">

          <div className="player-settings-row-left">

            <ReceiptText
              size={21}
            />

            <strong>
              Sort Cards
            </strong>

          </div>


          <div className="player-custom-select">

  <button
    type="button"
    className={`player-custom-select-trigger ${
      sortDropdownOpen
        ? "open"
        : ""
    }`}
    onClick={() =>
      setSortDropdownOpen(
        (current) =>
          !current
      )
    }
  >

    <span>
      {
        GAME_SORT_OPTIONS.find(
          (option) =>
            option.id ===
            cardSortMode
        )?.label || "Off"
      }
    </span>


    <ChevronDown
      size={16}
      className={
        sortDropdownOpen
          ? "open"
          : ""
      }
    />

  </button>


  {sortDropdownOpen && (

    <div className="player-custom-select-menu">

      {GAME_SORT_OPTIONS.map(
        (option) => {

          const selected =
            option.id ===
            cardSortMode;


          return (

            <button
              key={
                option.id
              }
              type="button"
              className={`player-custom-select-option ${
                selected
                  ? "selected"
                  : ""
              }`}
              onClick={() => {

                handleCardSortModeChange(
                  option.id
                );

                setSortDropdownOpen(
                  false
                );

              }}
            >

              <span>
                {option.label}
              </span>


              {selected && (

                <Check
                  size={15}
                />

              )}

            </button>

          );

        }
      )}

    </div>

  )}

</div>

        </div>


   {/* GRID COLUMNS */}

<div className="player-settings-row">

  <div className="player-settings-row-left">

    <Gamepad2
      size={21}
    />

    <strong>
      Grid Columns
    </strong>

  </div>


  <div className="player-custom-select player-grid-custom-select">

    <button
      type="button"
      className={`player-custom-select-trigger ${
        gridDropdownOpen
          ? "open"
          : ""
      }`}
      onClick={() => {

        setGridDropdownOpen(
          (current) =>
            !current
        );

        setSortDropdownOpen(
          false
        );

        setColorDropdownOpen(
          false
        );

      }}
    >

      <span>
        {gridColumns}
      </span>


      <ChevronDown
        size={16}
        className={
          gridDropdownOpen
            ? "open"
            : ""
        }
      />

    </button>


    {gridDropdownOpen && (

      <div className="player-custom-select-menu player-grid-custom-menu">

        {[1, 2, 3].map(
          (columns) => {

            const selected =
              Number(
                gridColumns
              ) === columns;


            return (

              <button
                key={
                  columns
                }
                type="button"
                className={`player-custom-select-option ${
                  selected
                    ? "selected"
                    : ""
                }`}
                onClick={() => {

                  handleGridColumnsChange(
                    columns
                  );

                  setGridDropdownOpen(
                    false
                  );

                }}
              >

                <span>
                  {columns}
                </span>


                {selected && (

                  <Check
                    size={15}
                  />

                )}

              </button>

            );

          }
        )}

      </div>

    )}

  </div>

</div>


        {/* AUTO COMPLETE */}

        <div className="player-settings-row">

          <div className="player-settings-row-left">

            <Settings
              size={21}
            />

            <strong>
              Auto Complete
            </strong>

          </div>


          <button
            type="button"
            className={`player-settings-toggle ${
              autoComplete
                ? "active"
                : ""
            }`}
            onClick={
              handleAutoCompleteToggle
            }
            aria-pressed={
              autoComplete
            }
          >

            <span />

          </button>

        </div>


       {/* SELECTION COLOR */}

<div className="player-settings-row">

  <div className="player-settings-row-left">

    <span className="player-settings-palette-icon">
      ●
    </span>

    <strong>
      Selection Color
    </strong>

  </div>


  <div className="player-settings-color-control">

    <span
      className="player-settings-color-preview"
      style={{
        background:
          SELECTION_COLORS[
            selectionColor
          ],
      }}
    />


    <div className="player-custom-select player-color-custom-select">

      <button
        type="button"
        className={`player-custom-select-trigger ${
          colorDropdownOpen
            ? "open"
            : ""
        }`}
        onClick={() => {

          setColorDropdownOpen(
            (current) =>
              !current
          );

          setSortDropdownOpen(
            false
          );

          setGridDropdownOpen(
            false
          );

        }}
      >

        <span>
          {selectionColor
            .charAt(0)
            .toUpperCase() +
            selectionColor.slice(1)}
        </span>


        <ChevronDown
          size={16}
          className={
            colorDropdownOpen
              ? "open"
              : ""
          }
        />

      </button>


      {colorDropdownOpen && (

        <div className="player-custom-select-menu">

          {Object.entries(
            SELECTION_COLORS
          ).map(
            ([
              colorName,
              colorValue,
            ]) => {

              const selected =
                selectionColor ===
                colorName;


              return (

                <button
                  key={
                    colorName
                  }
                  type="button"
                  className={`player-custom-select-option player-color-option ${
                    selected
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => {

                    handleSelectionColorChange(
                      colorName
                    );

                    setColorDropdownOpen(
                      false
                    );

                  }}
                >

                  <span className="player-color-option-left">

                    <span
                      className="player-color-option-dot"
                      style={{
                        background:
                          colorValue,
                      }}
                    />

                    <span>
                      {colorName
                        .charAt(0)
                        .toUpperCase() +
                        colorName.slice(1)}
                    </span>

                  </span>


                  {selected && (

                    <Check
                      size={15}
                    />

                  )}

                </button>

              );

            }
          )}

        </div>

      )}

    </div>

  </div>

</div>

      </section>

    </section>

  </div>

)}

</div>


{/* =====================================
    MOBILE PROFILE OVERLAY
===================================== */}

<div
  className={`player-profile-backdrop ${
    profileDrawerOpen
      ? "show"
      : ""
  }`}
  onClick={() =>
    setProfileDrawerOpen(
      false
    )
  }
/>


{/* =====================================
    MOBILE PROFILE DRAWER
===================================== */}

<aside
  className={`player-profile-drawer ${
    profileDrawerOpen
      ? "open"
      : ""
  }`}
>

  <button
    type="button"
    className="player-profile-drawer-close"
    onClick={() =>
      setProfileDrawerOpen(
        false
      )
    }
  >
    <X size={21} />
  </button>


  <div className="player-profile-drawer-scroll">

    {/* PROMOTION */}

    <div className="player-profile-promo">

      <PlayerSidebarSlider />

    </div>


    {/* PROFILE */}

    <section className="player-profile-menu-card player-profile-header-card">

  <div className="player-profile-card-title">

    <User size={23} />

    <strong>
      Profile
    </strong>

  </div>


<button
  type="button"
  className="player-profile-refresh"
  onClick={
    handleProfileRefresh
  }
  disabled={
    walletLoading
  }
  title="Refresh and go to game"
>

    <RefreshCw
      size={18}
      className={
        walletLoading
          ? "player-profile-refresh-spin"
          : ""
      }
    />

    <span>
      {walletLoading
        ? "Refreshing..."
        : "Refresh"}
    </span>

  </button>

</section>


 {/* ACCOUNT */}

<section className="player-profile-menu-card">

  <div className="player-profile-section-title">

    <User size={19} />

    <span>
      Account
    </span>

  </div>


  <NavLink
    to="/player/profile"
    className="player-profile-detail-row"
    onClick={() =>
      setProfileDrawerOpen(
        false
      )
    }
  >

    <span>
      Phone:
    </span>

    <strong>
      {user?.phone ||
        user?.phoneNumber ||
        "-"}
    </strong>

  </NavLink>

</section>

    {/* =====================================
    BALANCE
===================================== */}

<section className="player-profile-menu-card player-profile-balance-card">

  <div className="player-profile-section-title player-profile-balance-title">

    <Wallet size={20} />

    <span>
      Balance
    </span>

  </div>


  {walletLoading ? (

    <div className="player-profile-balance-loading">

      Loading balance...

    </div>

  ) : walletError ? (

    <div className="player-profile-balance-error">

      {walletError}

    </div>

  ) : (

    <div className="player-profile-balance-values">


      {/* TOTAL */}

      <div className="player-profile-balance-item">

        <span>
          Total:
        </span>

        <strong>
          {formatMoney(
            totalBalance
          )}
          {" "}
          ETB
        </strong>

      </div>


      {/* WITHDRAWABLE */}

      <div className="player-profile-balance-item withdrawable">

        <span>
          Withdrawable:
        </span>

        <strong>
          {formatMoney(
            withdrawableBalance
          )}
          {" "}
          ETB
        </strong>

      </div>

    </div>

  )}

</section>


    {/* MESSAGES */}

    <NavLink
      to="/player/notifications"
      className="player-profile-menu-card player-profile-message-card"
      onClick={() =>
        setProfileDrawerOpen(
          false
        )
      }
    >

      <div className="player-profile-section-title">

        <Bell size={20} />

        <span>
          Messages
        </span>

      </div>


      <div className="player-profile-message-right">

        {unreadCount > 0 && (

          <strong>
            {unreadCount} new
          </strong>

        )}


        <div className="player-profile-message-bell">

          <Bell size={26} />

          {unreadCount > 0 && (

            <span>
              {unreadCount > 99
                ? "99+"
                : unreadCount}
            </span>

          )}

        </div>

      </div>

    </NavLink>


    {/* DEPOSIT / WITHDRAW */}

    <section className="player-profile-menu-card">

      <div className="player-profile-section-title">

        <Wallet size={19} />

        <span>
          Deposit and Withdraw
        </span>

      </div>


      <NavLink
        to="/player/deposit"
        className="player-profile-action-row"
        onClick={() =>
          setProfileDrawerOpen(
            false
          )
        }
      >

        <ArrowDownToLine
          size={19}
        />

        <strong>
          Deposit
        </strong>

        <ChevronRight
          size={19}
        />

      </NavLink>


      <NavLink
        to="/player/withdraw"
        className="player-profile-action-row"
        onClick={() =>
          setProfileDrawerOpen(
            false
          )
        }
      >

        <ArrowUpFromLine
          size={19}
        />

        <strong>
          Withdraw
        </strong>

        <ChevronRight
          size={19}
        />

      </NavLink>

    </section>


    {/* HISTORY */}

    <section className="player-profile-menu-card">

      <div className="player-profile-section-title">

        <ReceiptText
          size={19}
        />

        <span>
          History
        </span>

      </div>


      <NavLink
        to="/player/transactions"
        className="player-profile-action-row"
        onClick={() =>
          setProfileDrawerOpen(
            false
          )
        }
      >

        <ReceiptText
          size={18}
        />

        <strong>
          Transaction History
        </strong>

        <ChevronRight
          size={19}
        />

      </NavLink>

    </section>


    {/* SETTINGS */}

 <section className="player-profile-menu-card">
      <div className="player-profile-section-title">

        <Settings size={20} />

        <span>
          Settings
        </span>

      </div>
      


      {/* THEME */}

<div className="player-profile-setting-row">

  <div>

    {theme === "day" ? (
      <Sun size={20} />
    ) : (
      <Moon size={20} />
    )}

    <strong>
      Theme
    </strong>

  </div>


  <div className="player-profile-dropdown">

    <button
      type="button"
      className="player-profile-dropdown-trigger"
      onClick={() => {

        setThemeOpen(
          (current) =>
            !current
        );

        setLanguageOpen(
          false
        );

      }}
    >

      <span>
        {theme === "day"
          ? "Light"
          : "Dark"}
      </span>

      <ChevronDown
        size={16}
        className={
          themeOpen
            ? "open"
            : ""
        }
      />

    </button>


    {themeOpen && (

      <div className="player-profile-dropdown-menu">

        <button
          type="button"
          className={
            theme === "day"
              ? "selected"
              : ""
          }
          onClick={() => {

            setTheme(
              "day"
            );

            setThemeOpen(
              false
            );

          }}
        >

          <Sun size={17} />

          <span>
            Light
          </span>

          {theme === "day" && (
            <Check size={16} />
          )}

        </button>


        <button
          type="button"
          className={
            theme === "night"
              ? "selected"
              : ""
          }
          onClick={() => {

            setTheme(
              "night"
            );

            setThemeOpen(
              false
            );

          }}
        >

          <Moon size={17} />

          <span>
            Dark
          </span>

          {theme === "night" && (
            <Check size={16} />
          )}

        </button>

      </div>

    )}

  </div>

</div>


      {/* SOUND */}

      <div className="player-profile-setting-row">

        <div>

          {soundEnabled
            ? (
              <Volume2
                size={20}
              />
            )
            : (
              <VolumeX
                size={20}
              />
            )}

          <strong>
            Sound
          </strong>

        </div>


        <button
          type="button"
          className={`player-profile-sound-toggle ${
            soundEnabled
              ? "active"
              : ""
          }`}
          onClick={
            handleSoundToggle
          }
        >

          <span />

        </button>

      </div>


   {/* LANGUAGE */}

<div className="player-profile-setting-row">

  <div>

    <Globe size={20} />

    <strong>
      Language
    </strong>

  </div>


  <div className="player-profile-dropdown">

    <button
      type="button"
      className="player-profile-dropdown-trigger"
      onClick={() => {

        setLanguageOpen(
          (current) =>
            !current
        );

        setThemeOpen(
          false
        );

      }}
    >

      <span>
        {languages[
          language
        ]?.nativeName ||
          language}
      </span>


      <ChevronDown
        size={16}
        className={
          languageOpen
            ? "open"
            : ""
        }
      />

    </button>


    {languageOpen && (

      <div className="player-profile-dropdown-menu player-profile-language-menu">

        {Object.values(
          languages
        ).map(
          (item) => (

            <button
              key={
                item.code
              }
              type="button"
              className={
                language ===
                item.code
                  ? "selected"
                  : ""
              }
              onClick={() => {

                changeLanguage(
                  item.code
                );

                setLanguageOpen(
                  false
                );

              }}
            >

              <Globe
                size={16}
              />

              <span>
                {
                  item.nativeName
                }
              </span>


              {language ===
                item.code && (

                <Check
                  size={16}
                />

              )}

            </button>

          )
        )}

      </div>

    )}

  </div>

</div>
</section>

    {/* CONTACT */}

    <section className="player-profile-menu-card">

      <div className="player-profile-section-title">

        <Globe size={19} />

        <span>
          Contact Us
        </span>

      </div>


      <a
        href="https://t.me/goldbingo75"
        target="_blank"
        rel="noopener noreferrer"
        className="player-profile-action-row"
      >

        <span className="player-profile-open">
          Telegram
        </span>
        <strong></strong>

        <span className="player-profile-open">
          Open
        </span>

      </a>

    </section>


    {/* TERMS */}

    <section className="player-profile-menu-card">

      <div className="player-profile-section-title">

        <FileText size={19} />

        <span>
          Terms and Conditions
        </span>

      </div>


      <NavLink
        to="/player/terms"
        className="player-profile-action-row"
        onClick={() =>
          setProfileDrawerOpen(
            false
          )
        }
      >

        <FileText size={18} />

        <strong>
          Terms and Conditions
        </strong>

        <span className="player-profile-open">
          Read
        </span>

      </NavLink>

    </section>


    {/* LOGOUT */}

    <button
      type="button"
      className="player-profile-logout"
      onClick={
        handleLogout
      }
    >

      <LogOut size={21} />

      <span>
        {t(
          "navigation.logout"
        )}
      </span>

    </button>

  </div>

</aside>


</div>
  );
};

export default PlayerLayout;