import { useEffect, useMemo, useState } from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Wallet,
  Gamepad2,
  RotateCcw,
  Trophy,
  Receipt,
} from "lucide-react";
import "./ManagementLayout.css";

import { getMyTransactions } from "../../../api/transactions.api";

export default function AgentTransactions() {
  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("all");

  const loadTransactions = async (
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
        await getMyTransactions();

      setTransactions(
        response?.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load transactions:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load transactions"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const formatAmount = (amount) => {
    return `${Number(
      amount || 0
    ).toLocaleString("en-US")} ETB`;
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

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

  const getTypeLabel = (type) => {
    const labels = {
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      deposit_reversal:
        "Deposit Reversal",
      withdrawal_reversal:
        "Withdrawal Reversal",
      game_entry: "Game Entry",
      game_entry_reversal:
        "Game Entry Reversal",
      game_win: "Game Win",
    };

    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft size={17} />;

      case "withdrawal":
        return <ArrowUpRight size={17} />;

      case "game_entry":
        return <Gamepad2 size={17} />;

      case "game_win":
        return <Trophy size={17} />;

      case "deposit_reversal":
      case "withdrawal_reversal":
      case "game_entry_reversal":
        return <RotateCcw size={17} />;

      default:
        return <Receipt size={17} />;
    }
  };

  const filteredTransactions =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return transactions.filter(
        (transaction) => {
          const matchesType =
            typeFilter === "all" ||
            transaction.type ===
              typeFilter;

          if (!matchesType) {
            return false;
          }

          if (!query) {
            return true;
          }

          return (
            transaction.type
              ?.toLowerCase()
              .includes(query) ||
            transaction.status
              ?.toLowerCase()
              .includes(query) ||
            transaction.reference
              ?.toLowerCase()
              .includes(query) ||
            transaction.description
              ?.toLowerCase()
              .includes(query) ||
            transaction.amount
              ?.toString()
              .includes(query)
          );
        }
      );
    }, [
      transactions,
      search,
      typeFilter,
    ]);

  const totalAmount =
    transactions.reduce(
      (sum, transaction) =>
        sum +
        Number(
          transaction.amount || 0
        ),
      0
    );

  const completedCount =
    transactions.filter(
      (transaction) =>
        transaction.status ===
        "completed"
    ).length;

  const reversedCount =
    transactions.filter(
      (transaction) =>
        transaction.status ===
        "reversed"
    ).length;

  if (loading) {
    return (
      <div className="management-page">
        <div className="management-loading">
          <RefreshCw
            size={28}
            className="management-spin"
          />

          <p>
            Loading transactions...
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

          <Receipt size={28} />

          <div>
            <h1>
              Transactions
            </h1>

            <p>
              View your management account
              transaction history.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="management-refresh-button"
          onClick={() =>
            loadTransactions(true)
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
          <span>{error}</span>
        </div>
      )}

      {/* Statistics */}

      <div className="management-stats-grid">

        <div className="management-stat-card">

          <div className="management-stat-icon">
            <Receipt size={22} />
          </div>

          <div>
            <span>
              Total Transactions
            </span>

            <strong>
              {transactions.length}
            </strong>
          </div>

        </div>

        <div className="management-stat-card">

          <div className="management-stat-icon">
            <Wallet size={22} />
          </div>

          <div>
            <span>
              Total Amount
            </span>

            <strong>
              {formatAmount(
                totalAmount
              )}
            </strong>
          </div>

        </div>

        <div className="management-stat-card">

          <div className="management-stat-icon">
            <ArrowDownLeft size={22} />
          </div>

          <div>
            <span>
              Completed
            </span>

            <strong>
              {completedCount}
            </strong>
          </div>

        </div>

        <div className="management-stat-card">

          <div className="management-stat-icon">
            <RotateCcw size={22} />
          </div>

          <div>
            <span>
              Reversed
            </span>

            <strong>
              {reversedCount}
            </strong>
          </div>

        </div>

      </div>

      {/* Transactions */}

      <div className="management-content-card">

        <div className="management-content-header">

          <div>
            <h2>
              Transaction History
            </h2>

            <p>
              All transactions belonging
              to your management account.
            </p>
          </div>

          <div className="management-transaction-controls">

            <div className="management-search">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value
                )
              }
              className="management-filter-select"
            >
              <option value="all">
                All Types
              </option>

              <option value="deposit">
                Deposits
              </option>

              <option value="withdrawal">
                Withdrawals
              </option>

              <option value="game_entry">
                Game Entry
              </option>

              <option value="game_win">
                Game Win
              </option>

              <option value="deposit_reversal">
                Deposit Reversal
              </option>

              <option value="withdrawal_reversal">
                Withdrawal Reversal
              </option>

              <option value="game_entry_reversal">
                Game Entry Reversal
              </option>
            </select>

          </div>

        </div>

        {filteredTransactions.length ===
        0 ? (
          <div className="management-empty">

            <Receipt size={44} />

            {transactions.length ===
            0 ? (
              <>
                <h3>
                  No transactions yet
                </h3>

                <p>
                  Your transaction history
                  will appear here.
                </p>
              </>
            ) : (
              <>
                <h3>
                  No matching transactions
                </h3>

                <p>
                  Try changing your search
                  or filter.
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
                    Type
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Balance Before
                  </th>

                  <th>
                    Balance After
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Reference
                  </th>

                  <th>
                    Date
                  </th>
                </tr>

              </thead>

              <tbody>

                {filteredTransactions.map(
                  (transaction) => {

                    const isPositive =
                      transaction.type ===
                        "deposit" ||
                      transaction.type ===
                        "game_win";

                    return (
                      <tr
                        key={
                          transaction._id
                        }
                      >

                        {/* Type */}

                        <td>

                          <div
                            className={`management-transaction-type ${
                              isPositive
                                ? "positive"
                                : "negative"
                            }`}
                          >

                            {getTypeIcon(
                              transaction.type
                            )}

                            <div>
                              <strong>
                                {getTypeLabel(
                                  transaction.type
                                )}
                              </strong>

                              {transaction.description && (
                                <small>
                                  {
                                    transaction.description
                                  }
                                </small>
                              )}
                            </div>

                          </div>

                        </td>

                        {/* Amount */}

                        <td>

                          <strong
                            className={
                              isPositive
                                ? "management-positive"
                                : "management-negative"
                            }
                          >
                            {isPositive
                              ? "+"
                              : "-"}
                            {formatAmount(
                              transaction.amount
                            )}
                          </strong>

                        </td>

                        {/* Before */}

                        <td>
                          {formatAmount(
                            transaction.balanceBefore
                          )}
                        </td>

                        {/* After */}

                        <td>
                          {formatAmount(
                            transaction.balanceAfter
                          )}
                        </td>

                        {/* Status */}

                        <td>

                          <span
                            className={`management-status-badge ${
                              transaction.status ===
                              "completed"
                                ? "active"
                                : "reversed"
                            }`}
                          >
                            {
                              transaction.status
                            }
                          </span>

                        </td>

                        {/* Reference */}

                        <td>
                          {transaction.reference ||
                            "—"}
                        </td>

                        {/* Date */}

                        <td>
                          {formatDate(
                            transaction.createdAt
                          )}
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

    </div>
  );
}