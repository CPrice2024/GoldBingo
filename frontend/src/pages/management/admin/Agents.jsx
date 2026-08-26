import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Copy,
  X,
} from "lucide-react";

import {
  getAdminAgents,
  createAgent,
  updateAgent,
} from "../../../api/admin.api";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [editingAgent, setEditingAgent] =
  useState(null);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
  fullName: "",
  phone: "",
  email: "",
  password: "",

  paymentSettings: {
    telebirr: {
      enabled: true,
      account: "",
    },
    cbe: {
      enabled: true,
      account: "",
    },
    minDeposit: 10,
    maxDeposit: 10000,
  },
});

  const loadAgents = async () => {
    try {
      setError("");

      const response =
        await getAdminAgents();

      setAgents(response?.data || []);
    } catch (err) {
      console.error(
        "Failed to load agents:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load agents"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAgents();
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

   if (
  !form.fullName.trim() ||
  !form.phone.trim() ||
  (!editingAgent && !form.password)
) {
  setError(
    editingAgent
      ? "Full name and phone are required"
      : "Full name, phone and password are required"
  );

  return;
}

    const {
  telebirr,
  cbe,
  minDeposit,
  maxDeposit,
} = form.paymentSettings;

if (!telebirr.enabled && !cbe.enabled) {
  setError(
    "At least one payment method must be enabled"
  );
  return;
}

if (
  telebirr.enabled &&
  !telebirr.account.trim()
) {
  setError(
    "Telebirr payment number is required"
  );
  return;
}

if (
  cbe.enabled &&
  !cbe.account.trim()
) {
  setError(
    "CBE account number is required"
  );
  return;
}

if (Number(minDeposit) <= 0) {
  setError(
    "Minimum deposit must be greater than 0"
  );
  return;
}

if (Number(maxDeposit) <= 0) {
  setError(
    "Maximum deposit must be greater than 0"
  );
  return;
}

if (
  Number(minDeposit) >= Number(maxDeposit)
) {
  setError(
    "Maximum deposit must be greater than minimum deposit"
  );
  return;
}

    try {
      setCreating(true);

      const agentData = {
  fullName: form.fullName.trim(),
  phone: form.phone.trim(),
  email:
    form.email.trim() || undefined,

  paymentSettings: {
    telebirr: {
      enabled:
        form.paymentSettings.telebirr.enabled,

      account:
        form.paymentSettings.telebirr.account.trim(),
    },

    cbe: {
      enabled:
        form.paymentSettings.cbe.enabled,

      account:
        form.paymentSettings.cbe.account.trim(),
    },

    minDeposit: Number(
      form.paymentSettings.minDeposit
    ),

    maxDeposit: Number(
      form.paymentSettings.maxDeposit
    ),
  },
};
if (!editingAgent) {
  agentData.password = form.password;

  const response =
    await createAgent(agentData);

  setSuccess(
    response?.message ||
      "Agent created successfully"
  );
} else {
  const response =
    await updateAgent(
      editingAgent._id,
      {
        ...agentData,

        // Only send password when changed
        ...(form.password.trim()
          ? {
              password:
                form.password.trim(),
            }
          : {}),
      }
    );

  setSuccess(
    response?.message ||
      "Agent updated successfully"
  );
}

      setForm({
  fullName: "",
  phone: "",
  email: "",
  password: "",

  paymentSettings: {
    telebirr: {
      enabled: true,
      account: "",
    },
    cbe: {
      enabled: true,
      account: "",
    },
    minDeposit: 10,
    maxDeposit: 10000,
  },
});

      setShowCreate(false);
setEditingAgent(null);
setError("");

      await loadAgents();
    } catch (err) {
      console.error(
        "Failed to create agent:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to create agent"
      );
    } finally {
      setCreating(false);
    }
  };

const handleEditAgent = (agent) => {
  setError("");
  setSuccess("");

  setEditingAgent(agent);

  setForm({
    fullName: agent.fullName || "",
    phone: agent.phone || "",
    email: agent.email || "",
    password: "",

    paymentSettings: {
      telebirr: {
        enabled:
          agent.paymentSettings?.telebirr?.enabled ??
          false,

        account:
          agent.paymentSettings?.telebirr?.account ||
          "",
      },

      cbe: {
        enabled:
          agent.paymentSettings?.cbe?.enabled ??
          false,

        account:
          agent.paymentSettings?.cbe?.account ||
          "",
      },

      minDeposit:
        agent.paymentSettings?.minDeposit ?? 10,

      maxDeposit:
        agent.paymentSettings?.maxDeposit ?? 10000,
    },
  });
};
const closeAgentModal = () => {
  setShowCreate(false);
  setEditingAgent(null);
  setError("");
  setSuccess("");
};

  const filteredAgents =
    agents.filter((agent) => {
      const query =
        search.toLowerCase().trim();

      if (!query) return true;

      return (
        agent.fullName
          ?.toLowerCase()
          .includes(query) ||
        agent.phone
          ?.toLowerCase()
          .includes(query) ||
        agent.email
          ?.toLowerCase()
          .includes(query) ||
        agent.referralCode
          ?.toLowerCase()
          .includes(query)
      );
    });

  const copyReferralCode = async (
    referralCode
  ) => {
    try {
      await navigator.clipboard.writeText(
        referralCode
      );

      setSuccess(
        "Referral code copied"
      );

      setTimeout(
        () => setSuccess(""),
        2000
      );
    } catch {
      setError(
        "Failed to copy referral code"
      );
    }
  };

  return (
    <div className="admin-agents-page">

      {/* Header */}
      <div className="admin-page-header">

        <div>
          <h1>Agents</h1>

          <p>
            Manage GoldBingo agents and
            their accounts.
          </p>
        </div>

        <div className="admin-page-actions">

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "admin-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              setShowCreate(true)
            }
          >
            <Plus size={17} />

            Create Agent
          </button>

        </div>
      </div>

      {/* Messages */}

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-success">
          {success}
        </div>
      )}

      {/* Search */}

      <div className="admin-agents-toolbar">

        <div className="admin-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="admin-agents-count">
          {filteredAgents.length} agent
          {filteredAgents.length !== 1
            ? "s"
            : ""}
        </div>

      </div>

      {/* Agents */}

      {loading ? (
        <div className="admin-loading">
          Loading agents...
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="admin-empty">
          <User size={40} />

          <h3>No agents found</h3>

          <p>
            No agents match your search.
          </p>
        </div>
      ) : (
        <div className="admin-agents-grid">

          {filteredAgents.map(
            (agent) => (
              <div
                className="admin-agent-card"
                key={agent._id}
              >

                <div className="admin-agent-card-top">

                  <div className="admin-agent-avatar">
                    {agent.fullName
                      ?.charAt(0)
                      ?.toUpperCase() ||
                      "A"}
                  </div>

                  <div>
                    <h3>
                      {agent.fullName}
                    </h3>

                    <span
                      className={`admin-status ${
                        agent.status
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>

                </div>

                <div className="admin-agent-info">

                  <div>
                    <Phone size={16} />

                    <span>
                      {agent.phone}
                    </span>
                  </div>

                  <div>
                    <Mail size={16} />

                    <span>
                      {agent.email ||
                        "No email"}
                    </span>
                  </div>

                  <div>
                    <ShieldCheck
                      size={16}
                    />

                    <span>
                      {agent.isVerified
                        ? "Verified"
                        : "Not verified"}
                    </span>
                  </div>

                </div>

                <div className="admin-referral">

                  <div>
                    <small>
                      Referral Code
                    </small>

                    <strong>
                      {agent.referralCode ||
                        "—"}
                    </strong>
                  </div>

                  {agent.referralCode && (
                    <button
                      type="button"
                      onClick={() =>
                        copyReferralCode(
                          agent.referralCode
                        )
                      }
                      title="Copy referral code"
                    >
                      <Copy size={16} />
                    </button>
                  )}

                </div>

                <div className="admin-agent-footer">
                  <button
  type="button"
  className="admin-agent-edit-btn"
  onClick={() => handleEditAgent(agent)}
>
  Edit
</button>

                  <span>
                    Created{" "}
                    {agent.createdAt
                      ? new Date(
                          agent.createdAt
                        ).toLocaleDateString()
                      : "—"}
                  </span>

                  <span>
                    {agent.lastLogin
                      ? `Last login ${new Date(
                          agent.lastLogin
                        ).toLocaleDateString()}`
                      : "Never logged in"}
                  </span>

                </div>

              </div>
            )
          )}

        </div>
      )}

      {/* Create Agent Modal */}

      {(showCreate || editingAgent) && (
        <div
  className="admin-modal-overlay"
  onClick={(e) => {
    if (e.target === e.currentTarget) {
      closeAgentModal();
    }
  }}
>

         <div
  className="admin-modal"
  onClick={(e) => e.stopPropagation()}
>

            <div className="admin-modal-header">

              <div>
                <h2>
  {editingAgent
    ? "Edit Agent"
    : "Create Agent"}
</h2>

                <p>
  {editingAgent
    ? "Update agent account and payment settings."
    : "Create a new GoldBingo management account."}
</p>
              </div>

              <button
  type="button"
  onClick={closeAgentModal}
>
  <X size={20} />
</button>

            </div>

            <form
              onSubmit={handleCreate}
              className="admin-create-agent-form"
            >

              <label>
                Full Name

                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </label>

              <label>
                Phone Number

                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </label>

              <label>
                Email

                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email (optional)"
                />
              </label>

              <label>
                Password

                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                />
              </label>
              <div className="agent-payment-settings">

  <div className="agent-payment-settings-header">
    <div>
      <h3>Payment Settings</h3>
      <p>
        Configure the payment methods this agent
        will use for player deposits.
      </p>
    </div>
  </div>

  {/* Telebirr */}
  <div className="agent-payment-method">

    <div className="agent-payment-method-header">

      <div>
        <strong>Telebirr</strong>
        <span>
          Player deposit payment number
        </span>
      </div>

      <label className="agent-payment-toggle">
        <input
          type="checkbox"
          checked={
            form.paymentSettings.telebirr.enabled
          }
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              paymentSettings: {
                ...prev.paymentSettings,
                telebirr: {
                  ...prev.paymentSettings.telebirr,
                  enabled: e.target.checked,
                },
              },
            }))
          }
        />

        <span />
      </label>

    </div>

    {form.paymentSettings.telebirr.enabled && (
      <label>
        Telebirr Payment Number

        <input
          type="tel"
          value={
            form.paymentSettings.telebirr.account
          }
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              paymentSettings: {
                ...prev.paymentSettings,
                telebirr: {
                  ...prev.paymentSettings.telebirr,
                  account: e.target.value,
                },
              },
            }))
          }
          placeholder="e.g. 0942953765"
        />
      </label>
    )}

  </div>

  {/* CBE */}
  <div className="agent-payment-method">

    <div className="agent-payment-method-header">

      <div>
        <strong>CBE</strong>
        <span>
          Commercial Bank of Ethiopia account
        </span>
      </div>

      <label className="agent-payment-toggle">
        <input
          type="checkbox"
          checked={
            form.paymentSettings.cbe.enabled
          }
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              paymentSettings: {
                ...prev.paymentSettings,
                cbe: {
                  ...prev.paymentSettings.cbe,
                  enabled: e.target.checked,
                },
              },
            }))
          }
        />

        <span />
      </label>

    </div>

    {form.paymentSettings.cbe.enabled && (
      <label>
        CBE Account Number

        <input
          type="text"
          value={
            form.paymentSettings.cbe.account
          }
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              paymentSettings: {
                ...prev.paymentSettings,
                cbe: {
                  ...prev.paymentSettings.cbe,
                  account: e.target.value,
                },
              },
            }))
          }
          placeholder="Enter CBE account number"
        />
      </label>
    )}

  </div>

  {/* Deposit Limits */}
  <div className="agent-deposit-limits">

    <div>
      <label>
        Minimum Deposit

        <input
          type="number"
          min="1"
          value={
            form.paymentSettings.minDeposit
          }
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              paymentSettings: {
                ...prev.paymentSettings,
                minDeposit: e.target.value,
              },
            }))
          }
        />
      </label>
    </div>

    <div>
      <label>
        Maximum Deposit

        <input
          type="number"
          min="1"
          value={
            form.paymentSettings.maxDeposit
          }
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              paymentSettings: {
                ...prev.paymentSettings,
                maxDeposit: e.target.value,
              },
            }))
          }
        />
      </label>
    </div>

  </div>

  <div className="agent-payment-limit-hint">
    Deposit range:{" "}
    {form.paymentSettings.minDeposit || 0} ETB
    {" "}–{" "}
    {form.paymentSettings.maxDeposit || 0} ETB
  </div>

</div>

              <div className="admin-modal-actions">

               <button
  type="button"
  onClick={closeAgentModal}
>
  Cancel
</button>

                <button
                  type="submit"
                  disabled={creating}
                >
                  {creating
  ? editingAgent
    ? "Saving..."
    : "Creating..."
  : editingAgent
    ? "Save Changes"
    : "Create Agent"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}