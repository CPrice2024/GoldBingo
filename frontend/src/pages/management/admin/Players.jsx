import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Users,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
  UserX,
  CalendarDays,
  X,
} from "lucide-react";

import { getAdminPlayers } from "../../../api/admin.api";

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedPlayer, setSelectedPlayer] =
    useState(null);

  const [error, setError] = useState("");

  const loadPlayers = async () => {
    try {
      setError("");

      const response =
        await getAdminPlayers();

      setPlayers(response?.data || []);
    } catch (err) {
      console.error(
        "Failed to load players:",
        err
      );

      setError(
        err?.response?.data?.message ||
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPlayers();
  };

  const filteredPlayers = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return players.filter((player) => {
      const matchesSearch =
        !query ||
        player.fullName
          ?.toLowerCase()
          .includes(query) ||
        player.phone
          ?.toLowerCase()
          .includes(query) ||
        player.email
          ?.toLowerCase()
          .includes(query) ||
        player.referredBy?.fullName
          ?.toLowerCase()
          .includes(query) ||
        player.referredBy?.phone
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        player.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    players,
    search,
    statusFilter,
  ]);

  const activeCount = players.filter(
    (player) =>
      player.status === "active"
  ).length;

  const suspendedCount = players.filter(
    (player) =>
      player.status === "suspended"
  ).length;

  const blockedCount = players.filter(
    (player) =>
      player.status === "blocked"
  ).length;

  const formatDate = (date) => {
    if (!date) return "Never";

    return new Date(
      date
    ).toLocaleDateString();
  };

  const formatDateTime = (date) => {
    if (!date) return "Never";

    return new Date(
      date
    ).toLocaleString();
  };

  return (
    <div className="admin-players-page">

      {/* =========================
          HEADER
      ========================== */}

      <div className="admin-page-header">

        <div>
          <h1>Players</h1>

          <p>
            Manage and monitor all
            GoldBingo players.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "admin-spin"
                : ""
            }
          />

          Refresh
        </button>

      </div>


      {/* =========================
          ERROR
      ========================== */}

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}


      {/* =========================
          SUMMARY
      ========================== */}

      <div className="admin-player-stats">

        <div className="admin-player-stat-card">

          <div className="admin-player-stat-icon">
            <Users size={20} />
          </div>

          <div>
            <span>Total Players</span>
            <strong>
              {players.length}
            </strong>
          </div>

        </div>


        <div className="admin-player-stat-card">

          <div className="admin-player-stat-icon">
            <UserCheck size={20} />
          </div>

          <div>
            <span>Active</span>
            <strong>
              {activeCount}
            </strong>
          </div>

        </div>


        <div className="admin-player-stat-card">

          <div className="admin-player-stat-icon">
            <UserX size={20} />
          </div>

          <div>
            <span>Suspended</span>
            <strong>
              {suspendedCount}
            </strong>
          </div>

        </div>


        <div className="admin-player-stat-card">

          <div className="admin-player-stat-icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <span>Blocked</span>
            <strong>
              {blockedCount}
            </strong>
          </div>

        </div>

      </div>


      {/* =========================
          FILTER BAR
      ========================== */}

      <div className="admin-players-toolbar">

        <div className="admin-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search players, phone, email or agent..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
          className="admin-status-filter"
        >
          <option value="all">
            All Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="suspended">
            Suspended
          </option>

          <option value="blocked">
            Blocked
          </option>

          <option value="pending">
            Pending
          </option>
        </select>


        <div className="admin-results-count">
          {filteredPlayers.length} player
          {filteredPlayers.length !== 1
            ? "s"
            : ""}
        </div>

      </div>


      {/* =========================
          PLAYERS TABLE
      ========================== */}

      <div className="admin-players-table-container">

        {loading ? (
          <div className="admin-loading">
            Loading players...
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="admin-empty">

            <Users size={42} />

            <h3>
              No players found
            </h3>

            <p>
              No players match your
              current search or filter.
            </p>

          </div>
        ) : (
          <div className="admin-players-table-wrapper">

            <table className="admin-players-table">

              <thead>
                <tr>

                  <th>Player</th>

                  <th>Contact</th>

                  <th>Status</th>

                  <th>Verification</th>

                  <th>Assigned Agent</th>

                  <th>Last Login</th>

                  <th>Registered</th>

                  <th></th>

                </tr>
              </thead>


              <tbody>

                {filteredPlayers.map(
                  (player) => (

                    <tr
                      key={player._id}
                    >

                      {/* Player */}

                      <td>

                        <div className="admin-player-cell">

                          <div className="admin-player-avatar">

                            {player.fullName
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "P"}

                          </div>

                          <div>

                            <strong>
                              {player.fullName}
                            </strong>

                            <small>
                              ID:{" "}
                              {player._id}
                            </small>

                          </div>

                        </div>

                      </td>


                      {/* Contact */}

                      <td>

                        <div className="admin-player-contact">

                          <div>
                            <Phone
                              size={14}
                            />

                            <span>
                              {player.phone}
                            </span>
                          </div>

                          {player.email && (
                            <div>
                              <Mail
                                size={14}
                              />

                              <span>
                                {player.email}
                              </span>
                            </div>
                          )}

                        </div>

                      </td>


                      {/* Status */}

                      <td>

                        <span
                          className={`admin-status ${
                            player.status
                          }`}
                        >
                          {player.status}
                        </span>

                      </td>


                      {/* Verification */}

                      <td>

                        {player.isVerified ? (
                          <span className="admin-verification verified">
                            <ShieldCheck
                              size={15}
                            />

                            Verified
                          </span>
                        ) : (
                          <span className="admin-verification unverified">
                            Not verified
                          </span>
                        )}

                      </td>


                      {/* Agent */}

                      <td>

                        {player.referredBy ? (
                          <div className="admin-assigned-agent">

                            <strong>
                              {
                                player
                                  .referredBy
                                  .fullName
                              }
                            </strong>

                            <small>
                              {
                                player
                                  .referredBy
                                  .phone
                              }
                            </small>

                          </div>
                        ) : (
                          <span className="admin-no-agent">
                            No agent assigned
                          </span>
                        )}

                      </td>


                      {/* Last login */}

                      <td>

                        <span className="admin-date">

                          {formatDateTime(
                            player.lastLogin
                          )}

                        </span>

                      </td>


                      {/* Created */}

                      <td>

                        <span className="admin-date">

                          {formatDate(
                            player.createdAt
                          )}

                        </span>

                      </td>


                      {/* View */}

                      <td>

                        <button
                          type="button"
                          className="admin-view-button"
                          onClick={() =>
                            setSelectedPlayer(
                              player
                            )
                          }
                        >
                          View
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* =========================
          PLAYER DETAILS MODAL
      ========================== */}

      {selectedPlayer && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setSelectedPlayer(null);
            }
          }}
        >

          <div className="admin-modal admin-player-modal">

            <div className="admin-modal-header">

              <div>
                <h2>
                  Player Details
                </h2>

                <p>
                  Account information
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPlayer(null)
                }
              >
                <X size={20} />
              </button>

            </div>


            {/* Profile */}

            <div className="admin-player-profile">

              <div className="admin-player-large-avatar">

                {selectedPlayer.fullName
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  "P"}

              </div>

              <div>

                <h3>
                  {
                    selectedPlayer.fullName
                  }
                </h3>

                <span
                  className={`admin-status ${
                    selectedPlayer.status
                  }`}
                >
                  {
                    selectedPlayer.status
                  }
                </span>

              </div>

            </div>


            {/* Details */}

            <div className="admin-player-details">

              <div className="admin-detail-item">

                <small>
                  Phone
                </small>

                <strong>
                  {
                    selectedPlayer.phone
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <small>
                  Email
                </small>

                <strong>
                  {
                    selectedPlayer.email ||
                    "No email"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <small>
                  Verification
                </small>

                <strong>
                  {
                    selectedPlayer
                      .isVerified
                      ? "Verified"
                      : "Not verified"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <small>
                  Assigned Agent
                </small>

                <strong>
                  {
                    selectedPlayer
                      .referredBy
                      ?.fullName ||
                    "No agent assigned"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <small>
                  Agent Phone
                </small>

                <strong>
                  {
                    selectedPlayer
                      .referredBy
                      ?.phone ||
                    "—"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <small>
                  Referral Code
                </small>

                <strong>
                  {
                    selectedPlayer
                      .referredBy
                      ?.referralCode ||
                    "—"
                  }
                </strong>

              </div>


              <div className="admin-detail-item">

                <small>
                  Last Login
                </small>

                <strong>
                  {formatDateTime(
                    selectedPlayer.lastLogin
                  )}
                </strong>

              </div>


              <div className="admin-detail-item">

                <small>
                  Registered
                </small>

                <strong>
                  {formatDateTime(
                    selectedPlayer.createdAt
                  )}
                </strong>

              </div>

            </div>


            <div className="admin-player-id">

              <CalendarDays
                size={15}
              />

              <span>
                Player ID:{" "}
                {selectedPlayer._id}
              </span>

            </div>


            <div className="admin-modal-actions">

              <button
                type="button"
                onClick={() =>
                  setSelectedPlayer(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}