/**
 * Country → game-region mapping (typed view).
 *
 * Raw data lives in `region-geo.data.mjs` (shared with the Node seed generator
 * so the map and the seeded garrisons never drift). This module only adds the
 * type. MUST stay in sync with the region ids in `lib/game/regions.data.mjs`.
 */
import { GEO_TO_GAME_ID as RAW } from "./region-geo.data.mjs";

export const GEO_TO_GAME_ID = RAW as Record<string, string>;
