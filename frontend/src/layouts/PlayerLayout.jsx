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
} from "lucide-react";

import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNotifications } from "../context/NotificationContext";

const PlayerLayout = () => {
  const { user, logout } = useAuth();

  const { unreadCount } =
  useNotifications();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const navigation = [
    {
      label: "Dashboard",
      path: "/player/dashboard",
      icon: Home,
    },
    {
  label: "Play",
  icon: Gamepad2,
  path: "/player/play",
},
    {
      label: "Wallet",
      path: "/player/wallet",
      icon: Wallet,
    },
    {
      label: "Deposit",
      path: "/player/deposit",
      icon: ArrowDownToLine,
    },
    {
      label: "Withdraw",
      path: "/player/withdraw",
      icon: ArrowUpFromLine,
    },
    {
      label: "Transactions",
      path: "/player/transactions",
      icon: ReceiptText,
    },
    {
      label: "Notifications",
      path: "/player/notifications",
      icon: Bell,
    },
    {
      label: "Profile",
      path: "/player/profile",
      icon: User,
    },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="player-app">

      <header className="player-mobile-header">
        <div className="player-brand">
          <div className="player-brand-logo">
            B
          </div>
          <span>GoldBingo</span>
        </div>

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
      </header>

      <aside
        className={`player-sidebar ${
          mobileOpen
            ? "player-sidebar-open"
            : ""
        }`}
      >
        <div className="player-sidebar-brand">
          <div className="player-brand-logo">
            B
          </div>

          <div>
            <strong>
              GoldBingo
            </strong>

            <span>
              Player
            </span>
          </div>
        </div>

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

        <button
          className="player-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </aside>

      <div className="player-main">

        <header className="player-topbar">

          <div>
            <h1>
              {user?.fullName
                ? `Welcome, ${user.fullName}`
                : "Welcome"}
            </h1>

            <p>
              Play & Win now
            </p>
          </div>

          <div className="player-topbar-actions">

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
              <div className="player-avatar">
                {user?.fullName
                  ?.charAt(0)
                  ?.toUpperCase() || "P"}
              </div>

              <div>
                <strong>
                  {user?.fullName ||
                    "Player"}
                </strong>

                <span>
                  {user?.phone || ""}
                </span>
              </div>
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