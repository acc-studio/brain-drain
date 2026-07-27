/**
 * Central game-balance constants. Tune combat here + verify with
 * `npm run simulate` (scripts/simulate_combat.mjs).
 */

// ── Scoring ───────────────────────────────────────────────────
// GII (Global Influence Index) = regions held
//                              + floor(total minds / 3)
//                              + 5 × continents fully held
export const GII_MINDS_DIVISOR = 3;
export const GII_CONTINENT_BONUS = 5;

// ── Enlistment / economy ──────────────────────────────────────
export const STARTING_MINDS = 8;
export const PASSIVE_INCOME = 1; // +1 to every owned region each turn
export const FRONTLINE_DRAFT = 3; // +3 to each region bordering enemy/neutral land

// ── Puzzle tiers ──────────────────────────────────────────────
// tier 0 = did not pass; 1 = best; 3 = weakest passing tier
export type Tier = 0 | 1 | 2 | 3;

/** Cipher (word) → Initiative. Lower rank resolves first. */
export function wordTierFromGuesses(guesses: number, solved: boolean): Tier {
  if (!solved) return 0;
  if (guesses <= 2) return 1;
  if (guesses <= 4) return 2;
  return 3;
}

/** Cipher Break (code) → Combat bonus dice. */
export function codeTierFromGuesses(guesses: number, solved: boolean): Tier {
  if (!solved) return 0;
  if (guesses <= 2) return 1;
  if (guesses <= 4) return 2;
  return 3;
}

/** Supply Run (numbers) → Economy bonus. */
export function numbersTierFromDelta(delta: number): Tier {
  const d = Math.abs(delta);
  if (d === 0) return 1;
  if (d <= 5) return 2;
  if (d <= 25) return 3;
  return 0;
}

// ── Pillar effects ────────────────────────────────────────────
/** Initiative: resolution order. Tier 0 (no solve) resolves last. */
export function initiativeRank(wordTier: Tier): number {
  return wordTier === 0 ? 4 : wordTier;
}

/** Economy: bonus draft minds added to the frontline this turn. */
export const ECONOMY_BONUS: Record<Tier, number> = { 0: 0, 1: 5, 2: 3, 3: 1 };

/** Combat: extra attacker dice for the day's attacks. */
export const COMBAT_BONUS_DICE: Record<Tier, number> = { 0: 0, 1: 2, 2: 1, 3: 0 };

// ── Puzzle shape ──────────────────────────────────────────────
export const WORD_LENGTH = 5;
export const WORD_MAX_GUESSES = 6;
export const CODE_LENGTH = 4;
export const CODE_MAX_GUESSES = 6;
export const NUMBERS_POOL_SIZE = 6;
/** Symbol palette for Cipher Break (6 NATO-style tokens, rendered as glyph tiles). */
export const SYMBOL_PALETTE = ["ALPHA", "BRAVO", "CIPHER", "DELTA", "ECHO", "FLUX"] as const;

export type PillarKey = "initiative" | "economy" | "combat";
