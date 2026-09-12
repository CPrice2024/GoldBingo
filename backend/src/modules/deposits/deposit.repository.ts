import mongoose from "mongoose";
import { User } from "../users/user.model";
import { Deposit } from "./deposit.model";

import { PaymentMethod } from "./deposit.types";


interface CreateDepositData {
  playerId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  note?: string;
}


/* =========================================
   ESCAPE SEARCH TEXT
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
   BUILD PLAYER DEPOSIT FILTER
========================================= */

const buildPlayerDepositFilter = (
  playerId: string,
  search?: string,
  status?: string,
  paymentMethod?: string
) => {

  const filter: any = {
    playerId,
  };


  /* ===============================
     STATUS
  =============================== */

  if (
    status &&
    status !== "all"
  ) {
    filter.status =
      status;
  }


  /* ===============================
     PAYMENT METHOD
  =============================== */

  if (
    paymentMethod &&
    paymentMethod !== "all"
  ) {
    filter.paymentMethod =
      paymentMethod;
  }


  /* ===============================
     SEARCH TRANSACTION REFERENCE
  =============================== */

  if (
    search &&
    search.trim()
  ) {

    const safeSearch =
      escapeRegex(
        search.trim()
      );


    filter.reference = {
      $regex: safeSearch,
      $options: "i",
    };
  }


  return filter;
};


/* =========================================
   CREATE DEPOSIT
========================================= */

export const createDeposit = async (
  data: CreateDepositData,
  session?: mongoose.ClientSession
) => {

  const deposits =
    await Deposit.create(
      [
        {
          ...data,
          status: "pending",
        },
      ],
      {
        session,
      }
    );

  return deposits[0];
};


/* =========================================
   FIND DEPOSIT
========================================= */

export const findDepositById = async (
  depositId: string
) => {

  return Deposit.findById(
    depositId
  );

};


/* =========================================
   PLAYER DEPOSITS
   PAGINATION + FILTERING
========================================= */

export const findPlayerDeposits = async (
  playerId: string,
  search?: string,
  status?: string,
  paymentMethod?: string,
  skip?: number,
  limit?: number
) => {

  const filter =
    buildPlayerDepositFilter(
      playerId,
      search,
      status,
      paymentMethod
    );


  let query =
    Deposit.find(
      filter
    ).sort({
      createdAt: -1,
    });


  /*
   * Keep backward compatibility.
   * Pagination is only applied when
   * skip and limit are provided.
   */

  if (
    typeof skip === "number" &&
    typeof limit === "number"
  ) {

    query =
      query
        .skip(skip)
        .limit(limit);

  }


  return query;
};


/* =========================================
   COUNT FILTERED PLAYER DEPOSITS
========================================= */

export const countFilteredPlayerDeposits =
  async (
    playerId: string,
    search?: string,
    status?: string,
    paymentMethod?: string
  ) => {

    const filter =
      buildPlayerDepositFilter(
        playerId,
        search,
        status,
        paymentMethod
      );


    return Deposit.countDocuments(
      filter
    );

  };


/* =========================================
   AGENT PENDING DEPOSITS

   KEEP EXISTING BEHAVIOR FOR NOW
========================================= */

export const findAgentPendingDeposits = async (
  agentId: string,
  search?: string,
  paymentMethod?: string,
  skip?: number,
  limit?: number
) => {

  const filter: any = {
    agentId,
    status: "pending",
  };


  /* =========================================
     PAYMENT METHOD FILTER
  ========================================= */

  if (
    paymentMethod &&
    paymentMethod !== "all"
  ) {
    filter.paymentMethod =
      paymentMethod;
  }


  /* =========================================
     SEARCH
  ========================================= */

  if (
    search &&
    search.trim()
  ) {

    const value =
      search.trim();

    const safeSearch =
      escapeRegex(value);


    /*
     * Find players belonging to this agent
     * whose name or phone matches.
     */
    const matchingPlayers =
      await User.find({
        referredBy:
          agentId,

        role:
          "player",

        $or: [
          {
            fullName: {
              $regex:
                safeSearch,
              $options:
                "i",
            },
          },
          {
            phone: {
              $regex:
                safeSearch,
              $options:
                "i",
            },
          },
        ],
      }).select("_id");


    const playerIds =
      matchingPlayers.map(
        (player) =>
          player._id
      );


    const orFilters: any[] = [
      {
        reference: {
          $regex:
            safeSearch,
          $options:
            "i",
        },
      },

      {
        note: {
          $regex:
            safeSearch,
          $options:
            "i",
        },
      },

      {
        paymentMethod: {
          $regex:
            safeSearch,
          $options:
            "i",
        },
      },
    ];


    /*
     * Exact / partial numeric amount search.
     */
    const numericSearch =
      Number(value);

    if (
      Number.isFinite(
        numericSearch
      )
    ) {
      orFilters.push({
        amount:
          numericSearch,
      });
    }


    if (
      playerIds.length > 0
    ) {
      orFilters.push({
        playerId: {
          $in:
            playerIds,
        },
      });
    }


    filter.$or =
      orFilters;
  }


  let query =
    Deposit.find(
      filter
    )
      .populate(
        "playerId",
        "fullName phone avatar"
      )
      .sort({
        createdAt: 1,
      });


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
   COUNT FILTERED PENDING DEPOSITS
========================================= */

export const countAgentPendingDeposits =
  async (
    agentId: string,
    search?: string,
    paymentMethod?: string
  ) => {

    const filter: any = {
      agentId,
      status: "pending",
    };


    if (
      paymentMethod &&
      paymentMethod !== "all"
    ) {
      filter.paymentMethod =
        paymentMethod;
    }


    if (
      search &&
      search.trim()
    ) {

      const value =
        search.trim();

      const safeSearch =
        escapeRegex(value);


      const matchingPlayers =
        await User.find({
          referredBy:
            agentId,

          role:
            "player",

          $or: [
            {
              fullName: {
                $regex:
                  safeSearch,
                $options:
                  "i",
              },
            },
            {
              phone: {
                $regex:
                  safeSearch,
                $options:
                  "i",
              },
            },
          ],
        }).select("_id");


      const playerIds =
        matchingPlayers.map(
          (player) =>
            player._id
        );


      const orFilters: any[] = [
        {
          reference: {
            $regex:
              safeSearch,
            $options:
              "i",
          },
        },

        {
          note: {
            $regex:
              safeSearch,
            $options:
              "i",
          },
        },

        {
          paymentMethod: {
            $regex:
              safeSearch,
            $options:
              "i",
          },
        },
      ];


      const numericSearch =
        Number(value);

      if (
        Number.isFinite(
          numericSearch
        )
      ) {
        orFilters.push({
          amount:
            numericSearch,
        });
      }


      if (
        playerIds.length > 0
      ) {
        orFilters.push({
          playerId: {
            $in:
              playerIds,
          },
        });
      }


      filter.$or =
        orFilters;
    }


    return Deposit.countDocuments(
      filter
    );
  };

  
  /* =========================================
   TOTAL PENDING AMOUNT
========================================= */

export const getAgentPendingDepositAmount =
  async (
    agentId: string
  ) => {

    const result =
      await Deposit.aggregate([
        {
          $match: {
            agentId:
              new mongoose.Types.ObjectId(
                agentId
              ),

            status:
              "pending",
          },
        },

        {
          $group: {
            _id: null,

            totalAmount: {
              $sum: "$amount",
            },
          },
        },
      ]);


    return Number(
      result?.[0]?.totalAmount ??
        0
    );
  };


/* =========================================
   FIND BY REFERENCE
========================================= */

export const findDepositByReference =
  async (
    reference: string
  ) => {

    return Deposit.findOne({
      reference:
        reference.trim(),
    });

  };