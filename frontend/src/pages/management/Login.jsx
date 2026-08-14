import { useContext, useState } from "react";
import { AuthContext } from "../../context/auth-context";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Phone,
  LogIn,
  Loader2,
} from "lucide-react";

import { loginUser } from "../../api/auth.api";

export default function ManagementLogin() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!phone.trim() || !password) {
      setError(
        "Phone number and password are required"
      );
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser(
        phone.trim(),
        password
      );

      /*
       * Backend response:
       *
       * {
       *   success: true,
       *   message: "Login successful",
       *   data: {
       *     accessToken: "...",
       *     user: {
       *       id: "...",
       *       fullName: "...",
       *       phone: "...",
       *       role: "agent"
       *     }
       *   }
       * }
       */

      const data = response?.data;

      if (!data?.accessToken) {
        throw new Error(
          "Login failed. Access token was not received."
        );
      }

      const user = data.user;

      if (!user?.role) {
        throw new Error(
          "User role was not received."
        );
      }

      /*
       * Only management users can use
       * this login page.
       */

      if (
        user.role !== "admin" &&
        user.role !== "agent"
      ) {
        setError(
          "This login is only available for management accounts."
        );

        return;
      }

    /*
 * Save authentication
 */

localStorage.removeItem("accessToken");
localStorage.removeItem("user");

login(data.accessToken, user);

/*
 * Redirect according to role
 */

if (user.role === "admin") {
  navigate("/admin/dashboard", {
    replace: true,
  });

  return;
}

if (user.role === "agent") {
  navigate("/agent/dashboard", {
    replace: true,
  });

  return;
}

    } catch (err) {
      console.error(
        "Management login failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid phone number or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="management-login-page">

      <div className="management-login-card">

        {/* Logo */}

        <div className="management-login-logo">
          B
        </div>


        {/* Header */}

        <div className="management-login-header">

          <h1>
            Management Login
          </h1>

          <p>
            Sign in to your GoldBingo management
            account
          </p>

        </div>


        {/* Error */}

        {error && (
          <div className="management-login-error">
            {error}
          </div>
        )}


        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="management-login-form"
        >

          {/* Phone */}

          <div className="management-form-group">

            <label>
              Phone Number
            </label>

            <div className="management-input-wrapper">

              <Phone size={18} />

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Enter phone number"
                autoComplete="tel"
              />

            </div>

          </div>


          {/* Password */}

          <div className="management-form-group">

            <label>
              Password
            </label>

            <div className="management-input-wrapper">

              <Lock size={18} />

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter password"
                autoComplete="current-password"
              />

            </div>

          </div>


          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="management-login-button"
          >

            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="management-spin"
                />

                Signing in...
              </>
            ) : (
              <>
                <LogIn size={18} />

                Sign In
              </>
            )}

          </button>

        </form>


        <div className="management-login-footer">
          GoldBingo Management Portal
        </div>

      </div>

    </div>
  );
}