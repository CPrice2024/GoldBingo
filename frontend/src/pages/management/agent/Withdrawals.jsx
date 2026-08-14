import { useEffect, useMemo, useState } from "react";
import {
  WalletCards,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  CreditCard,
  Calendar,
  X,
  AlertTriangle,
} from "lucide-react";

import {
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from "../../../api/withdrawals.api";
import "./ManagementLayout.css";

export default function AgentWithdrawals() {
  const [withdrawals, setWithdrawals] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [processingId, setProcessingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState(null);

  const [action, setAction] =
    useState(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const loadWithdrawals = async (
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
        await getPendingWithdrawals();

      setWithdrawals(
        response?.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load withdrawals:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load withdrawals"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const filteredWithdrawals =
    useMemo(() => {
      const value = search
        .trim()
        .toLowerCase();

      if (!value) {
        return withdrawals;
      }

      return withdrawals.filter(
        (withdrawal) => {
          return (
            withdrawal.paymentMethod
              ?.toLowerCase()
              .includes(value) ||
            withdrawal.accountNumber
              ?.toLowerCase()
              .includes(value) ||
            withdrawal.note
              ?.toLowerCase()
              .includes(value) ||
            withdrawal.amount
              ?.toString()
              .includes(value) ||
            withdrawal.playerId?.fullName
              ?.toLowerCase()
              .includes(value) ||
            withdrawal.playerId?.phone
              ?.toLowerCase()
              .includes(value)
          );
        }
      );
    }, [withdrawals, search]);

  const totalPendingAmount =
    withdrawals.reduce(
      (total, withdrawal) =>
        total +
        Number(withdrawal.amount || 0),
      0
    );

  const formatAmount = (amount) => {
    return `${Number(
      amount || 0
    ).toLocaleString("en-US")} ETB`;
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

  const getPaymentMethodName = (
    method
  ) => {
    const names = {
      telebirr: "Telebirr",
      cbe: "CBE",
      mpesa: "M-Pesa",
      bank: "Bank",
    };

    return (
      names[method] ||
      method ||
      "—"
    );
  };

  const openReview = (
    withdrawal
  ) => {
    setSelectedWithdrawal(
      withdrawal
    );

    setAction(null);
    setRejectionReason("");
  };

  const closeModal = () => {
    if (processingId) {
      return;
    }

    setSelectedWithdrawal(null);
    setAction(null);
    setRejectionReason("");
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) {
      return;
    }

    const confirmed =
      window.confirm(
        `Approve withdrawal of ${formatAmount(
          selectedWithdrawal.amount
        )}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(
        selectedWithdrawal._id
      );

      setError("");

      await approveWithdrawal(
        selectedWithdrawal._id
      );

      setWithdrawals(
        (current) =>
          current.filter(
            (item) =>
              item._id !==
              selectedWithdrawal._id
          )
      );

      closeModal();
    } catch (err) {
      console.error(
        "Failed to approve withdrawal:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to approve withdrawal"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) {
      return;
    }

    if (!rejectionReason.trim()) {
      setError(
        "Please enter a rejection reason"
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Reject this withdrawal request?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(
        selectedWithdrawal._id
      );

      setError("");

      await rejectWithdrawal(
        selectedWithdrawal._id,
        rejectionReason.trim()
      );

      setWithdrawals(
        (current) =>
          current.filter(
            (item) =>
              item._id !==
              selectedWithdrawal._id
          )
      );

      closeModal();
    } catch (err) {
      console.error(
        "Failed to reject withdrawal:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reject withdrawal"
      );
    } finally {
      setProcessingId(null);
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
            Loading pending withdrawals...
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
            <h1>
              Withdrawals
            </h1>

            <p>
              Review and process player
              withdrawal requests.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="management-refresh-button"
          onClick={() =>
            loadWithdrawals(true)
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
      <strong>{withdrawals.length}</strong>
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
      <AlertTriangle size={22} />
    </div>

    <div>
      <span>Action Required</span>
      <strong>Review Requests</strong>
    </div>
  </div>

</div>

      {/* Main Card */}

      <div className="management-content-card">

        <div className="management-content-header">

          <div>
            <h2>
              Pending Withdrawals
            </h2>

            <p>
              Withdrawal requests waiting
              for your decision.
            </p>
          </div>

          <div className="management-search">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search withdrawals..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* Empty */}

        {filteredWithdrawals.length ===
        0 ? (
          <div className="management-empty">

            <WalletCards size={44} />

            {withdrawals.length ===
            0 ? (
              <>
                <h3>
                  No pending withdrawals
                </h3>

                <p>
                  New player withdrawal
                  requests will appear
                  here.
                </p>
              </>
            ) : (
              <>
                <h3>
                  No matching withdrawals
                </h3>

                <p>
                  Try another search
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
                  <th>
                    Player
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Payment Method
                  </th>

                  <th>
                    Account
                  </th>

                  <th>
                    Requested
                  </th>

                  <th>
                    Action
                  </th>
                </tr>

              </thead>

              <tbody>

                {filteredWithdrawals.map(
                  (withdrawal) => {

                    const player =
                      withdrawal.playerId;

                    return (
                      <tr
                        key={
                          withdrawal._id
                        }
                      >

                        {/* Player */}

                        <td>

                          <div className="management-player-cell">

                            <div className="management-player-avatar">
                              {player?.fullName
                                ?.charAt(
                                  0
                                )
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
                              withdrawal.amount
                            )}
                          </strong>

                        </td>

                        {/* Payment */}

                        <td>

                          <div className="management-table-detail">

                            <CreditCard
                              size={15}
                            />

                            {getPaymentMethodName(
                              withdrawal.paymentMethod
                            )}

                          </div>

                        </td>

                        {/* Account */}

                        <td>
                          {withdrawal.accountNumber ||
                            "—"}
                        </td>

                        {/* Date */}

                        <td>

                          <div className="management-table-detail">

                            <Calendar
                              size={15}
                            />

                            {formatDate(
                              withdrawal.createdAt
                            )}

                          </div>

                        </td>

                        {/* Action */}

                        <td>

                          <button
                            type="button"
                            className="management-approve-button"
                            onClick={() =>
                              openReview(
                                withdrawal
                              )
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

      {selectedWithdrawal && (
        <div
          className="management-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="management-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Modal Header */}

            <div className="management-modal-header">

              <div>
                <h2>
                  Review Withdrawal
                </h2>

                <p>
                  Verify the request before
                  approving or rejecting it.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={
                  !!processingId
                }
              >
                <X size={20} />
              </button>

            </div>

            {/* Details */}

            <div className="management-modal-body">

              <div className="management-deposit-detail">

                <User size={18} />

                <div>
                  <span>
                    Player
                  </span>

                  <strong>
                    {selectedWithdrawal
                      .playerId
                      ?.fullName ||
                      "Unknown Player"}
                  </strong>
                </div>

              </div>

              <div className="management-deposit-detail">

                <Phone size={18} />

                <div>
                  <span>
                    Phone
                  </span>

                  <strong>
                    {selectedWithdrawal
                      .playerId
                      ?.phone || "—"}
                  </strong>
                </div>

              </div>

              <div className="management-deposit-detail">

                <WalletCards size={18} />

                <div>
                  <span>
                    Amount
                  </span>

                  <strong>
                    {formatAmount(
                      selectedWithdrawal.amount
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
                      selectedWithdrawal.paymentMethod
                    )}
                  </strong>
                </div>

              </div>

              <div className="management-deposit-detail">

                <CreditCard size={18} />

                <div>
                  <span>
                    Account Number
                  </span>

                  <strong>
                    {selectedWithdrawal
                      .accountNumber ||
                      "—"}
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
                      selectedWithdrawal.createdAt
                    )}
                  </strong>
                </div>

              </div>

              {selectedWithdrawal.note && (
                <div className="management-deposit-note">

                  <span>
                    Player Note
                  </span>

                  <p>
                    {
                      selectedWithdrawal.note
                    }
                  </p>

                </div>
              )}

              {/* Rejection */}

              {action ===
                "reject" && (
                <div className="management-deposit-note">

                  <span>
                    Rejection Reason
                  </span>

                  <textarea
                    value={
                      rejectionReason
                    }
                    onChange={(e) =>
                      setRejectionReason(
                        e.target.value
                      )
                    }
                    placeholder="Enter reason for rejecting this withdrawal..."
                    rows={4}
                    maxLength={500}
                  />

                </div>
              )}

            </div>

            {/* Footer */}

            <div className="management-modal-footer">

              {action ===
              "reject" ? (
                <>

                  <button
                    type="button"
                    className="management-cancel-button"
                    onClick={() => {
                      setAction(null);
                      setRejectionReason(
                        ""
                      );
                    }}
                    disabled={
                      !!processingId
                    }
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    className="management-reject-button"
                    onClick={
                      handleReject
                    }
                    disabled={
                      !!processingId
                    }
                  >

                    {processingId ? (
                      <>
                        <RefreshCw
                          size={16}
                          className="management-spin"
                        />

                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle
                          size={16}
                        />

                        Confirm Rejection
                      </>
                    )}

                  </button>

                </>
              ) : (
                <>

                  <button
                    type="button"
                    className="management-reject-button"
                    onClick={() =>
                      setAction(
                        "reject"
                      )
                    }
                    disabled={
                      !!processingId
                    }
                  >
                    <XCircle
                      size={16}
                    />

                    Reject
                  </button>

                  <button
                    type="button"
                    className="management-approve-button"
                    onClick={
                      handleApprove
                    }
                    disabled={
                      !!processingId
                    }
                  >

                    {processingId ? (
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

                        Approve Withdrawal
                      </>
                    )}

                  </button>

                </>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}