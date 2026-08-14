import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  Lock,
  Phone,
  User,
  Mail,
  Gift,
  ArrowRight,
} from "lucide-react";

import { registerPlayer } from "../../api/auth.api";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState({
      fullName: "",
      phone: "",
      email: "",
      password: "",
      referralCode: "",
    });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (form.fullName.trim().length < 2) {
      setError(
        "Full name must be at least 2 characters."
      );
      return;
    }

    if (form.phone.trim().length < 8) {
      setError(
        "Valid phone number is required."
      );
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await registerPlayer({
          fullName:
            form.fullName.trim(),

          phone:
            form.phone.trim(),

          email:
            form.email.trim() || undefined,

          password:
            form.password,

          referralCode:
            form.referralCode.trim() ||
            undefined,
        });

      if (!result.success) {
        throw new Error(
          result.message ||
            "Registration failed"
        );
      }

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/player/login", {
          replace: true,
        });
      }, 1200);

    } catch (err) {
      console.error(
        "Player registration error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="player-auth-page">

      <div className="player-auth-container">

        <div className="player-auth-brand">
          <div className="player-logo">
            B
          </div>

          <h1>GoldBingo</h1>

          <p>
            Create your account and start playing.
          </p>
        </div>

        <div className="player-auth-card">

          <div className="auth-heading">
            <h2>Create Account</h2>

            <p>
              Join GoldBingo today
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
          >

            <div className="form-group">
              <label>
                Full Name
              </label>

              <div className="input-wrapper">
                <User size={18} />

                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={
                    handleChange
                  }
                  placeholder="Your full name"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Phone Number
              </label>

              <div className="input-wrapper">
                <Phone size={18} />

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={
                    handleChange
                  }
                  placeholder="09XXXXXXXX"
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Email
                <span>
                  {" "}Optional
                </span>
              </label>

              <div className="input-wrapper">
                <Mail size={18} />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={
                    handleChange
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Password
              </label>

              <div className="input-wrapper">
                <Lock size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={form.password}
                  onChange={
                    handleChange
                  }
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>
                Agent Referral Code
                <span>
                  {" "}Optional
                </span>
              </label>

              <div className="input-wrapper">
                <Gift size={18} />

                <input
                  type="text"
                  name="referralCode"
                  value={
                    form.referralCode
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter referral code"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="player-auth-button"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}

              {!loading && (
                <ArrowRight size={18} />
              )}
            </button>

          </form>

          <div className="auth-footer">
            <span>
              Already have an account?
            </span>

            <Link to="/player/login">
              Sign In
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Signup;