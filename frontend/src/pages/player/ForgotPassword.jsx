import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import { firebaseAuth } from "../../firebase";
import { resetPasswordWithFirebase } from "../../api/auth.api";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const confirmationResultRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  const setupRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    const verifier = new RecaptchaVerifier(
      firebaseAuth,
      "forgot-password-recaptcha",
      {
        size: "normal",
      }
    );

    recaptchaVerifierRef.current = verifier;

    return verifier;
  };

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);

  const sendOtp = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }

    try {
      setLoading(true);

      const verifier = setupRecaptcha();

      const confirmationResult =
        await signInWithPhoneNumber(
          firebaseAuth,
          phone.trim(),
          verifier
        );

      confirmationResultRef.current =
        confirmationResult;

      setStep("otp");

      setMessage(
        "A verification code has been sent to your phone."
      );
    } catch (err) {
      console.error(
        "Failed to send password reset OTP:",
        err
      );

      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }

        recaptchaVerifierRef.current = null;
      }

      setError(
        err?.message ||
          "Failed to send verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("Verification code is required");
      return;
    }

    if (!confirmationResultRef.current) {
      setError(
        "Verification session expired. Please request a new code."
      );
      setStep("phone");
      return;
    }

    try {
      setLoading(true);

      const result =
        await confirmationResultRef.current.confirm(
          otp.trim()
        );

      const idToken =
        await result.user.getIdToken();

      // Keep the Firebase identity temporarily in memory.
      confirmationResultRef.current = {
        ...confirmationResultRef.current,
        idToken,
      };

      setStep("password");

      setMessage(
        "Phone number verified. Create a new password."
      );
    } catch (err) {
      console.error(
        "OTP verification failed:",
        err
      );

      setError(
        err?.message ||
          "Invalid verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError(
        "Password must be at least 6 characters"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const idToken =
      confirmationResultRef.current?.idToken;

    if (!idToken) {
      setError(
        "Verification session expired. Please start again."
      );
      setStep("phone");
      return;
    }

    try {
      setLoading(true);

      await resetPasswordWithFirebase(
        idToken,
        newPassword
      );

      await firebaseAuth.signOut();

      setMessage(
        "Password reset successfully. You can now sign in."
      );

      setTimeout(() => {
        navigate("/player/login", {
          replace: true,
        });
      }, 1500);
    } catch (err) {
      console.error(
        "Password reset failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="player-auth-page">
      <div className="player-auth-card">
        <button
          type="button"
          className="player-auth-back"
          onClick={() =>
            navigate("/player/login")
          }
        >
          <ArrowLeft size={18} />
          Back to login
        </button>

        <div className="player-auth-icon">
          <KeyRound size={28} />
        </div>

        <h1>Forgot Password?</h1>

        <p>
          Reset your GoldBingo player password
          using your phone number.
        </p>

        {error && (
          <div className="player-auth-error">
            {error}
          </div>
        )}

        {message && (
          <div className="player-auth-success">
            {message}
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={sendOtp}>
            <label>Phone Number</label>

            <div className="player-auth-input">
              <Phone size={18} />

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="+2519XXXXXXXX"
              />
            </div>

            <div
              id="forgot-password-recaptcha"
              style={{
                marginTop: 16,
              }}
            />

            <button
              type="submit"
              disabled={loading}
              className="player-auth-button"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="player-spin"
                  />
                  Sending OTP...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Send OTP
                </>
              )}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp}>
            <label>Verification Code</label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value)
              }
              placeholder="Enter 6-digit OTP"
            />

            <button
              type="submit"
              disabled={loading}
              className="player-auth-button"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="player-spin"
                  />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Verify OTP
                </>
              )}
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword}>
            <label>New Password</label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              placeholder="Enter new password"
            />

            <label>Confirm New Password</label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Confirm new password"
            />

            <button
              type="submit"
              disabled={loading}
              className="player-auth-button"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="player-spin"
                  />
                  Resetting...
                </>
              ) : (
                <>
                  <KeyRound size={18} />
                  Reset Password
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}