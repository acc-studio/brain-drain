/**
 * GII (Global Influence Index) scoring.
 *   GII = regions held + floor(total minds / 3) + 5 × continents fully held
 */
import { CONTINENTS, REGION_BY_ID } from "./regions";
import { GII_MINDS_DIVISOR, GII_CONTINENT_BONUS } from "./constants";

export interface BoardCell {
  country_id: string;
  owner_id: string | null;
  minds: number;
}

export interface GIIBreakdown {
  gii: number;
  regions: number;
  minds: number;
  continents: number;
  continentIds: string[];
}

export function computeGII(playerId: string, board: BoardCell[]): GIIBreakdown {
  const owned = board.filter((c) => c.owner_id === playerId);
  const ownedIds = new Set(owned.map((c) => c.country_id));
  const regions = owned.length;
  const minds = owned.reduce((sum, c) => sum + c.minds, 0);

  const continentIds: string[] = [];
  for (const cont of CONTINENTS) {
    const members = Object.values(REGION_BY_ID).filter((r) => r.continent === cont.id);
    if (members.length > 0 && members.every((r) => ownedIds.has(r.id))) {
      continentIds.push(cont.id);
    }
  }

  const gii =
    regions +
    Math.floor(minds / GII_MINDS_DIVISOR) +
    GII_CONTINENT_BONUS * continentIds.length;

  return { gii, regions, minds, continents: continentIds.length, continentIds };
}

export interface ScoreRow extends GIIBreakdown {
  playerId: string;
}

/** Ranked scoreboard for every player that holds at least one region. */
export function computeScoreboard(board: BoardCell[]): ScoreRow[] {
  const playerIds = Array.from(
    new Set(board.map((c) => c.owner_id).filter((id): id is string => !!id)),
  );
  return playerIds
    .map((playerId) => ({ playerId, ...computeGII(playerId, board) }))
    .sort((a, b) => b.gii - a.gii);
}
