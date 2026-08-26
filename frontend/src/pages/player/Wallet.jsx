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
import { useLanguage } from "../../context/LanguageContext";

const Wallet = () => {
  const { t } = useLanguage();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const totalReservedBalance =
  Number(
    wallet?.reservedBalance ||
      0
  ) +
  Number(
    wallet?.reservedWinningBalance ||
      0
  );

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
          <h2>
            {t("wallet.title")}
          </h2>

          <p>
            {t("wallet.subtitle")}
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

          {t("common.refresh")}
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

            {t("wallet.availableBalance")}
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

            {t("wallet.walletIs")}{" "}

            {wallet?.status === "active"
              ? t("wallet.active")
              : wallet?.status ||
                t("common.unknown")}
          </div>

        </div>

        <div className="wallet-balance-decoration">
          <WalletIcon size={100} />
        </div>

      </section>

      {/* Balance cards */}
      <section className="wallet-stat-grid">

        <div className="wallet-stat-card">

          <span>
            {t("wallet.totalBalance")}
          </span>

          <strong>
            {loading
              ? "..."
              : `${formatAmount(
                  wallet?.balance
                )} ${currency}`}
          </strong>

          <small>
            {t("wallet.totalBalanceDescription")}
          </small>

        </div>

        <div className="wallet-stat-card">

          <span>
            {t("wallet.reservedBalance")}
          </span>

          <strong>
  {loading
    ? "..."
    : `${formatAmount(
        totalReservedBalance
      )} ${currency}`}
</strong>

          <small>
            {t("wallet.reservedBalanceDescription")}
          </small>

        </div>

        

      </section>

      {/* Wallet Actions */}
      <section className="wallet-actions-section">

        <div className="section-heading">

          <h3>
            {t("wallet.actions")}
          </h3>

          <p>
            {t("wallet.actionsDescription")}
          </p>

        </div>

        <div className="wallet-action-grid">

          {/* Deposit */}

          <Link
            to="/player/deposit"
            className="wallet-action-card deposit-action"
          >

            <div className="wallet-action-icon">
              <ArrowDownToLine size={25} />
            </div>

            <div className="wallet-action-content">

              <strong>
                {t("wallet.depositFunds")}
              </strong>

              <span>
                {t("wallet.depositDescription")}
              </span>

            </div>

            <div className="wallet-action-arrow">
              →
            </div>

          </Link>

          {/* Withdraw */}

          <Link
            to="/player/withdraw"
            className="wallet-action-card withdraw-action"
          >

            <div className="wallet-action-icon">
              <ArrowUpFromLine size={25} />
            </div>

            <div className="wallet-action-content">

              <strong>
                {t("wallet.withdrawFunds")}
              </strong>

              <span>
                {t("wallet.withdrawDescription")}
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

          <h3>
            {t("wallet.informationTitle")}
          </h3>

          <p>
            {t("wallet.informationDescription")}
          </p>

        </div>

      </section>

    </div>
  );
};

export default Wallet;