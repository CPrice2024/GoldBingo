import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  Wallet,
  RefreshCw,
  CreditCard,
  Smartphone,
  Building2,
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

import api from "../../api/axios";

export default function Withdraw() {
  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("telebirr");

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
      "Available balance:",
      walletResponse?.data?.data?.availableBalance
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
        "Failed to load withdrawal information"
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
        "Please enter a valid withdrawal amount."
      );
      return;
    }

    if (
      wallet &&
      numericAmount > wallet.availableBalance
    ) {
      setError(
        `Insufficient available balance. You can withdraw up to ${wallet.availableBalance.toFixed(
          2
        )} ETB.`
      );
      return;
    }

    if (!accountNumber.trim()) {
      setError(
        "Please enter your account or phone number."
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
        "Withdrawal request submitted successfully."
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
          "Failed to submit withdrawal"
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
            Loading withdrawal information...
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
          <h1>Withdraw</h1>
          <p>
            Withdraw your available winnings.
          </p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
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
    <span>Available Balance</span>
  </div>

  <div className="withdraw-balance-amount">
    {Number(wallet?.availableBalance || 0).toFixed(2)} ETB
  </div>

  <div className="withdraw-balance-status">
    <ShieldCheck size={16} />
    <span>Amount available for withdrawal</span>
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
              <h2>Withdraw Funds</h2>
              <p>
                Send a withdrawal request to your
                assigned agent.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Amount */}
            <div className="form-group">
              <label>
                Amount <span>*</span>
              </label>

              <div className="input-with-suffix">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  placeholder="Enter amount"
                  disabled={submitting}
                />

                <span>ETB</span>
              </div>

              <div className="available-hint">
                Available:{" "}
                {wallet?.availableBalance?.toFixed(
                  2
                ) || "0.00"}{" "}
                ETB
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label>
                Payment Method <span>*</span>
              </label>

              <div className="payment-methods">
                <button
                  type="button"
                  className={`payment-method ${
                    paymentMethod === "telebirr"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setPaymentMethod("telebirr")
                  }
                >
                  <div className="payment-icon">
                    <Smartphone size={19} />
                  </div>

                  <div className="payment-info">
                    <strong>
                      Telebirr
                    </strong>
                    <span>
                      Withdraw using Telebirr
                    </span>
                  </div>

                  {paymentMethod ===
                    "telebirr" && (
                    <CheckCircle2 size={18} />
                  )}
                </button>

                <button
                  type="button"
                  className={`payment-method ${
                    paymentMethod === "cbe"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setPaymentMethod("cbe")
                  }
                >
                  <div className="payment-icon">
                    <Building2 size={19} />
                  </div>

                  <div className="payment-info">
                    <strong>CBE</strong>
                    <span>
                      Commercial Bank of
                      Ethiopia
                    </span>
                  </div>

                  {paymentMethod === "cbe" && (
                    <CheckCircle2 size={18} />
                  )}
                </button>

                <button
                  type="button"
                  className={`payment-method ${
                    paymentMethod === "mpesa"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setPaymentMethod("mpesa")
                  }
                >
                  <div className="payment-icon">
                    <Smartphone size={19} />
                  </div>

                  <div className="payment-info">
                    <strong>M-Pesa</strong>
                    <span>
                      Withdraw using M-Pesa
                    </span>
                  </div>

                  {paymentMethod === "mpesa" && (
                    <CheckCircle2 size={18} />
                  )}
                </button>

                <button
                  type="button"
                  className={`payment-method ${
                    paymentMethod === "bank"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setPaymentMethod("bank")
                  }
                >
                  <div className="payment-icon">
                    <CreditCard size={19} />
                  </div>

                  <div className="payment-info">
                    <strong>Bank</strong>
                    <span>
                      Bank account transfer
                    </span>
                  </div>

                  {paymentMethod === "bank" && (
                    <CheckCircle2 size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Account */}
            <div className="form-group">
              <label>
                Account / Phone Number{" "}
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
                  paymentMethod === "bank"
                    ? "Enter bank account number"
                    : "Enter phone number"
                }
                disabled={submitting}
              />
            </div>

            {/* Note */}
            <div className="form-group">
              <label>
                Note
                <small>Optional</small>
              </label>

              <textarea
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
                placeholder="Add a note about this withdrawal..."
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="submit-withdraw-btn"
              disabled={
                submitting ||
                !wallet ||
                wallet.availableBalance <= 0
              }
            >
              {submitting ? (
                <>
                  <RefreshCw
                    size={18}
                    className="spin"
                  />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowDownToLine size={18} />
                  Withdraw Funds
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
            How withdrawals work
          </h3>

          <div className="steps">
            <div className="step">
              <span>1</span>

              <div>
                <strong>
                  Enter amount
                </strong>

                <p>
                  Choose the amount you want
                  to withdraw from your
                  available balance.
                </p>
              </div>
            </div>

            <div className="step">
              <span>2</span>

              <div>
                <strong>
                  Choose payment method
                </strong>

                <p>
                  Select Telebirr, CBE,
                  M-Pesa, or Bank.
                </p>
              </div>
            </div>

            <div className="step">
              <span>3</span>

              <div>
                <strong>
                  Submit request
                </strong>

                <p>
                  Your withdrawal amount
                  will temporarily be
                  reserved.
                </p>
              </div>
            </div>

            <div className="step">
              <span>4</span>

              <div>
                <strong>
                  Agent approval
                </strong>

                <p>
                  Your assigned agent
                  reviews and processes
                  the request.
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
              Withdrawal History
            </h2>

            <p>
              View your previous withdrawal
              requests.
            </p>
          </div>

          <div className="withdrawal-count">
            {withdrawals.length}{" "}
            {withdrawals.length === 1
              ? "request"
              : "requests"}
          </div>
        </div>

        {withdrawals.length === 0 ? (
          <div className="empty-state">
            <ArrowDownToLine size={30} />

            <h3>
              No withdrawals yet
            </h3>

            <p>
              Your withdrawal requests will
              appear here.
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
                  <div className="withdrawal-method-icon">
                    {withdrawal.paymentMethod ===
                    "bank" ? (
                      <Building2 size={19} />
                    ) : (
                      <Smartphone size={19} />
                    )}
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
                      ETB
                    </strong>
                  </div>

                  <div
                    className={`withdrawal-status ${withdrawal.status}`}
                  >
                    {getStatusIcon(
                      withdrawal.status
                    )}

                    {withdrawal.status}
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