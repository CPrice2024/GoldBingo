import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import PlayerLogin from "../pages/player/Login";
import PlayerSignup from "../pages/player/Signup";
import ChangePassword from "../pages/player/ChangePassword";
import PlayerDashboard from "../pages/player/Dashboard";
import PlayerWallet from "../pages/player/Wallet";
import Deposit from "../pages/player/Deposit";
import Withdraw from "../pages/player/Withdraw";
import Transactions from "../pages/player/Transactions";
import PlayerNotifications from "../pages/player/Notifications";
import Profile from "../pages/player/Profile";
import Games from "../pages/player/Games";
import GameRoom from "../pages/player/GameRoom";
import Play from "../pages/player/Play";

import PlayerLayout from "../layouts/PlayerLayout";

import ManagementLogin from "../pages/management/Login";
import AdminDashboard from "../pages/management/admin/Dashboard";
import AdminAgents from "../pages/management/admin/Agents";
import AdminPlayers from "../pages/management/admin/Players";
import AdminGames from "../pages/management/admin/Games";
import AdminTransactions from "../pages/management/admin/Transactions";
import AdminSettings from "../pages/management/admin/Settings";
import AgentDashboard from "../pages/management/agent/Dashboard";
import AgentPlayers from "../pages/management/agent/Players";
import AgentDeposits from "../pages/management/agent/Deposits";
import AgentProfile from "../pages/management/agent/Profile";
import AgentTransactions from "../pages/management/agent/Transactions";
import AgentWithdrawals from "../pages/management/agent/Withdrawals";

import ManagementLayout from "../layouts/ManagementLayout";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PLAYER AUTH
        ========================== */}

        <Route
          path="/player/login"
          element={<PlayerLogin />}
        />

        <Route
          path="/player/signup"
          element={<PlayerSignup />}
        />

        {/* =========================
            MANAGEMENT AUTH
        ========================== */}

        <Route
          path="/management/login"
          element={<ManagementLogin />}
        />

        {/* =========================
            PLAYER APPLICATION
        ========================== */}

        <Route
          path="/player"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["player"]}>
                <PlayerLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route
            path="dashboard"
            element={<PlayerDashboard />}
          />

          <Route
            path="play"
            element={<Play />}
          />

          <Route
            path="games"
            element={<Games />}
          />

          <Route
            path="game/:gameId"
            element={<GameRoom />}
          />

          <Route
            path="wallet"
            element={<PlayerWallet />}
          />

          <Route
            path="notifications"
            element={<PlayerNotifications />}
          />

          <Route
            path="deposit"
            element={<Deposit />}
          />

          <Route
            path="withdraw"
            element={<Withdraw />}
          />

          <Route
            path="transactions"
            element={<Transactions />}
          />

          <Route
            path="profile"
            element={<Profile />}
          />

          <Route
            path="change-password"
            element={<ChangePassword />}
          />

          <Route
            index
            element={
              <Navigate
                to="/player/dashboard"
                replace
              />
            }
          />
        </Route>

        {/* =========================
            AGENT APPLICATION
        ========================== */}

        <Route
          path="/agent"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["agent"]}>
                <ManagementLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Navigate
                to="/agent/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={<AgentDashboard />}
          />

          <Route
            path="players"
            element={<AgentPlayers />}
          />

          <Route
            path="deposits"
            element={<AgentDeposits />}
          />

          <Route
            path="withdrawals"
            element={<AgentWithdrawals />}
          />

          <Route
            path="transactions"
            element={<AgentTransactions />}
          />

          <Route
            path="profile"
            element={<AgentProfile />}
          />
        </Route>

        <Route
  path="/admin"
  element={
    <ProtectedRoute>
      <RoleRoute allowedRoles={["admin"]}>
        <ManagementLayout />
      </RoleRoute>
    </ProtectedRoute>
  }
>
  <Route
    index
    element={
      <Navigate
        to="/admin/dashboard"
        replace
      />
    }
  />

  <Route
    path="dashboard"
    element={<AdminDashboard />}
  />
  <Route
  path="agents"
  element={<AdminAgents />}
/>
<Route
  path="players"
  element={<AdminPlayers />}
/>
<Route
  path="games"
  element={<AdminGames />}
/>
<Route
  path="transactions"
  element={<AdminTransactions />}
/>
<Route
  path="settings"
  element={<AdminSettings />}
/>
</Route>

        {/* =========================
            ROOT
        ========================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/player/login"
              replace
            />
          }
        />

        {/* =========================
            404
        ========================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/player/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
