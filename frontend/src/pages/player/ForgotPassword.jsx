import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  listenForMessages,
} from "../../notifications";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Phone,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import {
  PushNotifications,
} from "@capacitor/push-notifications";

import {
  Capacitor,
} from "@capacitor/core";
import {
  useNavigate,
} from "react-router-dom";

import {
  requestPasswordOTP,
  verifyPasswordOTP,
  resetPasswordWithOTP,
} from "../../api/auth.api";
import {
  getDeviceIdentity,
} from "../../utils/deviceIdentity";

export default function ForgotPassword() {

  const navigate =
    useNavigate();


  /* ===============================
     STEP
  =============================== */

  const [
    step,
    setStep,
  ] = useState("phone");


  /* ===============================
     FORM STATE
  =============================== */

  const [
    phone,
    setPhone,
  ] = useState("");


  const [
    otp,
    setOtp,
  ] = useState("");


  const [
    resetToken,
    setResetToken,
  ] = useState("");


  const [
    newPassword,
    setNewPassword,
  ] = useState("");


  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");


  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);


  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    message,
    setMessage,
  ] = useState("");

  const lastAutoVerifiedOtp =
  useRef("");

  const ensureNotificationPermission =
  async () => {

    try {

      /* ==============================
         NATIVE ANDROID / IOS
      ============================== */

      if (
        Capacitor.isNativePlatform()
      ) {

        let permission =
          await PushNotifications
            .checkPermissions();


        if (
          permission.receive ===
          "granted"
        ) {

          await PushNotifications
            .register();

          return true;
        }


        permission =
          await PushNotifications
            .requestPermissions();


        if (
          permission.receive ===
          "granted"
        ) {

          await PushNotifications
            .register();

          return true;
        }


        return false;
      }


      /* ==============================
         WEBSITE / CHROME
      ============================== */

      if (
        !("Notification" in window)
      ) {

        console.error(
          "This browser does not support notifications."
        );

        return false;
      }


      /*
       * Permission already granted.
       */
      if (
        Notification.permission ===
        "granted"
      ) {

        return true;
      }


      /*
       * User has never answered.
       * Chrome can show the popup.
       */
      if (
        Notification.permission ===
        "default"
      ) {

        const permission =
          await Notification
            .requestPermission();


        return (
          permission ===
          "granted"
        );
      }


      /*
       * User previously pressed Block.
       */
      if (
        Notification.permission ===
        "denied"
      ) {

        return false;
      }


      return false;

    } catch (error) {

      console.error(
        "Notification permission check failed:",
        error
      );

      return false;

    }

  };

  /* ===============================
     REQUEST + SEND OTP
  =============================== */

  const sendOtp =
    async (e) => {

      e.preventDefault();
      setStep(
  "phone"
);

lastAutoVerifiedOtp.current =
  "";

      setError("");
      setMessage("");


      const cleanPhone =
        phone.trim();


      if (!cleanPhone) {

        setError(
          "Phone number is required."
        );

        return;
      }


      try {

        setLoading(true);


        /*
         * Backend now:
         *
         * 1. Finds registered player
         * 2. Generates OTP
         * 3. Saves OTP hash
         * 4. Sends SMS automatically
         */

       const notificationGranted =
  await ensureNotificationPermission();


if (!notificationGranted) {

  setError(
    "Notification permission is required to receive your OTP. Please allow notifications and try again."
  );

  return;
}


/*
 * Clear any OTP from an older request.
 */
setOtp("");

lastAutoVerifiedOtp.current =
  "";


/*
 * Read this browser/app installation's
 * persistent trusted identity.
 */
const deviceIdentity =
  await getDeviceIdentity();


console.log(
  "[FORGOT PASSWORD] Trusted device:",
  {
    deviceId:
      deviceIdentity.deviceId,

    hasCredential:
      Boolean(
        deviceIdentity
          .deviceCredential
      ),

    platform:
      deviceIdentity.platform,
  }
);


/*
 * Move to the OTP screen before
 * requesting the OTP.
 *
 * Push can arrive before the HTTP
 * request finishes.
 */
setStep(
  "otp"
);


const result =
  await requestPasswordOTP(
    cleanPhone,
    deviceIdentity
  );


/*
 * If FCM already arrived and started
 * automatic verification, do not
 * overwrite its status message.
 */
if (
  !lastAutoVerifiedOtp.current
) {

  setMessage(
    result?.message ||
      "OTP sent successfully. Check your phone."
  );

}


      } catch (err) {

        console.error(
          "Failed to send OTP:",
          err
        );


        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Failed to send OTP"
        );

      } finally {

        setLoading(false);

      }

    };


/* ===============================
   VERIFY OTP
=============================== */

const verifyOtpCode =
  useCallback(
    async (code) => {

      const cleanOtp =
        String(
          code || ""
        ).trim();


      setError("");
      setMessage("");


      if (
        !/^\d{6}$/.test(
          cleanOtp
        )
      ) {

        setError(
          "Enter a valid 6-digit OTP."
        );

        return false;
      }


      try {

        setLoading(true);


        const result =
          await verifyPasswordOTP(
            phone.trim(),
            cleanOtp
          );


        const token =
          result?.data?.resetToken;


        if (!token) {

          throw new Error(
            "Password reset token was not returned"
          );

        }


        setResetToken(
          token
        );


        setStep(
          "password"
        );


        setMessage(
          "Phone verified successfully. Create your new password."
        );


        return true;

      } catch (err) {

        console.error(
          "OTP verification failed:",
          err
        );


        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Invalid or expired OTP"
        );


        return false;

      } finally {

        setLoading(false);

      }

    },
    [
      phone,
    ]
  );


/* ===============================
   MANUAL VERIFY BUTTON
=============================== */

const verifyOtp =
  async (e) => {

    e.preventDefault();


    await verifyOtpCode(
      otp
    );

  };


  /* ===============================
     RESET PASSWORD
  =============================== */

  const handleResetPassword =
    async (e) => {

      e.preventDefault();

      setError("");
      setMessage("");


      if (
        !newPassword ||
        !confirmPassword
      ) {

        setError(
          "Please fill in all password fields."
        );

        return;
      }


      if (
        newPassword.length <
        6
      ) {

        setError(
          "New password must be at least 6 characters."
        );

        return;
      }


      if (
        newPassword !==
        confirmPassword
      ) {

        setError(
          "New password and confirmation do not match."
        );

        return;
      }


      if (!resetToken) {

        setError(
          "Password reset session expired. Please start again."
        );

        handleStartAgain();

        return;
      }


      try {

        setLoading(true);


        const result =
          await resetPasswordWithOTP(
            resetToken,
            newPassword
          );


        setMessage(
          result?.message ||
          "Password reset successfully."
        );


        /*
         * Clear sensitive data.
         */

        setResetToken("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");


        setTimeout(
          () => {

            navigate(
              "/player/login",
              {
                replace: true,
              }
            );

          },
          1500
        );


      } catch (err) {

        console.error(
          "Password reset failed:",
          err
        );


        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Failed to reset password"
        );

      } finally {

        setLoading(false);

      }

    };

useEffect(() => {

  let webUnsubscribe =
    null;

  let nativeReceivedHandle =
    null;

  let nativeActionHandle =
    null;


  const processOtpNotification =
    async (payload) => {

      console.log(
        "[FORGOT PASSWORD] OTP notification:",
        payload
      );


      const data =
        payload?.data ||
        {};


      /*
       * Only process password-reset OTP
       * notifications.
       */
      if (
        data.type !==
          "password_reset_otp" ||
        data.purpose !==
          "forgot_password"
      ) {
        return;
      }


      const receivedOtp =
        String(
          data.otp || ""
        ).trim();


      if (
        !/^\d{6}$/.test(
          receivedOtp
        )
      ) {

        console.warn(
          "[FORGOT PASSWORD] Invalid OTP received in push"
        );

        return;
      }


      /*
       * Prevent the same notification
       * from automatically verifying
       * more than once.
       */
      if (
        lastAutoVerifiedOtp
          .current ===
        receivedOtp
      ) {
        return;
      }


      lastAutoVerifiedOtp.current =
        receivedOtp;


      /*
       * Show the OTP inside the field.
       */
      setOtp(
        receivedOtp
      );


      /*
       * Move to OTP screen if the push
       * arrives very quickly.
       */
      setStep(
        "otp"
      );


      setMessage(
        "OTP received. Verifying automatically..."
      );


      /*
       * Same action as pressing the
       * Verify OTP button.
       */
      const verified =
        await verifyOtpCode(
          receivedOtp
        );


      /*
       * If verification failed, allow
       * another attempt.
       */
      if (!verified) {

        lastAutoVerifiedOtp.current =
          "";

      }

    };


  const setupListeners =
    async () => {

      /* ==============================
         ANDROID APP
      ============================== */

      if (
        Capacitor.isNativePlatform()
      ) {

        nativeReceivedHandle =
          await PushNotifications
            .addListener(
              "pushNotificationReceived",
              async (
                notification
              ) => {

                await processOtpNotification(
                  notification
                );

              }
            );


        nativeActionHandle =
          await PushNotifications
            .addListener(
              "pushNotificationActionPerformed",
              async (
                action
              ) => {

                await processOtpNotification(
                  action.notification
                );

              }
            );


        return;
      }


      /* ==============================
         WEB / CHROME
      ============================== */

      webUnsubscribe =
        listenForMessages(
          async (payload) => {

            await processOtpNotification(
              payload
            );

          }
        );

    };


  setupListeners();


  return () => {

    if (
      typeof webUnsubscribe ===
      "function"
    ) {
      webUnsubscribe();
    }


    if (
      nativeReceivedHandle
    ) {
      nativeReceivedHandle
        .remove();
    }


    if (
      nativeActionHandle
    ) {
      nativeActionHandle
        .remove();
    }

  };

}, [
  verifyOtpCode,
]);

  /* ===============================
     START AGAIN
  =============================== */

  const handleStartAgain =
    () => {

      setStep(
        "phone"
      );

      setOtp("");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");

      setError("");
      setMessage("");

    };


  return (

    <div className="change-password-page">


      {/* ============================
          HEADER
      ============================ */}

      <div className="change-password-header">

        <button
          type="button"
          className="back-profile-btn"
          onClick={() =>
            navigate(
              "/player/login"
            )
          }
        >

          <ArrowLeft
            size={17}
          />

          Back to Login

        </button>


        <h1>
          Forgot Password
        </h1>


        

      </div>


      {/* ============================
          CARD
      ============================ */}

      <div className="change-password-card">


        {/* ICON */}

        <div className="change-password-icon">

          {step === "phone" && (
            <Phone
              size={24}
            />
          )}

          {step === "otp" && (
            <ShieldCheck
              size={24}
            />
          )}

          {step === "password" && (
            <Lock
              size={24}
            />
          )}

        </div>


        {/* TITLE */}

        <div className="change-password-title">

          <h2>

            {step === "phone" &&
              "Recover Your Account"}

            {step === "otp" &&
              "Verify OTP"}

            {step === "password" &&
              "Create New Password"}

          </h2>


          <p>

            {step === "phone" &&
              "Enter your registered phone number to receive a password reset OTP."}

            {step === "otp" &&
              "Enter the 6-digit verification code sent to your phone."}

            {step === "password" &&
              "Choose a secure new password for your account."}

          </p>

        </div>


        {/* ============================
            ERROR
        ============================ */}

        {error && (

          <div className="password-alert password-error">

            <span>
              {error}
            </span>

          </div>

        )}


        {/* ============================
            SUCCESS
        ============================ */}

        {message && (

          <div className="password-alert password-success">

            <span>
              {message}
            </span>

          </div>

        )}


        {/* ============================
            STEP 1 - PHONE
        ============================ */}

        {step === "phone" && (

          <form
            onSubmit={sendOtp}
            className="change-password-form"
          >

            <div className="password-field">

              <label>
                Phone Number
              </label>


              <div className="change-password-input">

               


                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  placeholder="09XXXXXXXX"
                  autoComplete="tel"
                />

              </div>

            </div>


            <button
              type="submit"
              className="change-password-submit"
              disabled={loading}
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

                  <ShieldCheck
                    size={18}
                  />

                  Send OTP

                </>
              )}

            </button>

          </form>

        )}


        {/* ============================
            STEP 2 - OTP
        ============================ */}

        {step === "otp" && (

          <form
            onSubmit={verifyOtp}
            className="change-password-form"
          >

            <div className="password-field">

              <label>
                Verification Code
              </label>


              <div className="change-password-input">

                <ShieldCheck
                  size={18}
                />


                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {

                    const value =
                      e.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          6
                        );


                    setOtp(
                      value
                    );

                  }}
                  placeholder="Enter 6-digit OTP"
                  autoComplete="one-time-code"
                />

              </div>


              <span className="password-hint">
                The OTP expires in 5 minutes.
              </span>

            </div>


            <button
              type="submit"
              className="change-password-submit"
              disabled={
                loading ||
                otp.length !== 6
              }
            >

              {loading ? (
                <>

                  <Loader2
                    size={18}
                    className="player-spin"
                  />

                  Verifying OTP...

                </>
              ) : (
                <>

                  <ShieldCheck
                    size={18}
                  />

                  Verify OTP

                </>
              )}

            </button>


            <button
              type="button"
              className="forgot-secondary-btn"
              onClick={
                handleStartAgain
              }
              disabled={loading}
            >

              <ArrowLeft
                size={17}
              />

              Change Phone Number

            </button>

          </form>

        )}


        {/* ============================
            STEP 3 - PASSWORD
        ============================ */}

        {step === "password" && (

          <form
            onSubmit={
              handleResetPassword
            }
            className="change-password-form"
          >


            {/* NEW PASSWORD */}

            <div className="password-field">

              <label>
                New Password
              </label>


              <div className="change-password-input">

                <KeyRound
                  size={18}
                />


                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    newPassword
                  }
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />


                <button
                  type="button"
                  className="password-visibility-btn"
                  onClick={() =>
                    setShowNewPassword(
                      (prev) =>
                        !prev
                    )
                  }
                >

                  {showNewPassword ? (
                    <EyeOff
                      size={18}
                    />
                  ) : (
                    <Eye
                      size={18}
                    />
                  )}

                </button>

              </div>


              <span className="password-hint">
                Minimum 6 characters.
              </span>

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="password-field">

              <label>
                Confirm New Password
              </label>


              <div className="change-password-input">

                <KeyRound
                  size={18}
                />


                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    confirmPassword
                  }
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />


                <button
                  type="button"
                  className="password-visibility-btn"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) =>
                        !prev
                    )
                  }
                >

                  {showConfirmPassword ? (
                    <EyeOff
                      size={18}
                    />
                  ) : (
                    <Eye
                      size={18}
                    />
                  )}

                </button>

              </div>

            </div>


            <button
              type="submit"
              className="change-password-submit"
              disabled={loading}
            >

              {loading ? (
                <>

                  <Loader2
                    size={18}
                    className="player-spin"
                  />

                  Resetting Password...

                </>
              ) : (
                <>

                  <Lock
                    size={18}
                  />

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