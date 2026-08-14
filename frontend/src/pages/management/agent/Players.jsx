import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import "./ManagementLayout.css";

import { getAgentPlayers } from "../../../api/agent.api";

export default function AgentPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadPlayers = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAgentPlayers();

      setPlayers(response?.data || []);
    } catch (err) {
      console.error("Failed to load players:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load players"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return players;
    }

    return players.filter((player) => {
      return (
        player.fullName?.toLowerCase().includes(value) ||
        player.phone?.toLowerCase().includes(value) ||
        player.email?.toLowerCase().includes(value) ||
        player.status?.toLowerCase().includes(value)
      );
    });
  }, [players, search]);

  const activePlayers = players.filter(
    (player) => player.status === "active"
  ).length;

  const inactivePlayers =
    players.length - activePlayers;

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  if (loading) {
    return (
      <div className="management-page">
        <div className="agent-loading">
          <RefreshCw
            size={28}
            className="agent-spin"
          />
          <p>Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-page">

      {/* Header */}
      <div className="management-page-header">

        <div>
          <div className="management-page-title">
            <Users size={28} />
            <div>
              <h1>My Players</h1>
              <p>
                Manage players registered through
                your referral code.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="management-refresh-button"
          onClick={() => loadPlayers(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "agent-spin"
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
        <div className="agent-error">
          <UserX size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => loadPlayers()}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="management-stats-grid">

        <div className="management-stat-card">
          <div className="management-stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Total Players</span>
            <strong>{players.length}</strong>
          </div>
        </div>

        <div className="management-stat-card">
          <div className="management-stat-icon">
            <UserCheck size={22} />
          </div>

          <div>
            <span>Active Players</span>
            <strong>{activePlayers}</strong>
          </div>
        </div>

        <div className="management-stat-card">
          <div className="management-stat-icon">
            <UserX size={22} />
          </div>

          <div>
            <span>Other Status</span>
            <strong>{inactivePlayers}</strong>
          </div>
        </div>

      </div>

      {/* Players card */}
      <div className="management-content-card">

        <div className="management-content-header">

          <div>
            <h2>Players</h2>
            <p>
              {players.length} player
              {players.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          <div className="management-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

        </div>

        {/* Empty */}
        {filteredPlayers.length === 0 ? (
          <div className="agent-empty">

            <Users size={42} />

            {players.length === 0 ? (
              <>
                <h3>No players yet</h3>
                <p>
                  Players who register using your
                  referral code will appear here.
                </p>
              </>
            ) : (
              <>
                <h3>No matching players</h3>
                <p>
                  Try a different search term.
                </p>
              </>
            )}

          </div>
        ) : (
          <div className="management-table-wrapper">

            <table className="management-table">

              <thead>
                <tr>
                  <th>Player</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>

              <tbody>

                {filteredPlayers.map(
                  (player) => (
                    <tr key={player._id}>

                      <td>
                        <div className="management-player-cell">

                          <div className="management-player-avatar">
                            {player.fullName
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "P"}
                          </div>

                          <div>
                            <strong>
                              {player.fullName ||
                                "Unknown Player"}
                            </strong>

                            <small>
                              Player
                            </small>
                          </div>

                        </div>
                      </td>

                      <td>
                        <div className="management-table-detail">
                          <Phone size={15} />
                          {player.phone ||
                            "—"}
                        </div>
                      </td>

                      <td>
                        <div className="management-table-detail">
                          <Mail size={15} />
                          {player.email ||
                            "—"}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`agent-status agent-status-${player.status}`}
                        >
                          {player.status}
                        </span>
                      </td>

                      <td>
                        <div className="management-table-detail">
                          <Calendar size={15} />
                          {formatDate(
                            player.createdAt
                          )}
                        </div>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}