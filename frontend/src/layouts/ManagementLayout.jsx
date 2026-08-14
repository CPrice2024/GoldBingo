import { useContext, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth-context";
import {
  LayoutDashboard,
  Users,
  UserCog,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Settings,
  LogOut,
  UserRound,
  Gamepad2,
  Bell,
} from "lucide-react";
import "./ManagementLayout.css";

export default function ManagementLayout() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const user = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  }, []);

  const role = user?.role;

  const isAdmin = role === "admin";
  const isAgent = role === "agent";

  const handleLogout = () => {
  logout();

  navigate("/management/login", {
    replace: true,
  });
};

  /*
   * =========================
   * ADMIN MENU
   * =========================
   */

  const adminMenu = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Agents",
      path: "/admin/agents",
      icon: UserCog,
    },
    {
      label: "Players",
      path: "/admin/players",
      icon: Users,
    },
    {
      label: "Games",
      path: "/admin/games",
      icon: Gamepad2,
    },
    {
      label: "Transactions",
      path: "/admin/transactions",
      icon: Receipt,
    },
    {
      label: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  /*
   * =========================
   * AGENT MENU
   * =========================
   */

  const agentMenu = [
    {
      label: "Dashboard",
      path: "/agent/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Players",
      path: "/agent/players",
      icon: Users,
    },
    {
      label: "Deposits",
      path: "/agent/deposits",
      icon: ArrowDownToLine,
    },
    {
      label: "Withdrawals",
      path: "/agent/withdrawals",
      icon: ArrowUpFromLine,
    },
    {
      label: "Transactions",
      path: "/agent/transactions",
      icon: Receipt,
    },
    {
      label: "Profile",
      path: "/agent/profile",
      icon: UserRound,
    },
  ];

  const menuItems = isAdmin
    ? adminMenu
    : agentMenu;

  const title = isAdmin
    ? "GoldBingo Admin"
    : "GoldBingo Agent";

  const roleLabel = isAdmin
    ? "Administrator"
    : "Agent";

  /*
   * Safety:
   * ManagementLayout should only be
   * accessible to admin/agent.
   */

  if (!isAdmin && !isAgent) {
    return null;
  }

  return (
    <div className="management-layout">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="management-sidebar">

        {/* Brand */}

        <div className="management-brand">

          <div className="management-brand-logo">
            B
          </div>

          <div className="management-brand-text">

            <strong>
              GoldBingo
            </strong>

            <span>
              {roleLabel}
            </span>

          </div>

        </div>


        {/* Divider */}

        <div className="management-sidebar-divider" />


        {/* Navigation */}

        <nav className="management-navigation">

          {menuItems.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `management-nav-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >

                <Icon size={19} />

                <span>
                  {item.label}
                </span>

              </NavLink>
            );
          })}

        </nav>


        {/* Bottom */}

        <div className="management-sidebar-bottom">

          <button
            type="button"
            className="management-logout"
            onClick={handleLogout}
          >

            <LogOut size={19} />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>


      {/* =================================================
          MAIN
      ================================================= */}

      <div className="management-main">

        {/* =================================================
            TOPBAR
        ================================================= */}

        <header className="management-topbar">

          <div className="management-topbar-title">

            <h1>
              {title}
            </h1>

            <p>
              {isAdmin
                ? "Management & administration"
                : "Agent management portal"}
            </p>

          </div>


          <div className="management-topbar-right">

            {/* Notification */}

            <button
              type="button"
              className="management-notification"
            >
              <Bell size={20} />

              <span />
            </button>


            {/* User */}

            <div className="management-user">

              <div className="management-user-avatar">
                {(user?.fullName ||
                  roleLabel)
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="management-user-info">

                <strong>
                  {user?.fullName ||
                    roleLabel}
                </strong>

                <span>
                  {user?.phone || roleLabel}
                </span>

              </div>

            </div>

          </div>

        </header>


        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="management-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}