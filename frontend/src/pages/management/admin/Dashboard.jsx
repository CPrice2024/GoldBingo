import { useEffect, useState } from "react";

import {
  Users,
  UserRound,
  ShieldCheck,
  UserCog,
  Gamepad2,
  PlayCircle,
  Clock3,
  CheckCircle2,
  UserCheck,
  UserX,
  Ban,
  RefreshCw,
} from "lucide-react";

import { getAdminDashboardStats } from "../../../api/admin.api";
import "../../../layouts/ManagementLayout.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadDashboard = async (
    isRefresh = false
  ) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await getAdminDashboardStats();

      setStats(
        response?.data || null
      );
    } catch (err) {
      console.error(
        "Failed to load admin dashboard:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="management-page">
        <div className="management-loading">
          <RefreshCw
            size={28}
            className="management-spin"
          />

          <p>
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-page">

      {/* Header */}

      <div className="management-page-header">

        <div className="management-page-title">

          <ShieldCheck size={28} />

          <div>
            <h1>
              Admin Dashboard
            </h1>

            <p>
              Overview of your GoldBingo
              platform.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="management-refresh-button"
          onClick={() =>
            loadDashboard(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "management-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* Error */}

      {error && (
        <div className="management-error">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* User Statistics */}

          <div className="management-section-title">
            <h2>
              User Overview
            </h2>

            <p>
              Platform users and account
              statuses.
            </p>
          </div>

          <div className="management-stats-grid">

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <Users size={22} />
              </div>

              <div>
                <span>
                  Total Users
                </span>

                <strong>
                  {stats.totalUsers}
                </strong>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <UserRound size={22} />
              </div>

              <div>
                <span>
                  Players
                </span>

                <strong>
                  {stats.totalPlayers}
                </strong>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <UserCog size={22} />
              </div>

              <div>
                <span>
                  Agents
                </span>

                <strong>
                  {stats.totalAgents}
                </strong>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <ShieldCheck size={22} />
              </div>

              <div>
                <span>
                  Administrators
                </span>

                <strong>
                  {stats.totalAdmins}
                </strong>
              </div>
            </div>

          </div>

          {/* User Status */}

          <div className="management-stats-grid">

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <UserCheck size={22} />
              </div>

              <div>
                <span>
                  Active Players
                </span>

                <strong>
                  {stats.activePlayers}
                </strong>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <UserCheck size={22} />
              </div>

              <div>
                <span>
                  Active Agents
                </span>

                <strong>
                  {stats.activeAgents}
                </strong>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <UserX size={22} />
              </div>

              <div>
                <span>
                  Suspended Players
                </span>

                <strong>
                  {stats.suspendedPlayers}
                </strong>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <Ban size={22} />
              </div>

              <div>
                <span>
                  Blocked Players
                </span>

                <strong>
                  {stats.blockedPlayers}
                </strong>
              </div>
            </div>

          </div>

          {/* Games */}

          <div className="management-section-title">
            <h2>
              Game Overview
            </h2>

            <p>
              Current and historical Bingo
              game statistics.
            </p>
          </div>

          <div className="management-stats-grid">

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <Gamepad2 size={22} />
              </div>

              <div>
                <span>
                  Total Games
                </span>

                <strong>
                  {stats.totalGames}
                </strong>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <PlayCircle size={22} />
              </div>

              <div>
                <span>
                  Active Games
                </span>

                <strong>
                  {stats.activeGames}
                </strong>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <Clock3 size={22} />
              </div>

              <div>
                <span>
                  Waiting Games
                </span>

                <strong>
                  {stats.waitingGames}
                </strong>
              </div>
            </div>

            <div className="management-stat-card">
              <div className="agent-stat-icon">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <span>
                  Completed Games
                </span>

                <strong>
                  {stats.completedGames}
                </strong>
              </div>
            </div>

          </div>

        </>
      )}

    </div>
  );
}