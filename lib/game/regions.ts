/**
 * Canonical region graph — the typed game-layer view of the world.
 *
 * Raw data lives in `regions.data.mjs` (shared with the Node seed generator so
 * the DB and the app never drift). This module adds types, lookup maps, derived
 * edge lists, and dev-only integrity checks.
 *
 * The world is the classic 42-territory / 6-continent conquest board, mapped to
 * real lon/lat so the strategic map can project it over a real-world silhouette.
 */
import {
  CONTINENTS as RAW_CONTINENTS,
  REGIONS as RAW_REGIONS,
  SEA_EDGE_PAIRS as RAW_SEA_EDGE_PAIRS,
} from "./regions.data.mjs";

export type ContinentId =
  | "north-america"
  | "south-america"
  | "europe"
  | "africa"
  | "asia"
  | "oceania";

export interface Continent {
  id: ContinentId;
  name: string;
  hue: number;
}

export interface Region {
  id: string;
  name: string;
  continent: ContinentId;
  lon: number;
  lat: number;
  connections: string[];
}

export const CONTINENTS = RAW_CONTINENTS as Continent[];
export const REGIONS = RAW_REGIONS as Region[];
const SEA_EDGE_PAIRS = RAW_SEA_EDGE_PAIRS as Array<[string, string]>;

export const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export const SEA_EDGES = new Set(SEA_EDGE_PAIRS.map(([a, b]) => edgeKey(a, b)));

export const REGION_BY_ID: Record<string, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
);

export const CONTINENT_BY_ID = Object.fromEntries(
  CONTINENTS.map((c) => [c.id, c]),
) as Record<ContinentId, Continent>;

export const REGION_IDS = REGIONS.map((r) => r.id);

export const REGIONS_BY_CONTINENT: Record<ContinentId, Region[]> = CONTINENTS.reduce(
  (acc, c) => {
    acc[c.id] = REGIONS.filter((r) => r.continent === c.id);
    return acc;
  },
  {} as Record<ContinentId, Region[]>,
);

/** Unique undirected edges as [a, b] with a<b — for drawing each arc once. */
export const EDGES: Array<[string, string]> = (() => {
  const seen = new Set<string>();
  const out: Array<[string, string]> = [];
  for (const r of REGIONS) {
    for (const c of r.connections) {
      const k = edgeKey(r.id, c);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(r.id < c ? [r.id, c] : [c, r.id]);
      }
    }
  }
  return out;
})();

export function isSeaEdge(a: string, b: string): boolean {
  return SEA_EDGES.has(edgeKey(a, b));
}

export function areAdjacent(a: string, b: string): boolean {
  return REGION_BY_ID[a]?.connections.includes(b) ?? false;
}

// ── Dev-only integrity checks ─────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  const ids = new Set(REGION_IDS);
  for (const r of REGIONS) {
    for (const c of r.connections) {
      if (!ids.has(c)) {
        throw new Error(`[regions] ${r.id} connects to unknown region "${c}"`);
      }
      if (!REGION_BY_ID[c].connections.includes(r.id)) {
        throw new Error(`[regions] asymmetric edge: ${r.id}→${c} has no return edge`);
      }
    }
  }
  for (const [a, b] of SEA_EDGE_PAIRS) {
    if (!REGION_BY_ID[a]?.connections.includes(b)) {
      throw new Error(`[regions] sea edge ${a}|${b} is not an actual connection`);
    }
  }
}
