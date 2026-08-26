import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Gamepad2,
  History,
  RefreshCw,
  Wallet,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import GoldBingoLoader
  from "../../components/common/GoldBingoLoader";

import {
  getMyWallet,
} from "../../api/wallet.api";

import {
  useLanguage,
} from "../../context/LanguageContext";


const Dashboard = () => {

  const { t } =
    useLanguage();


  /* =========================================
     WALLET STATE
  ========================================= */

  const [
    wallet,
    setWallet,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  /* =========================================
     LOGIN -> DASHBOARD TRANSITION
  ========================================= */

  const [
    dashboardTransition,
    setDashboardTransition,
  ] = useState(
    () =>
      sessionStorage.getItem(
        "goldBingoLoginTransition"
      ) === "true"
  );


  /* =========================================
     LOAD WALLET
  ========================================= */

  const loadWallet =
    async () => {

      try {

        setError("");
        setLoading(true);


        const result =
          await getMyWallet();


        if (!result.success) {

          throw new Error(
            result.message ||
              "Failed to load wallet"
          );

        }


        setWallet(
          result.data
        );

      } catch (err) {

        console.error(
          "Wallet loading error:",
          err
        );


        setError(
          err instanceof Error
            ? err.message
            : "Failed to load wallet"
        );

      } finally {

        setLoading(false);

      }

    };


  /* =========================================
     INITIAL LOAD
  ========================================= */

  useEffect(() => {

    loadWallet();

  }, []);


  /* =========================================
     FINISH LOGIN TRANSITION
  ========================================= */

  useEffect(() => {

    if (
      !dashboardTransition
    ) {
      return;
    }


    /*
     * Keep loader visible until
     * wallet finishes loading.
     */

    if (loading) {
      return;
    }


    const timer =
      setTimeout(() => {

        sessionStorage.removeItem(
          "goldBingoLoginTransition"
        );


        setDashboardTransition(
          false
        );

      }, 500);


    return () =>
      clearTimeout(timer);

  }, [
    dashboardTransition,
    loading,
  ]);


  /* =========================================
     FORMAT MONEY
  ========================================= */

  const formatAmount =
    (amount) => {

      return Number(
        amount || 0
      ).toLocaleString(
        "en-US",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      );

    };


  /* =========================================
     TOTAL RESERVED
  ========================================= */

  const totalReservedBalance =
    Number(
      wallet?.reservedBalance ||
        0
    ) +
    Number(
      wallet?.reservedWinningBalance ||
        0
    );


  /* =========================================
     LOGIN TRANSITION LOADER
  ========================================= */

  if (
    dashboardTransition
  ) {

    return (
      <GoldBingoLoader
        text={
          loading
            ? "Loading your dashboard..."
            : "Welcome to GoldBingo"
        }
      />
    );

  }


  /* =========================================
     DASHBOARD
  ========================================= */

  return (

    <div
      className="
        dashboard
        player-dashboard-enter
      "
    >


      {/* =========================
          DASHBOARD HEADER
      ========================== */}

      <div className="dashboard-heading">

        <div>

          <h2>
            {t(
              "dashboard.title"
            )}
          </h2>

        </div>


        <button
          className="refresh-button"
          onClick={
            loadWallet
          }
          disabled={
            loading
          }
        >

          <RefreshCw
            size={17}
            className={
              loading
                ? "spin"
                : ""
            }
          />

          {t(
            "common.refresh"
          )}

        </button>

      </div>


      {/* =========================
          ERROR
      ========================== */}

      {error && (

        <div className="dashboard-error">
          {error}
        </div>

      )}


      {/* =========================
          PLAY BANNER
      ========================== */}

      <section className="play-banner">

        <div className="play-banner-content">

          <span className="play-badge">
            BINGO
          </span>


          <h2>
            {t(
              "dashboard.readyToPlay"
            )}
          </h2>


          <Link
            to="/player/play"
            className="play-button"
          >

            <Gamepad2
              size={19}
            />

            {t(
              "dashboard.playNow"
            )}

          </Link>

        </div>


        <div className="play-banner-icon">

          <Gamepad2
            size={100}
          />

        </div>

      </section>


      {/* =========================
          WALLET SUMMARY
      ========================== */}

      <div className="wallet-summary">


        {/* AVAILABLE BALANCE */}

        <div className="wallet-main-card">

          <div className="wallet-card-top">

            <div>

              <span>
                {t(
                  "dashboard.availableBalance"
                )}
              </span>


              <h3>

                {loading
                  ? "..."
                  : `${formatAmount(
                      wallet?.availableBalance
                    )} ${
                      wallet?.currency ||
                      "ETB"
                    }`}

              </h3>

            </div>


            <div className="wallet-icon">

              <Wallet
                size={24}
              />

            </div>

          </div>


          <div className="wallet-card-bottom">

            <span>
              {t(
                "dashboard.totalBalance"
              )}
            </span>


            <strong>

              {loading
                ? "..."
                : `${formatAmount(
                    wallet?.balance
                  )} ${
                    wallet?.currency ||
                    "ETB"
                  }`}

            </strong>

          </div>

        </div>


        {/* RESERVED BALANCE */}

        <div className="wallet-small-card">

          <span>
            {t(
              "dashboard.reservedBalance"
            )}
          </span>


          <strong>

            {loading
              ? "..."
              : `${formatAmount(
                  totalReservedBalance
                )} ${
                  wallet?.currency ||
                  "ETB"
                }`}

          </strong>


          <small>
            {t(
              "dashboard.amountReserved"
            )}
          </small>

        </div>


        {/* ACCOUNT STATUS */}

        <div className="wallet-small-card">

          <span>
            {t(
              "dashboard.accountStatus"
            )}
          </span>


          <strong className="active-status">

            {wallet?.status ===
            "active"
              ? t(
                  "dashboard.active"
                )
              : wallet?.status ||
                t(
                  "common.unknown"
                )}

          </strong>


          <small>
            {t(
              "dashboard.playerWallet"
            )}
          </small>

        </div>

      </div>


      {/* =========================
          QUICK ACTIONS
      ========================== */}

      <section className="quick-actions">

        <div className="section-heading">

          <div>

            <h3>
              {t(
                "dashboard.quickActions"
              )}
            </h3>


            <p>
              {t(
                "dashboard.manageWallet"
              )}
            </p>

          </div>

        </div>


        <div className="action-grid">


          {/* DEPOSIT */}

          <Link
            to="/player/deposit"
            className="action-card"
          >

            <div className="action-icon deposit">

              <ArrowDownToLine
                size={22}
              />

            </div>


            <div>

              <strong>
                {t(
                  "dashboard.deposit"
                )}
              </strong>


              <span>
                {t(
                  "dashboard.addFunds"
                )}
              </span>

            </div>

          </Link>


          {/* WITHDRAW */}

          <Link
            to="/player/withdraw"
            className="action-card"
          >

            <div className="action-icon withdraw">

              <ArrowUpFromLine
                size={22}
              />

            </div>


            <div>

              <strong>
                {t(
                  "dashboard.withdraw"
                )}
              </strong>


              <span>
                {t(
                  "dashboard.withdrawWinnings"
                )}
              </span>

            </div>

          </Link>


          {/* TRANSACTIONS */}

          <Link
            to="/player/transactions"
            className="action-card"
          >

            <div className="action-icon history">

              <History
                size={22}
              />

            </div>


            <div>

              <strong>
                {t(
                  "dashboard.transactions"
                )}
              </strong>


              <span>
                {t(
                  "dashboard.walletHistory"
                )}
              </span>

            </div>

          </Link>

        </div>

      </section>

    </div>

  );

};


export default Dashboard;