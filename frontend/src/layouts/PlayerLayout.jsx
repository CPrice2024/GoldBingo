import {
  Bell,
  Gamepad2,
  Home,
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
} from "lucide-react";
import PlayerSidebarSlider from "../components/player/PlayerSidebarSlider";
import { useLanguage } from "../context/LanguageContext";
import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
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


  const [mobileOpen, setMobileOpen] =
    useState(false);
  
  const [languageOpen, setLanguageOpen] =
  useState(false);
  

 const navigation = [
  {
    label: t("navigation.dashboard"),
    path: "/player/dashboard",
    icon: Home,
  },
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
      <aside
        className={`player-sidebar ${
          mobileOpen
            ? "player-sidebar-open"
            : ""
        }`}
      >
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
                  setMobileOpen(false)
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
    setMobileOpen(false)
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
      setMobileOpen(false)
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

            <NavLink
              to="/player/profile"
              className="player-user"
            >
             <PlayerAvatar
  avatarId={1}
  size={37}
/>

              <div>
              </div>
            </NavLink>
            <NavLink
  className={`player-mobile-header ${
    mobileOpen
      ? "sidebar-is-open"
      : ""
  }`}
>
  <button
    className="mobile-menu-button"
    onClick={() =>
      setMobileOpen(
        (prev) => !prev
      )
    }
  >
    {mobileOpen ? (
      <X size={22} />
    ) : (
      <Menu size={22} />
    )}
  </button>
</NavLink>

          </div>
                

        </header>

        <main className="player-content">
          <Outlet />
        </main>

      </div>
      
      
    </div>
  );
};

export default PlayerLayout;