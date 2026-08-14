import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Trophy,
  Gamepad2,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";

import { getAdminTransactions } from "../../../api/admin.api";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadTransactions = async () => {
    try {
      setError("");

      const response = await getAdminTransactions();

      if (response?.success) {
        setTransactions(response.data || []);
      } else {
        throw new Error(
          response?.message ||
            "Failed to retrieve transactions"
        );
      }
    } catch (err) {
      console.error(
        "Failed to load admin transactions:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to retrieve transactions"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine size={18} />;

      case "withdrawal":
        return <ArrowUpFromLine size={18} />;

      case "game_win":
        return <Trophy size={18} />;

      case "game_entry":
        return <Gamepad2 size={18} />;

      default:
        return <Wallet size={18} />;
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case "deposit":
        return "Deposit";

      case "withdrawal":
        return "Withdrawal";

      case "game_win":
        return "Game Win";

      case "game_entry":
        return "Game Entry";

      case "deposit_reversal":
        return "Deposit Reversal";

      case "withdrawal_reversal":
        return "Withdrawal Reversal";

      case "game_entry_reversal":
        return "Game Entry Reversal";

      default:
        return type;
    }
  };

  const getAmountPrefix = (type) => {
    if (
      type === "deposit" ||
      type === "game_win"
    ) {
      return "+";
    }

    return "-";
  };

  const filteredTransactions =
    transactions.filter((transaction) => {
      const player =
        transaction.userId?.fullName || "";

      const phone =
        transaction.userId?.phone || "";

      const reference =
        transaction.reference || "";

      const description =
        transaction.description || "";

      const matchesSearch =
        !search.trim() ||
        player
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        phone
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        reference
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        description
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        transaction.type === typeFilter;

      return matchesSearch && matchesType;
    });

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-transactions-page">
        <div className="admin-page-loading">
          Loading transactions...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-transactions-page">

      <div className="admin-page-header">
        <div>
          <h1>Transactions</h1>

          <p>
            View all platform transactions and
            account activity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="admin-refresh-button"
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "admin-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>


      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}


      <div className="admin-transactions-toolbar">

        <div className="admin-search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search player, phone, reference..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>


        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value)
          }
          className="admin-transaction-filter"
        >
          <option value="all">
            All Transactions
          </option>

          <option value="deposit">
            Deposits
          </option>

          <option value="withdrawal">
            Withdrawals
          </option>

          <option value="game_entry">
            Game Entries
          </option>

          <option value="game_win">
            Game Wins
          </option>

          <option value="deposit_reversal">
            Deposit Reversals
          </option>

          <option value="withdrawal_reversal">
            Withdrawal Reversals
          </option>

          <option value="game_entry_reversal">
            Game Entry Reversals
          </option>
        </select>

      </div>


      <div className="admin-transactions-card">

        <div className="admin-transactions-card-header">
          <div>
            <h2>Transaction History</h2>

            <span>
              {filteredTransactions.length}{" "}
              transaction
              {filteredTransactions.length !== 1
                ? "s"
                : ""}
            </span>
          </div>
        </div>


        {filteredTransactions.length === 0 ? (
          <div className="admin-empty-state">
            <Wallet size={36} />

            <h3>No transactions found</h3>

            <p>
              No transactions match your current
              search or filter.
            </p>
          </div>
        ) : (

          <div className="admin-transactions-table-wrapper">

            <table className="admin-transactions-table">

              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Player</th>
                  <th>Amount</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Processed By</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>

                {filteredTransactions.map(
                  (transaction) => {

                    const type =
                      transaction.type;

                    return (
                      <tr
                        key={transaction._id}
                      >

                        <td>
                          <div className="admin-transaction-type">

                            <div className="admin-transaction-icon">
                              {getTransactionIcon(
                                type
                              )}
                            </div>

                            <div>
                              <strong>
                                {getTransactionLabel(
                                  type
                                )}
                              </strong>

                              <small>
                                {transaction.reference ||
                                  transaction.description ||
                                  "-"}
                              </small>
                            </div>

                          </div>
                        </td>


                        <td>
                          <div className="admin-player-info">
                            <strong>
                              {transaction.userId
                                ?.fullName ||
                                "Unknown"}
                            </strong>

                            <small>
                              {transaction.userId
                                ?.phone ||
                                "-"}
                            </small>
                          </div>
                        </td>


                        <td>
                          <span
                            className={
                              `admin-transaction-amount ` +
                              (
                                type ===
                                  "deposit" ||
                                type ===
                                  "game_win"
                                  ? "positive"
                                  : "negative"
                              )
                            }
                          >
                            {getAmountPrefix(type)}
                            {Number(
                              transaction.amount
                            ).toLocaleString()}{" "}
                            ETB
                          </span>
                        </td>


                        <td>
                          <div className="admin-balance-info">
                            <span>
                              {Number(
                                transaction.balanceBefore
                              ).toLocaleString()}
                            </span>

                            <span>
                              →
                            </span>

                            <strong>
                              {Number(
                                transaction.balanceAfter
                              ).toLocaleString()}
                            </strong>
                          </div>
                        </td>


                        <td>
                          <span
                            className={
                              `admin-status-badge ` +
                              (
                                transaction.status ===
                                "completed"
                                  ? "completed"
                                  : "reversed"
                              )
                            }
                          >
                            {transaction.status}
                          </span>
                        </td>


                        <td>
                          {transaction.processedBy ? (
                            <div className="admin-processed-by">

                              <strong>
                                {
                                  transaction
                                    .processedBy
                                    .fullName
                                }
                              </strong>

                              <small>
                                {
                                  transaction
                                    .processedBy
                                    .role
                                }
                              </small>

                            </div>
                          ) : (
                            <span className="admin-not-processed">
                              —
                            </span>
                          )}
                        </td>


                        <td>
                          <span className="admin-date">
                            {formatDate(
                              transaction.createdAt
                            )}
                          </span>
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