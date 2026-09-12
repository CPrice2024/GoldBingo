import {
  findAgentById,
  findPlayersByAgentId,
  countFilteredPlayersByAgentId,
  countPlayersByAgentId,
  countActivePlayersByAgentId,
} from "./agent.repository";

import {
  getPaginationParams,
  buildPaginationMeta,
} from "../../shared/pagination";


/* =========================================
   AGENT PROFILE
========================================= */

export const getAgentProfile = async (
  agentId: string
) => {

  const agent =
    await findAgentById(
      agentId
    );

  if (!agent) {
    throw new Error(
      "Agent not found"
    );
  }

  return {
    id: agent._id,
    fullName: agent.fullName,
    phone: agent.phone,
    email: agent.email,
    role: agent.role,
    status: agent.status,
    referralCode:
      agent.referralCode,
    createdAt:
      agent.createdAt,
  };
};


/* =========================================
   AGENT PLAYERS
   PAGINATION + FILTERING
========================================= */

export const getAgentPlayers = async (
  agentId: string,
  query: any = {}
) => {

  const {
    page,
    limit,
    skip,
  } =
    getPaginationParams(
      query
    );


  const search =
    typeof query.search ===
      "string"
      ? query.search.trim()
      : "";


  const status =
    typeof query.status ===
      "string"
      ? query.status.trim()
      : "";


  const [
    players,
    total,
  ] =
    await Promise.all([

      findPlayersByAgentId(
        agentId,
        search,
        status,
        skip,
        limit
      ),

      countFilteredPlayersByAgentId(
        agentId,
        search,
        status
      ),

    ]);


  return {
    data:
      players,

    pagination:
      buildPaginationMeta({
        page,
        limit,
        total,
      }),
  };
};


/* =========================================
   AGENT STATISTICS
========================================= */

export const getAgentStats = async (
  agentId: string
) => {

  const [
    totalPlayers,
    activePlayers,
  ] =
    await Promise.all([

      countPlayersByAgentId(
        agentId
      ),

      countActivePlayersByAgentId(
        agentId
      ),

    ]);


  return {
    totalPlayers,
    activePlayers,
  };
};