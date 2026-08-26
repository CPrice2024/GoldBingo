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
  ArrowRight,
} from "lucide-react";

import logo from "../../assets/logo.png";

import { registerPlayer } from "../../api/auth.api";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    phone: "",
    password: "",
    repeatPassword: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showRepeatPassword, setShowRepeatPassword] =
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

    // Validate phone
    if (form.phone.trim().length < 8) {
      setError(
        "Valid phone number is required."
      );
      return;
    }

    // Validate password length
    if (form.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    // Validate matching passwords
    if (
      form.password !==
      form.repeatPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const result =
  await registerPlayer({
    phone: form.phone.trim(),
    password: form.password,
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
  <img
    src={logo}
    alt="GoldBingo Logo"
  />
</div>

          <p>
            Create & play now.
          </p>
        </div>

        <div className="player-auth-card">

          <div className="auth-heading">
            <h2>Create Account</h2>
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

          <form onSubmit={handleSubmit}>

            {/* Phone Number */}
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
                  onChange={handleChange}
                  placeholder="09XXXXXXXX"
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
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
                  onChange={handleChange}
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

            {/* Repeat Password */}
            <div className="form-group">
              <label>
                Repeat Password
              </label>

              <div className="input-wrapper">
                <Lock size={18} />

                <input
                  type={
                    showRepeatPassword
                      ? "text"
                      : "password"
                  }
                  name="repeatPassword"
                  value={form.repeatPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowRepeatPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                >
                  {showRepeatPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {/* Password Match Message */}
              {form.repeatPassword && (
                <small
                  className={
                    form.password ===
                    form.repeatPassword
                      ? "password-match"
                      : "password-no-match"
                  }
                >
                  {form.password ===
                  form.repeatPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </small>
              )}
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