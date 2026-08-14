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
} from "../../../api/admin.api";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
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
      !form.password
    ) {
      setError(
        "Full name, phone and password are required"
      );
      return;
    }

    try {
      setCreating(true);

      const response =
        await createAgent({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email:
            form.email.trim() || undefined,
          password: form.password,
        });

      setSuccess(
        response?.message ||
          "Agent created successfully"
      );

      setForm({
        fullName: "",
        phone: "",
        email: "",
        password: "",
      });

      setShowCreate(false);

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

      {showCreate && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              setShowCreate(false);
            }
          }}
        >

          <div className="admin-modal">

            <div className="admin-modal-header">

              <div>
                <h2>
                  Create Agent
                </h2>

                <p>
                  Create a new GoldBingo
                  management account.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
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

              <div className="admin-modal-actions">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
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