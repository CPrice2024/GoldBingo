import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Wallet,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import {
  getAgentProfile,
  getAgentStats,
} from "../../../api/agent.api";
import "./ManagementLayout.css";

export default function AgentDashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activePlayers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileResponse, statsResponse] =
        await Promise.all([
          getAgentProfile(),
          getAgentStats(),
        ]);

      setProfile(profileResponse?.data || null);

      setStats(
        statsResponse?.data || {
          totalPlayers: 0,
          activePlayers: 0,
        }
      );
    } catch (err) {
      console.error(
        "Failed to load agent dashboard:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
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
            size={22}
            className="management-spin"
          />

          <span>
            Loading agent dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="management-page">
        <div className="management-error">
          <h2>Unable to load dashboard</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={loadDashboard}
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="management-page">

      {/* Header */}

      <div className="management-page-header">
        <div>
          <h1>Agent Dashboard</h1>

          <p>
            Welcome back,{" "}
            <strong>
              {profile?.fullName || "Agent"}
            </strong>
          </p>
        </div>

        <button
          type="button"
          className="management-refresh-button"
          onClick={loadDashboard}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Stats */}

      <div className="management-stats-grid">

        {/* Total Players */}

        <div className="management-stat-card">
          <div className="management-stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>
              Total Players
            </span>

            <strong>
              {stats.totalPlayers}
            </strong>
          </div>
        </div>

        {/* Active Players */}

        <div className="management-stat-card">
          <div className="management-stat-icon">
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

        {/* Referral Code */}

        <div className="management-stat-card">
          <div className="management-stat-icon">
            <TrendingUp size={22} />
          </div>

          <div>
            <span>
              Referral Code
            </span>

            <strong>
              {profile?.referralCode || "-"}
            </strong>
          </div>
        </div>

        {/* Status */}

        <div className="management-stat-card">
          <div className="management-stat-icon">
            <Wallet size={22} />
          </div>

          <div>
            <span>
              Account Status
            </span>

            <strong>
              {profile?.status || "-"}
            </strong>
          </div>
        </div>

      </div>

      {/* Agent information */}

      <div className="management-content-card">

        <div className="management-content-header">
          <div>
            <h2>Agent Information</h2>

            <p>
              Your management account details
            </p>
          </div>
        </div>

        <div className="management-info-grid">

          <div>
            <span>Full Name</span>
            <strong>
              {profile?.fullName || "-"}
            </strong>
          </div>

          <div>
            <span>Phone</span>
            <strong>
              {profile?.phone || "-"}
            </strong>
          </div>

          <div>
            <span>Email</span>
            <strong>
              {profile?.email || "-"}
            </strong>
          </div>

          <div>
            <span>Referral Code</span>
            <strong>
              {profile?.referralCode || "-"}
            </strong>
          </div>

          <div>
            <span>Role</span>
            <strong>
              {profile?.role || "-"}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong>
              {profile?.status || "-"}
            </strong>
          </div>

        </div>

      </div>

    </div>
  );
}