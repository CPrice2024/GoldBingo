import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Gamepad2,
  History,
  RefreshCw,
  Wallet,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import { getMyWallet } from "../../api/wallet.api";
import { useAuth } from "../../context/useAuth";

const Dashboard = () => {
  const { user } = useAuth();

  const [wallet, setWallet] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadWallet = async () => {
    try {
      setError("");
      setLoading(true);

      const result =
        await getMyWallet();

      if (!result.success) {
        throw new Error(
          result.message ||
            "Failed to load wallet"
        );
      }

      setWallet(result.data);
    } catch (err) {
      console.error(
        "Wallet loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load wallet"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

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
    <div className="dashboard">

      <div className="dashboard-heading">
        <div>
          <h2>
            Dashboard
          </h2>

          <p>
            Here's what's happening
            with your GoldBingo account.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadWallet}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      <div className="wallet-summary">

        <div className="wallet-main-card">

          <div className="wallet-card-top">
            <div>
              <span>
                Available Balance
              </span>

              <h3>
                {loading
                  ? "..."
                  : `${formatAmount(
                      wallet?.availableBalance
                    )} ${
                      wallet?.currency ||
                      "ETB"
                    }`}
              </h3>
            </div>

            <div className="wallet-icon">
              <Wallet size={24} />
            </div>
          </div>

          <div className="wallet-card-bottom">
            <span>
              Total balance
            </span>

            <strong>
              {loading
                ? "..."
                : `${formatAmount(
                    wallet?.balance
                  )} ${
                    wallet?.currency ||
                    "ETB"
                  }`}
            </strong>
          </div>

        </div>

        <div className="wallet-small-card">
          <span>
            Reserved Balance
          </span>

          <strong>
            {loading
              ? "..."
              : `${formatAmount(
                  wallet?.reservedBalance
                )} ${
                  wallet?.currency ||
                  "ETB"
                }`}
          </strong>

          <small>
            Amount currently reserved
          </small>
        </div>

        <div className="wallet-small-card">
          <span>
            Account Status
          </span>

          <strong className="active-status">
            {wallet?.status ===
            "active"
              ? "Active"
              : wallet?.status ||
                "Unknown"}
          </strong>

          <small>
            Your player wallet
          </small>
        </div>

      </div>

      <section className="play-banner">

        <div className="play-banner-content">

          <span className="play-badge">
            BINGO
          </span>

          <h2>
            Ready to Play?
          </h2>

          <p>
            Join a live game
            and try your luck.
          </p>

          <Link
            to="/player/play"
            className="play-button"
          >
            <Gamepad2 size={19} />
            Play Now
          </Link>

        </div>

        <div className="play-banner-icon">
          <Gamepad2 size={100} />
        </div>

      </section>

      <section className="quick-actions">

        <div className="section-heading">
          <div>
            <h3>
              Quick Actions
            </h3>

            <p>
              Manage your wallet quickly.
            </p>
          </div>
        </div>

        <div className="action-grid">

          <Link
            to="/player/deposit"
            className="action-card"
          >
            <div className="action-icon deposit">
              <ArrowDownToLine
                size={22}
              />
            </div>

            <div>
              <strong>
                Deposit
              </strong>

              <span>
                Add funds to your wallet
              </span>
            </div>
          </Link>

          <Link
            to="/player/withdraw"
            className="action-card"
          >
            <div className="action-icon withdraw">
              <ArrowUpFromLine
                size={22}
              />
            </div>

            <div>
              <strong>
                Withdraw
              </strong>

              <span>
                Withdraw your winnings
              </span>
            </div>
          </Link>

          <Link
            to="/player/transactions"
            className="action-card"
          >
            <div className="action-icon history">
              <History size={22} />
            </div>

            <div>
              <strong>
                Transactions
              </strong>

              <span>
                View your wallet history
              </span>
            </div>
          </Link>

        </div>

      </section>

    </div>
  );
};

export default Dashboard;