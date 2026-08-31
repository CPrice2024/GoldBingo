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
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from "lucide-react";
import PlayerSidebarSlider from "../components/player/PlayerSidebarSlider";
import { useLanguage } from "../context/LanguageContext";
import { NavLink, Outlet } from "react-router-dom";
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

  const { unreadCount } =
  useNotifications();



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
  className="player-user"
  onClick={() =>
    setProfileDrawerOpen(
      true
    )
  }
>
  <PlayerAvatar
    avatarId={1}
    size={37}
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