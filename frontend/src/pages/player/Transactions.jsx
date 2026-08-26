import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleDollarSign,
  Gamepad2,
  RefreshCw,
  RotateCcw,
  WalletCards,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

import { getMyTransactions } from "../../api/transactions.api";
import { useLanguage } from "../../context/LanguageContext";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const loadTransactions = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await getMyTransactions();

      setTransactions(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (err) {
      console.error("Failed to load transactions:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load transactions."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (filter === "all") {
      return transactions;
    }

    if (filter === "deposit") {
      return transactions.filter(
        (transaction) =>
          transaction.type === "deposit" ||
          transaction.type === "deposit_reversal"
      );
    }

    if (filter === "withdrawal") {
      return transactions.filter(
        (transaction) =>
          transaction.type === "withdrawal" ||
          transaction.type === "withdrawal_reversal"
      );
    }

    if (filter === "game") {
      return transactions.filter(
        (transaction) =>
          transaction.type === "game_entry" ||
          transaction.type === "game_entry_reversal" ||
          transaction.type === "game_win"
      );
    }

    return transactions;
  }, [transactions, filter]);

  const getTransactionIcon = (type) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine size={20} />;

      case "withdrawal":
        return <ArrowUpFromLine size={20} />;

      case "game_entry":
        return <Gamepad2 size={20} />;

      case "game_win":
        return <CircleDollarSign size={20} />;

      case "deposit_reversal":
      case "withdrawal_reversal":
      case "game_entry_reversal":
        return <RotateCcw size={20} />;

      default:
        return <WalletCards size={20} />;
    }
  };

  const getTransactionClass = (type) => {
    if (type === "deposit") {
      return "transaction-icon deposit";
    }

    if (type === "withdrawal") {
      return "transaction-icon withdrawal";
    }

    if (type === "game_win") {
      return "transaction-icon win";
    }

    if (
      type === "deposit_reversal" ||
      type === "withdrawal_reversal" ||
      type === "game_entry_reversal"
    ) {
      return "transaction-icon reversal";
    }

    return "transaction-icon game";
  };

  const getTransactionTitle = (type) => {
  switch (type) {
    case "deposit":
      return t("transactions.types.deposit");

    case "withdrawal":
      return t("transactions.types.withdrawal");

    case "deposit_reversal":
      return t("transactions.types.depositReversal");

    case "withdrawal_reversal":
      return t("transactions.types.withdrawalReversal");

    case "game_entry":
      return t("transactions.types.gameEntry");

    case "game_entry_reversal":
      return t("transactions.types.gameEntryReversal");

    case "game_win":
      return t("transactions.types.gameWin");

    default:
      return t("transactions.types.transaction");
  }
};

  const getAmountClass = (type) => {
    if (
      type === "deposit" ||
      type === "game_win" ||
      type === "withdrawal_reversal" ||
      type === "game_entry_reversal"
    ) {
      return "transaction-amount positive";
    }

    return "transaction-amount negative";
  };

  const getAmountPrefix = (type) => {
    if (
      type === "deposit" ||
      type === "game_win" ||
      type === "withdrawal_reversal" ||
      type === "game_entry_reversal"
    ) {
      return "+";
    }

    return "-";
  };

  const getStatusIcon = (status) => {
    if (status === "completed") {
      return <CheckCircle2 size={14} />;
    }

    if (status === "reversed") {
      return <RotateCcw size={14} />;
    }

    return <AlertCircle size={14} />;
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  return (
    <div className="player-page transactions-page">
      <div className="page-header">
        <div>
          <h1>{t("transactions.title")}</h1>

<p>
  {t("transactions.subtitle")}
</p>
        </div>

        <button
          className="refresh-btn"
          onClick={() => loadTransactions(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "refresh-spinning"
                : ""
            }
          />

          {refreshing
  ? t("transactions.refreshing")
  : t("common.refresh")}
        </button>
      </div>

      <div className="transaction-summary">
        <div className="transaction-summary-card">
          <div className="summary-icon">
            <WalletCards size={21} />
          </div>

          <div>
            <span>{t("transactions.totalTransactions")}</span>
            <strong>{transactions.length}</strong>
          </div>
        </div>

        <div className="transaction-summary-card">
          <div className="summary-icon deposit-summary">
            <ArrowDownToLine size={21} />
          </div>

          <div>
            <span>{t("transactions.deposits")}</span>
            <strong>
              {
                transactions.filter(
                  (t) => t.type === "deposit"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="transaction-summary-card">
          <div className="summary-icon withdrawal-summary">
            <ArrowUpFromLine size={21} />
          </div>

          <div>
            <span>{t("transactions.withdrawals")}</span>
            <strong>
              {
                transactions.filter(
                  (t) =>
                    t.type === "withdrawal"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="transaction-summary-card">
          <div className="summary-icon game-summary">
            <Gamepad2 size={21} />
          </div>

          <div>
            <span>{t("transactions.gameActivity")}</span>
            <strong>
              {
                transactions.filter(
                  (t) =>
                    t.type === "game_entry" ||
                    t.type === "game_win" ||
                    t.type ===
                      "game_entry_reversal"
                ).length
              }
            </strong>
          </div>
        </div>
      </div>

      <div className="transactions-card">
        <div className="transactions-card-header">
          <div>
            <h2>{t("transactions.history")}</h2>

<p>
  {t("transactions.historyDescription")}
</p>
          </div>

          <div className="transaction-filters">
            <button
  className={filter === "all" ? "active" : ""}
  onClick={() => setFilter("all")}
>
  {t("transactions.filters.all")}
</button>

<button
  className={filter === "deposit" ? "active" : ""}
  onClick={() => setFilter("deposit")}
>
  {t("transactions.filters.deposits")}
</button>

<button
  className={filter === "withdrawal" ? "active" : ""}
  onClick={() => setFilter("withdrawal")}
>
  {t("transactions.filters.withdrawals")}
</button>

<button
  className={filter === "game" ? "active" : ""}
  onClick={() => setFilter("game")}
>
  {t("transactions.filters.games")}
</button>
          </div>
        </div>

        {loading ? (
          <div className="transactions-loading">
            <RefreshCw
              size={28}
              className="refresh-spinning"
            />

            <p>
              {t("transactions.loading")}.
            </p>
          </div>
        ) : error ? (
          <div className="transactions-error">
            <AlertCircle size={30} />

            <h3>
  {t("transactions.loadError")}
</h3>

            <p>{error}</p>

            <button
              onClick={() =>
                loadTransactions()
              }
            >
             {t("common.tryAgain")}
            </button>
          </div>
        ) : filteredTransactions.length ===
          0 ? (
          <div className="transactions-empty">
            <div className="empty-transaction-icon">
              <WalletCards size={32} />
            </div>

            <h3>
  {t("transactions.emptyTitle")}
</h3>

<p>
  {t("transactions.emptyDescription")}
</p>
          </div>
        ) : (
          <div className="transaction-list">
            {filteredTransactions.map(
              (transaction) => (
                <div
                  className="transaction-item"
                  key={
                    transaction._id ||
                    transaction.id
                  }
                >
                  <div
                    className={getTransactionClass(
                      transaction.type
                    )}
                  >
                    {getTransactionIcon(
                      transaction.type
                    )}
                  </div>

                  <div className="transaction-details">
                    <div className="transaction-title-row">
                      <h3>
                        {getTransactionTitle(
                          transaction.type
                        )}
                      </h3>

                      <span
                        className={`transaction-status ${transaction.status}`}
                      >
                        {getStatusIcon(
                          transaction.status
                        )}

                        {t(`transactions.status.${transaction.status}`)}
                      </span>
                    </div>

                    <p>
                      {transaction.description ||
                        transaction.reference ||
                        "Wallet transaction"}
                    </p>

                    <div className="transaction-meta">
                      <span>
                        {formatDate(
                          transaction.createdAt
                        )}
                      </span>

                      {transaction.reference && (
                        <>
                          <span className="meta-dot">
                            •
                          </span>

                          <span>
                            {t("transactions.reference")}:{" "}
                            {
                              transaction.reference
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="transaction-right">
                    <strong
                      className={getAmountClass(
                        transaction.type
                      )}
                    >
                      {getAmountPrefix(
                        transaction.type
                      )}
                      {formatAmount(
                        transaction.amount
                      )}{" "}
                      {transaction.currency ||
                        "ETB"}
                    </strong>

                    <span>
                      {t("transactions.balance")}:{" "}
                      {formatAmount(
                        transaction.balanceAfter
                      )}{" "}
                      {transaction.currency ||
                        "ETB"}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;