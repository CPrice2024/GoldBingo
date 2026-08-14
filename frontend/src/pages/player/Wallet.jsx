import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet as WalletIcon,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { getMyWallet } from "../../api/wallet.api";

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWallet = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getMyWallet();

      if (!result.success) {
        throw new Error(
          result.message || "Failed to load wallet"
        );
      }

      setWallet(result.data);
    } catch (error) {
      console.error("Wallet error:", error);

      setError(
        error instanceof Error
          ? error.message
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
    return Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const currency = wallet?.currency || "ETB";

  return (
    <div className="wallet-page">

      {/* Header */}
      <div className="wallet-page-header">
        <div>
          <h2>Wallet</h2>
          <p>
            Manage your GoldBingo balance and funds.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadWallet}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {/* Main Balance */}
      <section className="wallet-balance-card">

        <div className="wallet-balance-content">
          <div className="wallet-balance-label">
            <WalletIcon size={18} />
            Available Balance
          </div>

          <div className="wallet-balance-amount">
            {loading
              ? "..."
              : `${formatAmount(
                  wallet?.availableBalance
                )} ${currency}`}
          </div>

          <div className="wallet-balance-status">
            <ShieldCheck size={15} />
            Wallet is{" "}
            {wallet?.status === "active"
              ? "active"
              : wallet?.status || "unknown"}
          </div>
        </div>

        <div className="wallet-balance-decoration">
          <WalletIcon size={100} />
        </div>

      </section>

      {/* Balance cards */}
      <section className="wallet-stat-grid">

        <div className="wallet-stat-card">
          <span>Total Balance</span>

          <strong>
            {loading
              ? "..."
              : `${formatAmount(
                  wallet?.balance
                )} ${currency}`}
          </strong>

          <small>
            Your total wallet balance
          </small>
        </div>

        <div className="wallet-stat-card">
          <span>Reserved Balance</span>

          <strong>
            {loading
              ? "..."
              : `${formatAmount(
                  wallet?.reservedBalance
                )} ${currency}`}
          </strong>

          <small>
            Currently reserved funds
          </small>
        </div>

        <div className="wallet-stat-card">
          <span>Available Balance</span>

          <strong className="available-amount">
            {loading
              ? "..."
              : `${formatAmount(
                  wallet?.availableBalance
                )} ${currency}`}
          </strong>

          <small>
            Funds available to use
          </small>
        </div>

      </section>

      {/* Wallet Actions */}
      <section className="wallet-actions-section">

        <div className="section-heading">
          <h3>Wallet Actions</h3>
          <p>
            Add money or withdraw your winnings.
          </p>
        </div>

        <div className="wallet-action-grid">

          <Link
            to="/player/deposit"
            className="wallet-action-card deposit-action"
          >
            <div className="wallet-action-icon">
              <ArrowDownToLine size={25} />
            </div>

            <div className="wallet-action-content">
              <strong>Deposit Funds</strong>

              <span>
                Add funds to your GoldBingo wallet
              </span>
            </div>

            <div className="wallet-action-arrow">
              →
            </div>
          </Link>

          <Link
            to="/player/withdraw"
            className="wallet-action-card withdraw-action"
          >
            <div className="wallet-action-icon">
              <ArrowUpFromLine size={25} />
            </div>

            <div className="wallet-action-content">
              <strong>Withdraw Funds</strong>

              <span>
                Withdraw your available winnings
              </span>
            </div>

            <div className="wallet-action-arrow">
              →
            </div>
          </Link>

        </div>

      </section>

      {/* Wallet Information */}
      <section className="wallet-info-card">

        <div className="wallet-info-icon">
          <ShieldCheck size={21} />
        </div>

        <div>
          <h3>Wallet Information</h3>

          <p>
            Your available balance is the amount
            you can currently use for playing or
            withdrawing. Reserved funds are temporarily
            held for pending transactions.
          </p>
        </div>

      </section>

    </div>
  );
};

export default Wallet;