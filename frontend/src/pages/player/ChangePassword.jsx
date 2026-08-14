import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { changePassword } from "../../api/profile.api";

function ChangePassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.currentPassword ||
      !form.newPassword ||
      !form.confirmPassword
    ) {
      setError(
        "Please fill in all password fields."
      );
      return;
    }

    if (form.newPassword.length < 6) {
      setError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (
      form.newPassword !==
      form.confirmPassword
    ) {
      setError(
        "New password and confirmation do not match."
      );
      return;
    }

    if (
      form.currentPassword ===
      form.newPassword
    ) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await changePassword({
          currentPassword:
            form.currentPassword,

          newPassword:
            form.newPassword,
        });

      setSuccess(
        response.message ||
          "Password changed successfully."
      );

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">

      {/* Header */}
      <div className="change-password-header">

        <button
          type="button"
          className="back-profile-btn"
          onClick={() =>
            navigate("/player/profile")
          }
        >
          <ArrowLeft size={17} />
          Back to Profile
        </button>

        <h1>Change Password</h1>

        <p>
          Update your password to keep your
          account secure.
        </p>

      </div>

      {/* Card */}
      <div className="change-password-card">

        <div className="change-password-icon">
          <Lock size={24} />
        </div>

        <div className="change-password-title">
          <h2>Update Password</h2>

          <p>
            Enter your current password and
            choose a new secure password.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="password-alert password-error">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="password-alert password-success">
            <CheckCircle size={17} />
            <span>{success}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="change-password-form"
        >

          {/* Current password */}
          <div className="password-field">

            <label>
              Current Password
            </label>

            <div className="change-password-input">

              <input
                type={
                  showCurrent
                    ? "text"
                    : "password"
                }
                name="currentPassword"
                value={
                  form.currentPassword
                }
                onChange={handleChange}
                placeholder="Enter current password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-visibility-btn"
                onClick={() =>
                  setShowCurrent(
                    (prev) => !prev
                  )
                }
              >
                {showCurrent ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>

          {/* New password */}
          <div className="password-field">

            <label>
              New Password
            </label>

            <div className="change-password-input">

              <input
                type={
                  showNew
                    ? "text"
                    : "password"
                }
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-visibility-btn"
                onClick={() =>
                  setShowNew(
                    (prev) => !prev
                  )
                }
              >
                {showNew ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

            <span className="password-hint">
              Minimum 6 characters.
            </span>

          </div>

          {/* Confirm password */}
          <div className="password-field">

            <label>
              Confirm New Password
            </label>

            <div className="change-password-input">

              <input
                type={
                  showConfirm
                    ? "text"
                    : "password"
                }
                name="confirmPassword"
                value={
                  form.confirmPassword
                }
                onChange={handleChange}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-visibility-btn"
                onClick={() =>
                  setShowConfirm(
                    (prev) => !prev
                  )
                }
              >
                {showConfirm ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>

          <button
            type="submit"
            className="change-password-submit"
            disabled={loading}
          >
            {loading
              ? "Updating Password..."
              : "Update Password"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default ChangePassword;