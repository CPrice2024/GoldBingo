import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Phone,
  ArrowRight,
} from "lucide-react";

import { loginUser } from "../../api/auth.api";
import { useAuth } from "../../context/useAuth";
import { requestFcmToken } from "../../notifications";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    phone: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
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

    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      const result = await loginUser(
        form.phone.trim(),
        form.password
      );

      if (!result.success) {
        throw new Error(
          result.message || "Login failed"
        );
      }

      const {
        accessToken,
        user,
      } = result.data;

      // Save authenticated player
      login(accessToken, user);

      // Register this browser for FCM.
      // Notification failure should NOT prevent login.
      try {
        await requestFcmToken(
          accessToken
        );
      } catch (notificationError) {
        console.error(
          "FCM registration failed:",
          notificationError
        );
      }

      navigate("/player/dashboard", {
        replace: true,
      });
    } catch (err) {
      console.error(
        "Player login error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to login"
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
            Play. Win. Enjoy.
          </p>
        </div>

        <div className="player-auth-card">

          <div className="auth-heading">
            <h2>Welcome Back</h2>

            <p>
              Sign in to continue playing
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
          >
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
              <button
  type="button"
  className="player-forgot-password"
  onClick={() =>
    navigate("/player/forgot-password")
  }
>
  Forgot Password?
</button>

            </div>

            <button
              type="submit"
              className="player-auth-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}

              {!loading && (
                <ArrowRight size={18} />
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>
              Don't have an account?
            </span>

            <Link to="/player/signup">
              Create Account
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;