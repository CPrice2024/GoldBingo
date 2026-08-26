import { useEffect, useState } from "react";

import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Calendar,
} from "lucide-react";
import "./ManagementLayout.css";

import { getAgentProfile } from "../../../api/agent.api";

export default function AgentProfile() {
  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const loadProfile = async (
    isRefresh = false
  ) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await getAgentProfile();

      setProfile(
        response?.data || null
      );
    } catch (err) {
      console.error(
        "Failed to load agent profile:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load profile"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const copyReferralCode = async () => {
    if (!profile?.referralCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        profile.referralCode
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(
        "Failed to copy referral code:",
        err
      );
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  if (loading) {
    return (
      <div className="management-page">
        <div className="management-loading">
          <RefreshCw
            size={28}
            className="management-spin"
          />

          <p>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="management-page">

      {/* Header */}

      <div className="management-page-header">

        <div className="management-page-title">

          <User size={28} />

          <div>
            <h1>
              Profile
            </h1>
          </div>

        </div>

        <button
          type="button"
          className="management-refresh-button"
          onClick={() =>
            loadProfile(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "management-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* Error */}

      {error && (
        <div className="management-error">
          {error}
        </div>
      )}

      {profile && (
        <div className="management-profile-grid">

          {/* Profile Card */}

          <div className="management-content-card">

            <div className="management-profile-cover">

              <div className="management-profile-avatar">

                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.fullName}
                  />
                ) : (
                  profile.fullName
                    ?.charAt(0)
                    ?.toUpperCase() || "A"
                )}

              </div>

            </div>

            <div className="management-profile-main">

              <h2>
                {profile.fullName}
              </h2>

              <p>
                Agent Management Account
              </p>

              <div className="management-profile-status-row">

                <span className="management-status-badge active">
                  <ShieldCheck
                    size={15}
                  />

                  {profile.status}
                </span>

                <span className="management-role-badge">
                  {profile.role}
                </span>

              </div>

            </div>

          </div>

          {/* Account Information */}

          <div className="management-content-card">

            <div className="management-content-header">

              <div>
                <h2>
                  Account Information
                </h2>

                <p>
                  Your registered management
                  account details.
                </p>
              </div>

            </div>

            <div className="management-profile-details">

              {/* Full Name */}

              <div className="management-profile-detail">

                <div className="management-profile-detail-icon">
                  <User size={19} />
                </div>

                <div>
                  <span>
                    Full Name
                  </span>

                  <strong>
                    {profile.fullName ||
                      "—"}
                  </strong>
                </div>

              </div>

              {/* Phone */}

              <div className="management-profile-detail">

                <div className="management-profile-detail-icon">
                  <Phone size={19} />
                </div>

                <div>
                  <span>
                    Phone Number
                  </span>

                  <strong>
                    {profile.phone ||
                      "—"}
                  </strong>
                </div>

              </div>

              {/* Email */}

              <div className="management-profile-detail">

                <div className="management-profile-detail-icon">
                  <Mail size={19} />
                </div>

                <div>
                  <span>
                    Email Address
                  </span>

                  <strong>
                    {profile.email ||
                      "Not provided"}
                  </strong>
                </div>

              </div>

              {/* Role */}

              <div className="management-profile-detail">

                <div className="management-profile-detail-icon">
                  <ShieldCheck
                    size={19}
                  />
                </div>

                <div>
                  <span>
                    Account Role
                  </span>

                  <strong>
                    {profile.role ||
                      "—"}
                  </strong>
                </div>

              </div>

              {/* Created */}

              <div className="management-profile-detail">

                <div className="management-profile-detail-icon">
                  <Calendar
                    size={19}
                  />
                </div>

                <div>
                  <span>
                    Account Created
                  </span>

                  <strong>
                    {formatDate(
                      profile.createdAt
                    )}
                  </strong>
                </div>

              </div>

            </div>

          </div>

          {/* Referral */}

          <div className="management-content-card management-referral-card">

            <div className="management-content-header">

              <div>
                <h2>
                  Referral Code
                </h2>

                <p>
                  Share this code with players
                  you want to assign to your
                  account.
                </p>
              </div>

              <KeyRound size={24} />

            </div>

            <div className="management-referral-code">

              <strong>
                {profile.referralCode ||
                  "—"}
              </strong>

              {profile.referralCode && (
                <button
                  type="button"
                  onClick={
                    copyReferralCode
                  }
                >
                  {copied ? (
                    <>
                      <Check
                        size={17}
                      />

                      Copied
                    </>
                  ) : (
                    <>
                      <Copy
                        size={17}
                      />

                      Copy
                    </>
                  )}
                </button>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}