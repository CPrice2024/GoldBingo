import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import "./ManagementLayout.css";

import {
  getAgentPlayers,
  getAgentStats,
} from "../../../api/agent.api";


export default function AgentPlayers() {

  /* =========================================
     DATA
  ========================================= */

  const [
    players,
    setPlayers,
  ] = useState([]);

  const [
    stats,
    setStats,
  ] = useState({
    totalPlayers: 0,
    activePlayers: 0,
  });


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
    status,
    setStatus,
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


    return () =>
      clearTimeout(timer);

  }, [search]);


  /* =========================================
     LOAD PLAYERS
  ========================================= */

  const loadPlayers =
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
            await getAgentPlayers({
              page,
              limit,
              search:
                debouncedSearch,
              status,
            });


          setPlayers(
            response?.data ||
              []
          );


          setPagination(
            response?.pagination || {
              page,
              limit,
              total: 0,
              totalPages: 1,
              hasNextPage:
                false,
              hasPrevPage:
                false,
            }
          );

        } catch (err) {

          console.error(
            "Failed to load players:",
            err
          );


          setError(
            err?.response?.data
              ?.message ||
              err?.message ||
              "Failed to load players"
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
        status,
      ]
    );


  /* =========================================
     LOAD STATISTICS
  ========================================= */

  const loadStats =
    useCallback(
      async () => {

        try {

          const response =
            await getAgentStats();


          setStats({
            totalPlayers:
              Number(
                response?.data
                  ?.totalPlayers ??
                  0
              ),

            activePlayers:
              Number(
                response?.data
                  ?.activePlayers ??
                  0
              ),
          });

        } catch (err) {

          console.error(
            "Failed to load agent stats:",
            err
          );

        }

      },
      []
    );


  /* =========================================
     LOAD PAGE
  ========================================= */

  useEffect(() => {

    loadPlayers();

  }, [loadPlayers]);


  /* =========================================
     LOAD STATS ONCE
  ========================================= */

  useEffect(() => {

    loadStats();

  }, [loadStats]);


  /* =========================================
     REFRESH
  ========================================= */

  const handleRefresh =
    async () => {

      await Promise.all([
        loadPlayers(true),
        loadStats(),
      ]);

    };


  /* =========================================
     STATUS CHANGE
  ========================================= */

  const handleStatusChange =
    (event) => {

      setStatus(
        event.target.value
      );

      setPage(1);

    };


  /* =========================================
     LIMIT CHANGE
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
     STATISTICS
  ========================================= */

  const totalPlayers =
    stats.totalPlayers;

  const activePlayers =
    stats.activePlayers;

  const inactivePlayers =
    Math.max(
      0,
      totalPlayers -
        activePlayers
    );


  /* =========================================
     DATE
  ========================================= */

  const formatDate = (
    date
  ) => {

    if (!date) {
      return "—";
    }


    return new Date(
      date
    ).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );

  };


  /* =========================================
     INITIAL LOADING
  ========================================= */

  if (
    loading &&
    players.length === 0
  ) {

    return (
      <div className="management-page">

        <div className="agent-loading">

          <RefreshCw
            size={28}
            className="agent-spin"
          />

          <p>
            Loading players...
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

        <div>

          <div className="management-page-title">

            <Users size={28} />

            <div>

              <h1>
                My Players
              </h1>

              <p>
                Manage players registered through
                your referral code.
              </p>

            </div>

          </div>

        </div>


        <button
          type="button"
          className="management-refresh-button"
          onClick={
            handleRefresh
          }
          disabled={
            refreshing
          }
        >

          <RefreshCw
            size={17}
            className={
              refreshing
                ? "agent-spin"
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

        <div className="agent-error">

          <UserX size={18} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              loadPlayers()
            }
          >
            Try Again
          </button>

        </div>

      )}


      {/* =====================================
          STATISTICS
      ===================================== */}

      <div className="management-stats-grid">


        <div className="management-stat-card">

          <div className="management-stat-icon">
            <Users size={22} />
          </div>

          <div>

            <span>
              Total Players
            </span>

            <strong>
              {totalPlayers}
            </strong>

          </div>

        </div>


        <div className="management-stat-card">

          <div className="management-stat-icon">
            <UserCheck size={22} />
          </div>

          <div>

            <span>
              Active Players
            </span>

            <strong>
              {activePlayers}
            </strong>

          </div>

        </div>


        <div className="management-stat-card">

          <div className="management-stat-icon">
            <UserX size={22} />
          </div>

          <div>

            <span>
              Other Status
            </span>

            <strong>
              {inactivePlayers}
            </strong>

          </div>

        </div>

      </div>


      {/* =====================================
          PLAYERS CARD
      ===================================== */}

      <div className="management-content-card">


        {/* ===================================
            FILTER HEADER
        =================================== */}

        <div className="management-content-header">

          <div>

            <h2>
              Players
            </h2>

            <p>
              {pagination.total} matching player
              {pagination.total !== 1
                ? "s"
                : ""}
            </p>

          </div>


          <div className="management-player-filters">


            {/* SEARCH */}

            <div className="management-search">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search name, phone or email..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>


            {/* STATUS */}

            <select
              className="management-filter-select"
              value={status}
              onChange={
                handleStatusChange
              }
            >

              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="suspended">
                Suspended
              </option>

              <option value="blocked">
                Blocked
              </option>

            </select>


            {/* ROW LIMIT */}

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

        {players.length === 0 ? (

          <div className="agent-empty">

            <Users size={42} />

            {pagination.total === 0 &&
            !debouncedSearch &&
            status === "all" ? (

              <>

                <h3>
                  No players yet
                </h3>

                <p>
                  Players who register using your
                  referral code will appear here.
                </p>

              </>

            ) : (

              <>

                <h3>
                  No matching players
                </h3>

                <p>
                  Try changing the search or
                  status filter.
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
                    <th>Player</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>

                </thead>


                <tbody>

                  {players.map(
                    (player) => (

                      <tr
                        key={
                          player._id
                        }
                      >


                        {/* PLAYER */}

                        <td>

                          <div className="management-player-cell">

                            <div className="management-player-avatar">

                              {player.fullName
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "P"}

                            </div>


                            <div>

                              <strong>

                                {player.fullName ||
                                  "Unknown Player"}

                              </strong>

                              <small>
                                Player
                              </small>

                            </div>

                          </div>

                        </td>


                        {/* PHONE */}

                        <td>

                          <div className="management-table-detail">

                            <Phone size={15} />

                            {player.phone ||
                              "—"}

                          </div>

                        </td>


                        {/* EMAIL */}

                        <td>

                          <div className="management-table-detail">

                            <Mail size={15} />

                            {player.email ||
                              "—"}

                          </div>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={`agent-status agent-status-${player.status}`}
                          >

                            {player.status}

                          </span>

                        </td>


                        {/* CREATED */}

                        <td>

                          <div className="management-table-detail">

                            <Calendar size={15} />

                            {formatDate(
                              player.createdAt
                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>


            {/* =================================
                PAGINATION
            ================================= */}

            <div className="management-pagination">


              <div className="management-pagination-info">

                Showing{" "}

                <strong>
                  {(pagination.page - 1) *
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


              <div className="management-pagination-actions">


                {/* PREVIOUS */}

                <button
                  type="button"
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
                  className="management-pagination-button"
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
                        onClick={() =>
                          setPage(
                            pageNumber
                          )
                        }
                        className={
                          pageNumber ===
                          pagination.page
                            ? "management-page-number active"
                            : "management-page-number"
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
                  className="management-pagination-button"
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

    </div>
  );
}