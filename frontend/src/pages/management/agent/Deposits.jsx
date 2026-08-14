import { useEffect, useMemo, useState } from "react";
import {
  WalletCards,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  User,
  Phone,
  CreditCard,
  Calendar,
  X,
} from "lucide-react";

import {
  getPendingDeposits,
  approveDeposit,
} from "../../../api/deposits.api";
import "./ManagementLayout.css";

export default function AgentDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [selectedDeposit, setSelectedDeposit] =
    useState(null);

  const loadDeposits = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await getPendingDeposits();

      setDeposits(response?.data || []);
    } catch (err) {
      console.error(
        "Failed to load pending deposits:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load deposits"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const filteredDeposits = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return deposits;
    }

    return deposits.filter((deposit) => {
      return (
        deposit.paymentMethod
          ?.toLowerCase()
          .includes(value) ||
        deposit.reference
          ?.toLowerCase()
          .includes(value) ||
        deposit.note
          ?.toLowerCase()
          .includes(value) ||
        deposit.amount
          ?.toString()
          .includes(value) ||
        deposit.playerId?.fullName
          ?.toLowerCase()
          .includes(value) ||
        deposit.playerId?.phone
          ?.toLowerCase()
          .includes(value)
      );
    });
  }, [deposits, search]);

  const totalPendingAmount =
    deposits.reduce(
      (total, deposit) =>
        total + Number(deposit.amount || 0),
      0
    );

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString(
      "en-US"
    )} ETB`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getPaymentMethodName = (method) => {
    const names = {
      telebirr: "Telebirr",
      cbe: "CBE",
      mpesa: "M-Pesa",
      bank: "Bank",
    };

    return names[method] || method || "—";
  };

  const handleApprove = async (deposit) => {
    const confirmed = window.confirm(
      `Approve deposit of ${formatAmount(
        deposit.amount
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setApprovingId(deposit._id);
      setError("");

      await approveDeposit(deposit._id);

      setSelectedDeposit(null);

      // Remove approved deposit from pending list
      setDeposits((current) =>
        current.filter(
          (item) => item._id !== deposit._id
        )
      );
    } catch (err) {
      console.error(
        "Failed to approve deposit:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to approve deposit"
      );
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="management-page">
        <div className="management-loading">
          <RefreshCw
            size={28}
            className="management-spin"
          />
          <p>
            Loading pending deposits...
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
          <WalletCards size={28} />

          <div>
            <h1>Deposits</h1>

            <p>
              Review and approve player
              deposit requests.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="management-refresh-button"
          onClick={() =>
            loadDeposits(true)
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
          <X size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics */}

     <div className="management-stats-grid">

  <div className="management-stat-card">
    <div className="management-stat-icon">
      <Clock size={22} />
    </div>

    <div>
      <span>Pending Requests</span>
      <strong>{deposits.length}</strong>
    </div>
  </div>

  <div className="management-stat-card">
    <div className="management-stat-icon">
      <WalletCards size={22} />
    </div>

    <div>
      <span>Pending Amount</span>
      <strong>{formatAmount(totalPendingAmount)}</strong>
    </div>
  </div>

  <div className="management-stat-card">
    <div className="management-stat-icon">
      <CheckCircle size={22} />
    </div>

    <div>
      <span>Action</span>
      <strong>Review & Approve</strong>
    </div>
  </div>

</div>
      {/* Main Card */}

      <div className="management-content-card">

        <div className="management-content-header">

          <div>
            <h2>Pending Deposits</h2>

            <p>
              Deposits waiting for your
              approval.
            </p>
          </div>

          <div className="management-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search deposits..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

        </div>

        {/* Empty state */}

        {filteredDeposits.length === 0 ? (
          <div className="management-empty">

            <WalletCards size={44} />

            {deposits.length === 0 ? (
              <>
                <h3>
                  No pending deposits
                </h3>

                <p>
                  New player deposit
                  requests will appear
                  here.
                </p>
              </>
            ) : (
              <>
                <h3>
                  No matching deposits
                </h3>

                <p>
                  Try a different search
                  term.
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
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Reference</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredDeposits.map(
                  (deposit) => {

                    const player =
                      deposit.playerId;

                    return (
                      <tr
                        key={deposit._id}
                      >

                        {/* Player */}

                        <td>

                          <div className="agent-player-cell">

                            <div className="management-player-avatar">
                              {player?.fullName
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "P"}
                            </div>

                            <div>

                              <strong>
                                {player?.fullName ||
                                  "Unknown Player"}
                              </strong>

                              <small>
                                {player?.phone ||
                                  "—"}
                              </small>

                            </div>

                          </div>

                        </td>

                        {/* Amount */}

                        <td>

                          <strong>
                            {formatAmount(
                              deposit.amount
                            )}
                          </strong>

                        </td>

                        {/* Payment method */}

                        <td>

                          <div className="management-table-detail">

                            <CreditCard
                              size={15}
                            />

                            {getPaymentMethodName(
                              deposit.paymentMethod
                            )}

                          </div>

                        </td>

                        {/* Reference */}

                        <td>
                          {deposit.reference ||
                            "—"}
                        </td>

                        {/* Date */}

                        <td>

                          <div className="management-table-detail">

                            <Calendar
                              size={15}
                            />

                            {formatDate(
                              deposit.createdAt
                            )}

                          </div>

                        </td>

                        {/* Action */}

                        <td>

                          <button
                            type="button"
                            className="management-approve-button"
                            onClick={() =>
                              setSelectedDeposit(
                                deposit
                              )
                            }
                            disabled={
                              approvingId ===
                              deposit._id
                            }
                          >
                            <CheckCircle
                              size={16}
                            />

                            Review
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* Review Modal */}

      {selectedDeposit && (
        <div
          className="management-modal-overlay"
          onClick={() =>
            setSelectedDeposit(null)
          }
        >

          <div
            className="management-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="management-modal-header">

              <div>
                <h2>
                  Review Deposit
                </h2>

                <p>
                  Verify the deposit
                  information before
                  approving.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedDeposit(null)
                }
              >
                <X size={20} />
              </button>

            </div>

            <div className="management-modal-body">

              <div className="management-deposit-detail">

                <User size={18} />

                <div>
                  <span>Player</span>
                  <strong>
                    {selectedDeposit
                      .playerId
                      ?.fullName ||
                      "Unknown Player"}
                  </strong>
                </div>

              </div>

              <div className="management-deposit-detail">

                <Phone size={18} />

                <div>
                  <span>Phone</span>
                  <strong>
                    {selectedDeposit
                      .playerId?.phone ||
                      "—"}
                  </strong>
                </div>

              </div>

              <div className="management-deposit-detail">

                <WalletCards size={18} />

                <div>
                  <span>Amount</span>
                  <strong>
                    {formatAmount(
                      selectedDeposit.amount
                    )}
                  </strong>
                </div>

              </div>

              <div className="management-deposit-detail">

                <CreditCard size={18} />

                <div>
                  <span>
                    Payment Method
                  </span>

                  <strong>
                    {getPaymentMethodName(
                      selectedDeposit.paymentMethod
                    )}
                  </strong>
                </div>

              </div>

              <div className="management-deposit-detail">

                <Calendar size={18} />

                <div>
                  <span>
                    Request Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedDeposit.createdAt
                    )}
                  </strong>
                </div>

              </div>

              {selectedDeposit.reference && (
                <div className="management-deposit-detail">

                  <CreditCard size={18} />

                  <div>
                    <span>
                      Reference
                    </span>

                    <strong>
                      {
                        selectedDeposit.reference
                      }
                    </strong>
                  </div>

                </div>
              )}

              {selectedDeposit.note && (
                <div className="management-deposit-note">
                  <span>Note</span>
                  <p>
                    {selectedDeposit.note}
                  </p>
                </div>
              )}

            </div>

            <div className="management-modal-footer">

              <button
                type="button"
                className="management-cancel-button"
                onClick={() =>
                  setSelectedDeposit(null)
                }
                disabled={
                  approvingId ===
                  selectedDeposit._id
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="management-approve-button"
                onClick={() =>
                  handleApprove(
                    selectedDeposit
                  )
                }
                disabled={
                  approvingId ===
                  selectedDeposit._id
                }
              >

                {approvingId ===
                selectedDeposit._id ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="management-spin"
                    />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle
                      size={16}
                    />
                    Approve Deposit
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}