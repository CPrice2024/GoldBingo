import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  WalletCards,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  User,
  Phone,
  CreditCard,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  getPendingDeposits,
  approveDeposit,
} from "../../../api/deposits.api";

import "./ManagementLayout.css";


export default function AgentDeposits() {

  /* =========================================
     DATA
  ========================================= */

  const [
    deposits,
    setDeposits,
  ] = useState([]);

  const [
    selectedDeposit,
    setSelectedDeposit,
  ] = useState(null);


  /* =========================================
     LOADING
  ========================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    approvingId,
    setApprovingId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");


  /* =========================================
     FILTERS
  ========================================= */

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("all");


  /* =========================================
     PAGINATION
  ========================================= */

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    limit,
    setLimit,
  ] = useState(10);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });


  /* =========================================
     GLOBAL PENDING STATS
  ========================================= */

  const [
    stats,
    setStats,
  ] = useState({
    pendingCount: 0,
    pendingAmount: 0,
  });


  /* =========================================
     SEARCH DEBOUNCE
  ========================================= */

  useEffect(() => {

    const timer =
      setTimeout(() => {

        setDebouncedSearch(
          search.trim()
        );

        setPage(1);

      }, 400);


    return () => {
      clearTimeout(timer);
    };

  }, [search]);


  /* =========================================
     LOAD DEPOSITS
  ========================================= */

  const loadDeposits =
    useCallback(
      async (
        isRefresh = false
      ) => {

        try {

          setError("");

          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }


          const response =
            await getPendingDeposits({
              page,
              limit,
              search:
                debouncedSearch,
              paymentMethod,
            });


          const nextPagination =
            response?.pagination || {
              page,
              limit,
              total: 0,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            };


          /*
           * Example:
           *
           * Agent is on page 3.
           * Last record on page 3 gets approved.
           * Total pages becomes 2.
           *
           * Move automatically back
           * to the last valid page.
           */
          if (
            page >
            nextPagination.totalPages
          ) {

            setPage(
              Math.max(
                1,
                nextPagination.totalPages
              )
            );

            return;
          }


          setDeposits(
            response?.data ||
              []
          );


          setPagination(
            nextPagination
          );


          setStats({
            pendingCount:
              Number(
                response?.stats
                  ?.pendingCount ??
                  0
              ),

            pendingAmount:
              Number(
                response?.stats
                  ?.pendingAmount ??
                  0
              ),
          });

        } catch (err) {

          console.error(
            "Failed to load pending deposits:",
            err
          );


          setError(
            err?.response?.data
              ?.message ||
              err?.message ||
              "Failed to load deposits"
          );

        } finally {

          setLoading(false);

          setRefreshing(
            false
          );

        }

      },
      [
        page,
        limit,
        debouncedSearch,
        paymentMethod,
      ]
    );


  /* =========================================
     AUTO LOAD
  ========================================= */

  useEffect(() => {

    loadDeposits();

  }, [loadDeposits]);


  /* =========================================
     PAYMENT METHOD FILTER
  ========================================= */

  const handlePaymentMethodChange =
    (event) => {

      setPaymentMethod(
        event.target.value
      );

      setPage(1);

    };


  /* =========================================
     PAGE LIMIT
  ========================================= */

  const handleLimitChange =
    (event) => {

      setLimit(
        Number(
          event.target.value
        )
      );

      setPage(1);

    };


  /* =========================================
     PAGE NUMBERS
  ========================================= */

  const getPageNumbers = () => {

    const totalPages =
      Number(
        pagination.totalPages ||
          1
      );

    const currentPage =
      Number(
        pagination.page ||
          page
      );


    const start =
      Math.max(
        1,
        currentPage - 2
      );

    const end =
      Math.min(
        totalPages,
        currentPage + 2
      );


    return Array.from(
      {
        length:
          end - start + 1,
      },
      (
        _,
        index
      ) =>
        start + index
    );

  };


  /* =========================================
     FORMAT AMOUNT
  ========================================= */

  const formatAmount = (
    amount
  ) => {

    return `${Number(
      amount || 0
    ).toLocaleString(
      "en-US"
    )} ETB`;

  };


  /* =========================================
     FORMAT DATE
  ========================================= */

  const formatDate = (
    date
  ) => {

    if (!date) {
      return "—";
    }


    return new Date(
      date
    ).toLocaleString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };


  /* =========================================
     PAYMENT METHOD NAME
  ========================================= */

  const getPaymentMethodName =
    (method) => {

      const names = {
        telebirr:
          "Telebirr",

        cbe:
          "CBE",

        mpesa:
          "M-Pesa",

        bank:
          "Bank",
      };


      return (
        names[method] ||
        method ||
        "—"
      );

    };


  /* =========================================
     APPROVE DEPOSIT
  ========================================= */

  const handleApprove =
    async (
      deposit
    ) => {

      const confirmed =
        window.confirm(
          `Approve deposit of ${formatAmount(
            deposit.amount
          )}?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setApprovingId(
          deposit._id
        );

        setError("");


        await approveDeposit(
          deposit._id
        );


        setSelectedDeposit(
          null
        );


        /*
         * If this was the last row
         * of a page after page 1,
         * go to previous page.
         */
        if (
          deposits.length === 1 &&
          page > 1
        ) {

          setPage(
            (
              current
            ) =>
              Math.max(
                1,
                current - 1
              )
          );

        } else {

          /*
           * Reload server data so:
           *
           * - pendingCount updates
           * - pendingAmount updates
           * - pagination updates
           * - list updates
           */
          await loadDeposits(
            true
          );

        }

      } catch (err) {

        console.error(
          "Failed to approve deposit:",
          err
        );


        setError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Failed to approve deposit"
        );

      } finally {

        setApprovingId(
          null
        );

      }

    };


  /* =========================================
     INITIAL LOADING
  ========================================= */

  if (
    loading &&
    deposits.length === 0
  ) {

    return (

      <div className="management-page">

        <div className="management-loading">

          <RefreshCw
            size={28}
            className="management-spin"
          />

          <p>
            Loading pending deposits...
          </p>

        </div>

      </div>

    );

  }


  return (

    <div className="management-page">


      {/* =====================================
          HEADER
      ===================================== */}

      <div className="management-page-header">

        <div className="management-page-title">

          <WalletCards
            size={28}
          />

          <div>

            <h1>
              Deposits
            </h1>

            <p>
              Review and approve player
              deposit requests.
            </p>

          </div>

        </div>


        <button
          type="button"
          className="management-refresh-button"
          onClick={() =>
            loadDeposits(
              true
            )
          }
          disabled={
            refreshing
          }
        >

          <RefreshCw
            size={17}
            className={
              refreshing
                ? "management-spin"
                : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}

        </button>

      </div>


      {/* =====================================
          ERROR
      ===================================== */}

      {error && (

        <div className="management-error">

          <X size={18} />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* =====================================
          STATISTICS
      ===================================== */}

      <div className="management-stats-grid">


        {/* PENDING COUNT */}

        <div className="management-stat-card">

          <div className="management-stat-icon">

            <Clock size={22} />

          </div>

          <div>

            <span>
              Pending Requests
            </span>

            <strong>
              {stats.pendingCount}
            </strong>

          </div>

        </div>


        {/* PENDING AMOUNT */}

        <div className="management-stat-card">

          <div className="management-stat-icon">

            <WalletCards
              size={22}
            />

          </div>

          <div>

            <span>
              Pending Amount
            </span>

            <strong>
              {formatAmount(
                stats.pendingAmount
              )}
            </strong>

          </div>

        </div>


        {/* ACTION */}

        <div className="management-stat-card">

          <div className="management-stat-icon">

            <CheckCircle
              size={22}
            />

          </div>

          <div>

            <span>
              Action
            </span>

            <strong>
              Review & Approve
            </strong>

          </div>

        </div>

      </div>


      {/* =====================================
          MAIN CARD
      ===================================== */}

      <div className="management-content-card">


        {/* ===================================
            FILTER HEADER
        =================================== */}

        <div className="management-content-header">

          <div>

            <h2>
              Pending Deposits
            </h2>

            <p>

              {pagination.total} matching
              deposit
              {pagination.total !== 1
                ? "s"
                : ""}

            </p>

          </div>


          <div className="management-player-filters">


            {/* SEARCH */}

            <div className="management-search">

              <Search
                size={18}
              />

              <input
                type="text"
                placeholder="Search player, phone, reference..."
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
              />

            </div>


            {/* PAYMENT METHOD */}

            <select
              className="management-filter-select"
              value={
                paymentMethod
              }
              onChange={
                handlePaymentMethodChange
              }
            >

              <option value="all">
                All Methods
              </option>

              <option value="telebirr">
                Telebirr
              </option>

              <option value="cbe">
                CBE
              </option>

            </select>


            {/* PAGE SIZE */}

            <select
              className="management-filter-select"
              value={limit}
              onChange={
                handleLimitChange
              }
            >

              <option value={5}>
                5 per page
              </option>

              <option value={10}>
                10 per page
              </option>

              <option value={20}>
                20 per page
              </option>

              <option value={50}>
                50 per page
              </option>

            </select>

          </div>

        </div>


        {/* ===================================
            EMPTY
        =================================== */}

        {deposits.length === 0 ? (

          <div className="management-empty">

            <WalletCards
              size={44}
            />


            {pagination.total === 0 &&
            !debouncedSearch &&
            paymentMethod ===
              "all" ? (

              <>

                <h3>
                  No pending deposits
                </h3>

                <p>
                  New player deposit requests
                  will appear here.
                </p>

              </>

            ) : (

              <>

                <h3>
                  No matching deposits
                </h3>

                <p>
                  Try changing the search or
                  payment method filter.
                </p>

              </>

            )}

          </div>

        ) : (

          <>


            {/* =================================
                TABLE
            ================================= */}

            <div className="management-table-wrapper">

              <table className="management-table">

                <thead>

                  <tr>

                    <th>
                      Player
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Payment Method
                    </th>

                    <th>
                      Reference
                    </th>

                    <th>
                      Requested
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {deposits.map(
                    (
                      deposit
                    ) => {

                      const player =
                        deposit.playerId;


                      return (

                        <tr
                          key={
                            deposit._id
                          }
                        >


                          {/* PLAYER */}

                          <td>

                            <div className="agent-player-cell">

                              <div className="management-player-avatar">

                                {player
                                  ?.fullName
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase() ||
                                  "P"}

                              </div>


                              <div>

                                <strong>

                                  {player
                                    ?.fullName ||
                                    "Unknown Player"}

                                </strong>

                                <small>

                                  {player
                                    ?.phone ||
                                    "—"}

                                </small>

                              </div>

                            </div>

                          </td>


                          {/* AMOUNT */}

                          <td>

                            <strong>

                              {formatAmount(
                                deposit.amount
                              )}

                            </strong>

                          </td>


                          {/* PAYMENT METHOD */}

                          <td>

                            <div className="management-table-detail">

                              <CreditCard
                                size={15}
                              />

                              {getPaymentMethodName(
                                deposit.paymentMethod
                              )}

                            </div>

                          </td>


                          {/* REFERENCE */}

                          <td>

                            {deposit.reference ||
                              "—"}

                          </td>


                          {/* DATE */}

                          <td>

                            <div className="management-table-detail">

                              <Calendar
                                size={15}
                              />

                              {formatDate(
                                deposit.createdAt
                              )}

                            </div>

                          </td>


                          {/* ACTION */}

                          <td>

                            <button
                              type="button"
                              className="management-approve-button"
                              onClick={() =>
                                setSelectedDeposit(
                                  deposit
                                )
                              }
                              disabled={
                                approvingId ===
                                deposit._id
                              }
                            >

                              <CheckCircle
                                size={16}
                              />

                              Review

                            </button>

                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            </div>


            {/* =================================
                PAGINATION
            ================================= */}

            <div className="management-pagination">


              {/* INFO */}

              <div className="management-pagination-info">

                Showing{" "}

                <strong>

                  {(pagination.page -
                    1) *
                    pagination.limit +
                    1}

                </strong>

                {" - "}

                <strong>

                  {Math.min(
                    pagination.page *
                      pagination.limit,
                    pagination.total
                  )}

                </strong>

                {" of "}

                <strong>

                  {pagination.total}

                </strong>

              </div>


              {/* CONTROLS */}

              <div className="management-pagination-actions">


                {/* PREVIOUS */}

                <button
                  type="button"
                  className="management-pagination-button"
                  disabled={
                    !pagination.hasPrevPage ||
                    loading
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                >

                  <ChevronLeft
                    size={17}
                  />

                  Previous

                </button>


                {/* PAGE NUMBERS */}

                <div className="management-page-numbers">

                  {getPageNumbers().map(
                    (
                      pageNumber
                    ) => (

                      <button
                        key={
                          pageNumber
                        }
                        type="button"
                        className={
                          pageNumber ===
                          pagination.page
                            ? "management-page-number active"
                            : "management-page-number"
                        }
                        onClick={() =>
                          setPage(
                            pageNumber
                          )
                        }
                      >

                        {pageNumber}

                      </button>

                    )
                  )}

                </div>


                {/* NEXT */}

                <button
                  type="button"
                  className="management-pagination-button"
                  disabled={
                    !pagination.hasNextPage ||
                    loading
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        current + 1
                    )
                  }
                >

                  Next

                  <ChevronRight
                    size={17}
                  />

                </button>

              </div>

            </div>

          </>

        )}

      </div>


      {/* =====================================
          REVIEW MODAL
      ===================================== */}

      {selectedDeposit && (

        <div
          className="management-modal-overlay"
          onClick={() =>
            setSelectedDeposit(
              null
            )
          }
        >

          <div
            className="management-modal"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >


            {/* HEADER */}

            <div className="management-modal-header">

              <div>

                <h2>
                  Review Deposit
                </h2>

                <p>
                  Verify the deposit
                  information before
                  approving.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedDeposit(
                    null
                  )
                }
              >

                <X size={20} />

              </button>

            </div>


            {/* BODY */}

            <div className="management-modal-body">


              {/* PLAYER */}

              <div className="management-deposit-detail">

                <User size={18} />

                <div>

                  <span>
                    Player
                  </span>

                  <strong>

                    {selectedDeposit
                      .playerId
                      ?.fullName ||
                      "Unknown Player"}

                  </strong>

                </div>

              </div>


              {/* PHONE */}

              <div className="management-deposit-detail">

                <Phone size={18} />

                <div>

                  <span>
                    Phone
                  </span>

                  <strong>

                    {selectedDeposit
                      .playerId
                      ?.phone ||
                      "—"}

                  </strong>

                </div>

              </div>


              {/* AMOUNT */}

              <div className="management-deposit-detail">

                <WalletCards
                  size={18}
                />

                <div>

                  <span>
                    Amount
                  </span>

                  <strong>

                    {formatAmount(
                      selectedDeposit.amount
                    )}

                  </strong>

                </div>

              </div>


              {/* PAYMENT METHOD */}

              <div className="management-deposit-detail">

                <CreditCard
                  size={18}
                />

                <div>

                  <span>
                    Payment Method
                  </span>

                  <strong>

                    {getPaymentMethodName(
                      selectedDeposit
                        .paymentMethod
                    )}

                  </strong>

                </div>

              </div>


              {/* DATE */}

              <div className="management-deposit-detail">

                <Calendar
                  size={18}
                />

                <div>

                  <span>
                    Request Date
                  </span>

                  <strong>

                    {formatDate(
                      selectedDeposit
                        .createdAt
                    )}

                  </strong>

                </div>

              </div>


              {/* REFERENCE */}

              {selectedDeposit.reference && (

                <div className="management-deposit-detail">

                  <CreditCard
                    size={18}
                  />

                  <div>

                    <span>
                      Reference
                    </span>

                    <strong>

                      {
                        selectedDeposit.reference
                      }

                    </strong>

                  </div>

                </div>

              )}


              {/* NOTE */}

              {selectedDeposit.note && (

                <div className="management-deposit-note">

                  <span>
                    Note
                  </span>

                  <p>
                    {selectedDeposit.note}
                  </p>

                </div>

              )}

            </div>


            {/* FOOTER */}

            <div className="management-modal-footer">

              <button
                type="button"
                className="management-cancel-button"
                onClick={() =>
                  setSelectedDeposit(
                    null
                  )
                }
                disabled={
                  approvingId ===
                  selectedDeposit._id
                }
              >

                Cancel

              </button>


              <button
                type="button"
                className="management-approve-button"
                onClick={() =>
                  handleApprove(
                    selectedDeposit
                  )
                }
                disabled={
                  approvingId ===
                  selectedDeposit._id
                }
              >

                {approvingId ===
                selectedDeposit._id ? (

                  <>

                    <RefreshCw
                      size={16}
                      className="management-spin"
                    />

                    Approving...

                  </>

                ) : (

                  <>

                    <CheckCircle
                      size={16}
                    />

                    Approve Deposit

                  </>

                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}