import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  User,
  Phone,
  ShieldCheck,
  Calendar,
  UserCheck,
  RefreshCw,
} from "lucide-react";

import { getMyProfile } from "../../api/profile.api";

function Profile() {
  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

    const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getMyProfile();

      setProfile(response.data);
    } catch (error) {
      console.error(
        "Failed to load profile:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <RefreshCw
            size={20}
            className="spin"
          />
          Loading profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <p>{error}</p>

          <button
            onClick={fetchProfile}
            className="profile-refresh-btn"
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const initials =
    profile.fullName
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const createdDate = profile.createdAt
    ? new Date(
        profile.createdAt
      ).toLocaleDateString()
    : "-";

  return (
    <div className="profile-page">

      {/* Header */}
      <div className="profile-header">
        <div>
          <h1>Profile</h1>

          <p>
            Manage your GoldBingo account
            information.
          </p>
        </div>

        <button
          onClick={fetchProfile}
          className="profile-refresh-btn"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Profile Hero */}
      <section className="profile-card">

        <div className="profile-avatar">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.fullName}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="profile-main-info">
          <h2>{profile.fullName}</h2>

          <p className="profile-phone">
            {profile.phone}
          </p>

          <div className="profile-badges">

            <span className="profile-badge role">
              <User size={14} />
              Player
            </span>

            <span className="profile-badge active">
              <ShieldCheck size={14} />
              {profile.status}
            </span>

            {profile.isVerified && (
              <span className="profile-badge verified">
                <UserCheck size={14} />
                Verified
              </span>
            )}

          </div>
        </div>

      </section>

      {/* Account Information */}
      <section className="profile-section">

        <div className="profile-section-header">
          <div>
            <h2>Account Information</h2>

            <p>
              Your basic account details.
            </p>
          </div>
        </div>

        <div className="profile-info-grid">

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <User size={19} />
            </div>

            <div>
              <span>Full Name</span>
              <strong>
                {profile.fullName}
              </strong>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <Phone size={19} />
            </div>

            <div>
              <span>Phone Number</span>
              <strong>
                {profile.phone}
              </strong>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <ShieldCheck size={19} />
            </div>

            <div>
              <span>Account Status</span>
              <strong>
                {profile.status}
              </strong>
            </div>
          </div>

          <div className="profile-info-item">
            <div className="profile-info-icon">
              <Calendar size={19} />
            </div>

            <div>
              <span>Member Since</span>
              <strong>
                {createdDate}
              </strong>
            </div>
          </div>

        </div>

      </section>

      {/* Security */}
      <section className="profile-section">

        <div className="profile-section-header">
          <div>
            <h2>Security</h2>

            <p>
              Keep your account secure.
            </p>
          </div>
        </div>

        <div className="profile-security-card">

          <div>
            <div className="security-title">
              Password
            </div>

            <div className="security-description">
              Your password is securely
              encrypted.
            </div>
          </div>

          <button
  className="profile-secondary-btn"
  onClick={() =>
    navigate("/player/change-password")
  }
>
  Change Password
</button>

        </div>

      </section>

    </div>
  );
}

export default Profile;