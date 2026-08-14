import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";

import {
  createDeposit,
  getMyDeposits,
} from "../../api/deposits.api";

const PAYMENT_METHODS = [
  {
    value: "telebirr",
    label: "Telebirr",
    description: "Deposit using Telebirr",
  },
  {
    value: "cbe",
    label: "CBE",
    description: "Commercial Bank of Ethiopia",
  },
  {
    value: "mpesa",
    label: "M-Pesa",
    description: "Deposit using M-Pesa",
  },
  {
    value: "bank",
    label: "Bank",
    description: "Bank transfer",
  },
];

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString();
};

const formatAmount = (amount) =>
  Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getStatusIcon = (status) => {
  if (status === "approved") {
    return <CheckCircle2 size={17} />;
  }

  if (status === "rejected") {
    return <XCircle size={17} />;
  }

  return <Clock3 size={17} />;
};

function Deposit() {
  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "",
    reference: "",
    note: "",
  });

  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDeposits = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getMyDeposits();

      setDeposits(result?.data || []);
    } catch (err) {
      console.error("Failed to load deposits:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load deposit requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      setError("Please enter a valid deposit amount.");
      return;
    }

    if (!form.paymentMethod) {
      setError("Please select a payment method.");
      return;
    }

    try {
      setSubmitting(true);

      const result = await createDeposit({
        amount,
        paymentMethod: form.paymentMethod,
        reference: form.reference.trim() || undefined,
        note: form.note.trim() || undefined,
      });

      setSuccess(
        result?.message ||
          "Deposit request submitted successfully."
      );

      setForm({
        amount: "",
        paymentMethod: "",
        reference: "",
        note: "",
      });

      await loadDeposits();
    } catch (err) {
      console.error("Deposit submission failed:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit deposit request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="player-page deposit-page">
      <div className="page-header">
        <div>
          <h1>Deposit</h1>
          <p>
            Add funds to your GoldBingo wallet.
          </p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={loadDeposits}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="deposit-layout">
        <section className="deposit-card">
          <div className="card-title">
            <div className="title-icon">
              <ArrowDownToLine size={20} />
            </div>

            <div>
              <h2>Deposit Funds</h2>
              <p>
                Submit a deposit request to your assigned agent.
              </p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <XCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="amount">
                Amount <span>*</span>
              </label>

              <div className="input-with-suffix">
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={handleChange}
                  disabled={submitting}
                />

                <span>ETB</span>
              </div>
            </div>

            <div className="form-group">
              <label>
                Payment Method <span>*</span>
              </label>

              <div className="payment-methods">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    type="button"
                    key={method.value}
                    className={`payment-method ${
                      form.paymentMethod === method.value
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        paymentMethod: method.value,
                      }))
                    }
                    disabled={submitting}
                  >
                    <div className="payment-icon">
                      <CreditCard size={19} />
                    </div>

                    <div className="payment-info">
                      <strong>{method.label}</strong>
                      <span>{method.description}</span>
                    </div>

                    <div className="payment-radio">
                      {form.paymentMethod === method.value && (
                        <CheckCircle2 size={18} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reference">
                Payment Reference
                <small>Optional</small>
              </label>

              <input
                id="reference"
                name="reference"
                type="text"
                maxLength={100}
                placeholder="Enter transaction/reference number"
                value={form.reference}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="note">
                Note
                <small>Optional</small>
              </label>

              <textarea
                id="note"
                name="note"
                maxLength={500}
                rows={4}
                placeholder="Add a note about this deposit..."
                value={form.note}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="submit-deposit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2
                    size={18}
                    className="spin"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Deposit Request
                </>
              )}
            </button>
          </form>
        </section>

        <section className="deposit-info-card">
          <div className="info-icon">
            <CreditCard size={21} />
          </div>

          <h3>How deposits work</h3>

          <div className="steps">
            <div className="step">
              <span>1</span>
              <div>
                <strong>Choose a method</strong>
                <p>
                  Select how you made your payment.
                </p>
              </div>
            </div>

            <div className="step">
              <span>2</span>
              <div>
                <strong>Submit your request</strong>
                <p>
                  Enter the amount and payment reference.
                </p>
              </div>
            </div>

            <div className="step">
              <span>3</span>
              <div>
                <strong>Agent verification</strong>
                <p>
                  Your assigned agent reviews the request.
                </p>
              </div>
            </div>

            <div className="step">
              <span>4</span>
              <div>
                <strong>Balance updated</strong>
                <p>
                  Your wallet is credited after approval.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="deposits-history">
        <div className="history-header">
          <div>
            <h2>My Deposit Requests</h2>
            <p>
              Track your previous deposit requests.
            </p>
          </div>

          <span className="deposit-count">
            {deposits.length} request
            {deposits.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="empty-state">
            <Loader2 size={28} className="spin" />
            <p>Loading deposit requests...</p>
          </div>
        ) : deposits.length === 0 ? (
          <div className="empty-state">
            <ArrowDownToLine size={32} />
            <h3>No deposit requests</h3>
            <p>
              Your deposit requests will appear here.
            </p>
          </div>
        ) : (
          <div className="deposit-list">
            {deposits.map((deposit) => (
              <div
                className="deposit-row"
                key={deposit._id}
              >
                <div className="deposit-method-icon">
                  <CreditCard size={20} />
                </div>

                <div className="deposit-main">
                  <strong>
                    {deposit.paymentMethod
                      ?.toUpperCase()}
                  </strong>

                  <span>
                    {formatDate(deposit.createdAt)}
                  </span>

                  {deposit.reference && (
                    <small>
                      Ref: {deposit.reference}
                    </small>
                  )}
                </div>

                <div className="deposit-amount">
                  <strong>
                    +{formatAmount(deposit.amount)} ETB
                  </strong>
                </div>

                <div
                  className={`deposit-status ${deposit.status}`}
                >
                  {getStatusIcon(deposit.status)}
                  <span>
                    {deposit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Deposit;