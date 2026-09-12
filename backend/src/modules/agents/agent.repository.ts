import { User } from "../users/user.model";


/* =========================================
   SEARCH HELPER
========================================= */

const escapeRegex = (
  value: string
) => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};


/* =========================================
   BUILD PLAYER FILTER
========================================= */

const buildAgentPlayerFilter = (
  agentId: string,
  search?: string,
  status?: string
) => {

  const filter: any = {
    referredBy: agentId,
    role: "player",
  };


  /* ===============================
     STATUS
  =============================== */

  if (
    status &&
    status !== "all"
  ) {
    filter.status = status;
  }


  /* ===============================
     SEARCH
     Name / phone / email
  =============================== */

  if (
    search &&
    search.trim()
  ) {

    const safeSearch =
      escapeRegex(
        search.trim()
      );


    filter.$or = [
      {
        fullName: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        email: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }


  return filter;
};


/* =========================================
   FIND AGENT
========================================= */

export const findAgentById =
  async (
    agentId: string
  ) => {

    return User.findOne({
      _id: agentId,
      role: "agent",
    }).select(
  "_id fullName phone email status avatar isVerified createdAt lastLogin"
);

  };


/* =========================================
   FIND AGENT PLAYERS

   Backward compatible:
   findPlayersByAgentId(agentId)

   New:
   findPlayersByAgentId(
     agentId,
     search,
     status,
     skip,
     limit
   )
========================================= */

export const findPlayersByAgentId =
  async (
    agentId: string,
    search?: string,
    status?: string,
    skip?: number,
    limit?: number
  ) => {

    const filter =
      buildAgentPlayerFilter(
        agentId,
        search,
        status
      );


    let query =
      User.find(
        filter
      )
        .select(
          "-password"
        )
        .sort({
          createdAt: -1,
        });


    /*
     * Only apply pagination when
     * skip and limit are supplied.
     *
     * This keeps the existing
     * service working for now.
     */

    if (
      typeof skip ===
        "number" &&
      typeof limit ===
        "number"
    ) {

      query =
        query
          .skip(skip)
          .limit(limit);

    }


    return query;

  };


/* =========================================
   COUNT FILTERED PLAYERS

   Used by pagination.
========================================= */

export const countFilteredPlayersByAgentId =
  async (
    agentId: string,
    search?: string,
    status?: string
  ) => {

    const filter =
      buildAgentPlayerFilter(
        agentId,
        search,
        status
      );


    return User.countDocuments(
      filter
    );

  };


/* =========================================
   TOTAL AGENT PLAYERS

   Keep for dashboard stats.
========================================= */

export const countPlayersByAgentId =
  async (
    agentId: string
  ) => {

    return User.countDocuments({
      referredBy: agentId,
      role: "player",
    });

  };


/* =========================================
   ACTIVE AGENT PLAYERS

   Keep for dashboard stats.
========================================= */

export const countActivePlayersByAgentId =
  async (
    agentId: string
  ) => {

    return User.countDocuments({
      referredBy: agentId,
      role: "player",
      status: "active",
    });

  };