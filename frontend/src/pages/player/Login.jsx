import {
  useEffect,
  useState,
} from "react";

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

import GoldBingoLoader
  from "../../components/common/GoldBingoLoader";

import logo from "../../assets/logo.png";

import { loginUser }
  from "../../api/auth.api";

import { useAuth }
  from "../../context/useAuth";

import { requestFcmToken }
  from "../../notifications";


function Login() {

  const navigate =
    useNavigate();

  const { login } =
    useAuth();


  const [
    form,
    setForm,
  ] = useState({
    phone: "",
    password: "",
  });


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  /* ========================================
     INITIAL PAGE LOADER
  ======================================== */

  const [
    pageLoading,
    setPageLoading,
  ] = useState(true);


  /* ========================================
     LOGIN -> DASHBOARD TRANSITION
  ======================================== */

  const [
    transitionLoading,
    setTransitionLoading,
  ] = useState(false);


  useEffect(() => {

    const timer =
      setTimeout(() => {

        setPageLoading(false);

      }, 850);


    return () =>
      clearTimeout(timer);

  }, []);


  /* ========================================
     INPUT CHANGE
  ======================================== */

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;


    setForm(
      (prev) => ({
        ...prev,

        [name]:
          value,
      })
    );


    if (error) {
      setError("");
    }

  };


  /* ========================================
     PASSWORD VISIBILITY
  ======================================== */

  const togglePassword =
    () => {

      setShowPassword(
        (prev) =>
          !prev
      );

    };


  /* ========================================
     LOGIN
  ======================================== */

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError("");


      if (
        !form.phone.trim()
      ) {

        setError(
          "Phone number is required."
        );

        return;
      }


      if (
        !form.password
      ) {

        setError(
          "Password is required."
        );

        return;
      }


      try {

        setLoading(true);

        /*
         * Start full screen transition
         * after validation succeeds.
         */

        setTransitionLoading(
          true
        );


        const result =
          await loginUser(
            form.phone.trim(),
            form.password
          );


        if (
          !result.success
        ) {

          throw new Error(
            result.message ||
              "Login failed"
          );

        }


        const {
          accessToken,
          user,
        } = result.data;


        /* Save authenticated player */

        login(
          accessToken,
          user
        );


        /*
         * FCM failure must NOT
         * block login.
         */

        try {

          await requestFcmToken(
            accessToken
          );

        } catch (
          notificationError
        ) {

          console.error(
            "FCM registration failed:",
            notificationError
          );

        }


        /*
         * Tell Dashboard that
         * login transition is active.
         */

        sessionStorage.setItem(
          "goldBingoLoginTransition",
          "true"
        );


        /*
         * Small delay gives loader
         * time to animate smoothly.
         */

        await new Promise(
          (resolve) => {

            setTimeout(
              resolve,
              400
            );

          }
        );


        navigate(
          "/player/play",
          {
            replace: true,
          }
        );

      } catch (err) {

        console.error(
          "Player login error:",
          err
        );


        /*
         * Authentication failed.
         * Remove transition overlay.
         */

        setTransitionLoading(
          false
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


  /* ========================================
     FIRST PAGE LOAD
  ======================================== */

  if (pageLoading) {

    return (
      <GoldBingoLoader
        text="Preparing GoldBingo..."
      />
    );

  }


  /* ========================================
     LOGIN PAGE
  ======================================== */

  return (
    <>

      {/* LOGIN SUCCESS TRANSITION */}

      {transitionLoading && (
        <GoldBingoLoader
          text="Opening your dashboard..."
        />
      )}


      <div className="player-auth-page">

        <div className="player-auth-container">


          {/* BRAND */}

          <div className="player-auth-brand">

            <div className="player-logo">

              <img
                src={logo}
                alt="GoldBingo Logo"
              />

            </div>


            <p>
              Play. Win. Enjoy.
            </p>

          </div>


          {/* LOGIN CARD */}

          <div className="player-auth-card">

            <div className="auth-heading">

              <h2>
                Welcome Back
              </h2>

              <p>
                Sign in to continue playing
              </p>

            </div>


            {/* ERROR */}

            {error && (

              <div className="auth-error">
                {error}
              </div>

            )}


            <form
              onSubmit={
                handleSubmit
              }
            >


              {/* PHONE */}

              <div className="form-group">

                <label>
                  Phone Number
                </label>


                <div className="input-wrapper">

                  <Phone
                    size={18}
                  />


                  <input
                    type="tel"
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="09XXXXXXXX"
                    autoComplete="tel"
                    disabled={
                      loading
                    }
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div className="form-group">

                <label>
                  Password
                </label>


                <div className="input-wrapper">

                  <Lock
                    size={18}
                  />


                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={
                      form.password
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={
                      loading
                    }
                  />


                  <button
                    type="button"
                    className="password-toggle"
                    onClick={
                      togglePassword
                    }
                    disabled={
                      loading
                    }
                  >

                    {showPassword ? (

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


              {/* FORGOT PASSWORD */}

              <button
                type="button"
                className="player-forgot-password"
                onClick={() =>
                  navigate(
                    "/player/forgot-password"
                  )
                }
                disabled={
                  loading
                }
              >
                Forgot Password?
              </button>


              {/* LOGIN BUTTON */}

              <button
                type="submit"
                className="player-auth-button"
                disabled={
                  loading
                }
              >

                {loading
                  ? "Signing in..."
                  : "Sign In"}


                {!loading && (

                  <ArrowRight
                    size={18}
                  />

                )}

              </button>

            </form>


            {/* FOOTER */}

            <div className="auth-footer">

              <span>
                Don't have an account?
              </span>


              <Link
                to="/player/signup"
              >
                Create Account
              </Link>

            </div>

          </div>

        </div>

      </div>

    </>
  );
}


export default Login;