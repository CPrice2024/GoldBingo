import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  Wallet,
  RefreshCw,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import {
  createWithdrawal,
  getMyWithdrawals,
} from "../../api/withdrawals.api";

import { useLanguage } from "../../context/LanguageContext";

import api from "../../api/axios";
import telebirrLogo from "../../assets/payment/telebirr.png";
import cbeLogo from "../../assets/payment/cbe.png";

const PAYMENT_METHOD_META = {
  telebirr: {
    value: "telebirr",
    label: "Telebirr",
    descriptionKey: "withdraw.telebirrDescription",
    icon: telebirrLogo,
  },

  cbe: {
    value: "cbe",
    label: "CBE",
    descriptionKey: "withdraw.cbeDescription",
    icon: cbeLogo,
  },
};

export default function Withdraw() {
  const { t } = useLanguage();
  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("telebirr");

  const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWAL = 100000;

  const [accountNumber, setAccountNumber] =
    useState("");

  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

const loadData = async () => {
  try {
    setLoading(true);
    setError("");

    // Load wallet first
    const walletResponse = await api.get("/wallet/me");

    console.log("========== WITHDRAW WALLET ==========");
    console.log("Wallet response:", walletResponse);
    console.log("Wallet data:", walletResponse?.data);
    console.log(
  "Withdrawable winnings:",
  walletResponse?.data?.data?.withdrawableWinningBalance
);
    console.log("======================================");

    if (walletResponse?.data?.success) {
      setWallet(walletResponse.data.data);
    } else {
      throw new Error(
        walletResponse?.data?.message ||
          "Failed to load wallet"
      );
    }

    // Load withdrawal history separately
    try {
      const withdrawalsResponse =
        await getMyWithdrawals();

      console.log(
        "Withdrawal response:",
        withdrawalsResponse
      );

      if (withdrawalsResponse?.success) {
        setWithdrawals(
          withdrawalsResponse.data || []
        );
      }
    } catch (withdrawalError) {
      console.error(
        "Failed to load withdrawal history:",
        withdrawalError
      );
    }

  } catch (err) {
    console.error(
      "Failed to load withdrawal data:",
      err
    );

    setError(
      err?.response?.data?.message ||
        err?.message ||
        t("withdraw.loadError")
    );
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
  setError(
    t("withdraw.invalidAmount")
  );
  return;
}

if (numericAmount < MIN_WITHDRAWAL) {
  setError(
    `${t("withdraw.minimumWithdrawal")} ${MIN_WITHDRAWAL.toLocaleString()} ${t(
      "common.birr"
    )}.`
  );
  return;
}

if (numericAmount > MAX_WITHDRAWAL) {
  setError(
     `${t("withdraw.maximumWithdrawal")} ${MAX_WITHDRAWAL.toLocaleString()} ${t(
      "common.birr"
    )}.`
  );
  return;
}

const withdrawableWinningBalance = Number(
  wallet?.withdrawableWinningBalance || 0
);

if (numericAmount > withdrawableWinningBalance) {
  setError(
   `${t(
      "withdraw.insufficientBalance"
    )} ${withdrawableWinningBalance.toFixed(
      2
    )} ${t("common.birr")}.`
  );
  return;
}

    if (!accountNumber.trim()) {
      setError(
       t("withdraw.accountRequired")
      );
      return;
    }

    try {
      setSubmitting(true);

      const response =
        await createWithdrawal({
          amount: numericAmount,
          paymentMethod,
          accountNumber:
            accountNumber.trim(),
          note: note.trim() || undefined,
        });

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to submit withdrawal"
        );
      }

      setSuccess(
        t("withdraw.requestSubmitted")
      );

      setAmount("");
      setAccountNumber("");
      setNote("");

      await loadData();
    } catch (err) {
      console.error(
        "Withdrawal submission error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          t("withdraw.submitFailed")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString();
  };

  const getStatusIcon = (status) => {
    if (status === "approved") {
      return <CheckCircle2 size={16} />;
    }

    if (status === "rejected") {
      return <XCircle size={16} />;
    }

    return <Clock3 size={16} />;
  };

  if (loading) {
    return (
      <div className="withdraw-page">
        <div className="withdraw-loading">
          <RefreshCw
            size={28}
            className="spin"
          />
          <p>
            {t("withdraw.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="withdraw-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>
  {t("withdraw.title")}
</h1>

<p>
  {t("withdraw.subtitle")}
</p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={17} />
          {t("common.refresh")}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="withdraw-balance-card">
  <div className="withdraw-balance-label">
    <Wallet size={22} />

    <span>
      {t("withdraw.withdrawableAmount")}
    </span>
  </div>

  <div className="withdraw-balance-amount">
    {Number(
      wallet?.withdrawableWinningBalance || 0
    ).toFixed(2)}{" "}
    {t("common.birr")}
  </div>

  <div className="withdraw-balance-status">
    <ShieldCheck size={16} />

    <span>
      {t("withdraw.currentWithdrawableAmount")}
    </span>
  </div>
</div>

      <div className="withdraw-layout">
        {/* Form */}
        <div className="withdraw-card">
          <div className="card-title">
            <div className="title-icon">
              <ArrowDownToLine size={21} />
            </div>

            <div>
              <h2>
                {t("withdraw.withdrawFunds")}
              </h2>
              <p>
                {t("withdraw.withdrawDescription")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Amount */}
            <div className="form-group">
  <label>
    {t("withdraw.amount")} <span>*</span>
  </label>

  <div className="input-with-suffix">
    <input
      type="number"
      min={MIN_WITHDRAWAL}
      max={MAX_WITHDRAWAL}
      step="1"
      value={amount}
      onChange={(e) =>
        setAmount(e.target.value)
      }
      placeholder={t("withdraw.enterAmount")}
      disabled={submitting}
    />

    <span>
      {t("common.birr")}
    </span>
  </div>

  <div className="payment-info span">
    {t("withdraw.withdrawalLimits")}:{" "}
    {MIN_WITHDRAWAL.toLocaleString()} -{" "}
    {MAX_WITHDRAWAL.toLocaleString()}{" "}
    {t("common.birr")}
  </div>

  <div className="payment-info span">
    {t("withdraw.availableAmount")}:{" "}
    {Number(
      wallet?.withdrawableWinningBalance || 0
    ).toFixed(2)}{" "}
    {t("common.birr")}
  </div>
</div>

            {/* Payment Method */}
            {/* Payment Method */}
<div className="form-group">
  <label>
    {t("withdraw.paymentMethod")} <span>*</span>
  </label>

  <div className="payment-methods">
    {Object.values(PAYMENT_METHOD_META).map(
      (method) => (
        <button
          type="button"
          key={method.value}
          className={`payment-method ${
            paymentMethod === method.value
              ? "selected"
              : ""
          }`}
          onClick={() =>
            setPaymentMethod(method.value)
          }
          disabled={submitting}
        >
          <div className="payment-icon payment-logo">
            <img
              src={method.icon}
              alt={method.label}
            />
          </div>

          <div className="payment-info">
            <strong>{method.label}</strong>

            <span>
              {t(method.descriptionKey)}
            </span>
          </div>

          <div className="payment-radio">
            {paymentMethod === method.value && (
              <CheckCircle2 size={18} />
            )}
          </div>
        </button>
      )
    )}
  </div>
</div>

            {/* Account */}
            <div className="form-group">
              <label>
                {t("withdraw.accountOrPhone")}{" "}
                <span>*</span>
              </label>

              <input
                type="text"
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(
                    e.target.value
                  )
                }
                placeholder={
  paymentMethod === "cbe"
   ? t("withdraw.enterCbeAccount")
    : t("withdraw.enterTelebirrPhone")
}
                disabled={submitting}
              />
            </div>

            {/* Note */}
            <div className="form-group">
              <label>
  {t("withdraw.note")}
  <small>
    {t("withdraw.optional")}
  </small>
</label>

              <textarea
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
                placeholder={t("withdraw.notePlaceholder")}
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="submit-deposit-btn"
              disabled={
  submitting ||
  !wallet ||
  Number(wallet.withdrawableWinningBalance || 0) <= 0
}
            >
              {submitting ? (
                <>
                  <RefreshCw
                    size={18}
                    className="spin"
                  />
                  {t("withdraw.processing")}
                </>
              ) : (
                <>
                  <ArrowDownToLine size={18} />
                  {t("withdraw.withdrawFunds")}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Instructions */}
        <div className="withdraw-info-card">
  <div className="info-icon">
    <Wallet size={22} />
  </div>

  <h3>
    {t("withdraw.howWithdrawalsWork")}
  </h3>

  <div className="steps">
    <div className="step">
      <span>1</span>

      <div>
        <strong>
          {t("withdraw.checkBalance")}
        </strong>

        <p>
          {t("withdraw.checkBalanceDescription")}
        </p>
      </div>
    </div>

    <div className="step">
      <span>2</span>

      <div>
        <strong>
          {t("withdraw.choosePaymentMethod")}
        </strong>

        <p>
          {t("withdraw.choosePaymentDescription")}
        </p>
      </div>
    </div>

    <div className="step">
      <span>3</span>

      <div>
        <strong>
          {t("withdraw.submitRequest")}
        </strong>

        <p>
          {t("withdraw.submitRequestDescription")}
        </p>
      </div>
    </div>

    <div className="step">
      <span>4</span>

      <div>
        <strong>
          {t("withdraw.agentApproval")}
        </strong>

        <p>
          {t("withdraw.agentApprovalDescription")}
        </p>
      </div>
    </div>
  </div>
</div>
      </div>

      {/* History */}
      <div className="withdrawals-history">
        <div className="history-header">
  <div>
    <h2>
      {t("withdraw.history")}
    </h2>

    <p>
      {t("withdraw.historyDescription")}
    </p>
  </div>

  <div className="withdrawal-count">
    {withdrawals.length}{" "}
    {withdrawals.length === 1
      ? t("withdraw.request")
      : t("withdraw.requests")}
  </div>
</div>

        {withdrawals.length === 0 ? (
          <div className="empty-state">
  <ArrowDownToLine size={30} />

  <h3>
    {t("withdraw.noWithdrawals")}
  </h3>

  <p>
    {t("withdraw.withdrawalsAppearHere")}
  </p>
</div>
        ) : (
          <div className="withdrawal-list">
            {withdrawals.map(
              (withdrawal) => (
                <div
                  className="withdrawal-row"
                  key={withdrawal._id}
                >
                  <div className="withdrawal-method-icon payment-logo">
  <img
    src={
      PAYMENT_METHOD_META[
        withdrawal.paymentMethod
      ]?.icon || telebirrLogo
    }
    alt={
      PAYMENT_METHOD_META[
        withdrawal.paymentMethod
      ]?.label || "Payment"
    }
  />
</div>

                  <div className="withdrawal-main">
                    <strong>
                      {withdrawal.paymentMethod}
                    </strong>

                    <span>
                      {
                        withdrawal.accountNumber
                      }
                    </span>

                    <small>
                      {formatDate(
                        withdrawal.createdAt
                      )}
                    </small>
                  </div>

                  <div className="withdrawal-amount">
                    <strong>
                      -
                      {Number(
                        withdrawal.amount
                      ).toFixed(2)}{" "}
                      Birr
                    </strong>
                  </div>

                  <div
                    className={`withdrawal-status ${withdrawal.status}`}
                  >
                    {getStatusIcon(
                      withdrawal.status
                    )}

                    {withdrawal.status === "approved"
  ? t("withdraw.statusApproved")
  : withdrawal.status === "rejected"
  ? t("withdraw.statusRejected")
  : t("withdraw.statusPending")}
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