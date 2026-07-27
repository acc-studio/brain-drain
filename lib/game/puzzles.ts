/**
 * Puzzle generation + validation. Pure, deterministic (seeded by day) so every
 * player faces the identical daily set, and the resolution engine can seed the
 * next day reproducibly.
 *
 * Solutions produced here are stored in the SECRET columns of daily_puzzles and
 * never leave the server. Validation helpers run server-side in
 * /api/puzzle/guess.
 */
import {
  WORD_LENGTH,
  CODE_LENGTH,
  NUMBERS_POOL_SIZE,
  SYMBOL_PALETTE,
} from "./constants";

export { evaluateExpression, type NumbersEval } from "./numbers-eval";

// ── seeded PRNG (mulberry32) ──────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dayRng(day: number, salt: number) {
  return mulberry32((day * 2654435761 + salt * 40503) >>> 0);
}

const pick = <T>(rng: () => number, arr: readonly T[]): T =>
  arr[Math.floor(rng() * arr.length)];

// ── Cipher (word) ─────────────────────────────────────────────
// Curated 5-letter solution list (spy/strategy flavored + common words).
export const WORD_SOLUTIONS: string[] = [
  "AGENT", "RADAR", "CODES", "SPIES", "CLOAK", "PROBE", "SCOUT", "RELAY",
  "FRONT", "SIEGE", "ARMOR", "FLANK", "RAIDS", "TROOP", "FORCE", "POWER",
  "ORBIT", "PULSE", "VAULT", "CRYPT", "GHOST", "SIGIL", "TOKEN", "NODES",
  "GRIDS", "LINKS", "PIVOT", "GAMES", "MINDS", "BRAIN", "LOGIC", "SOLVE",
  "GUESS", "TILES", "WORLD", "STATE", "MOVES", "RANKS", "UNITS", "BASES",
  "ALERT", "COVER", "DECOY", "RECON", "FEINT", "GUARD",
  "HAVEN", "INTEL", "PLANS", "QUELL", "RALLY", "STORM", "TRUCE", "WATCH",
];

export function pickWord(day: number): string {
  const rng = dayRng(day, 11);
  // rotate so consecutive days differ even with a small list
  const idx = (Math.floor(rng() * WORD_SOLUTIONS.length) + day) % WORD_SOLUTIONS.length;
  const w = WORD_SOLUTIONS[idx];
  return w.length === WORD_LENGTH ? w : "AGENT";
}

export type LetterState = "correct" | "present" | "absent";

/** Wordle coloring with correct duplicate handling. */
export function wordFeedback(guess: string, solution: string): LetterState[] {
  const g = guess.toUpperCase();
  const s = solution.toUpperCase();
  const res: LetterState[] = new Array(g.length).fill("absent");
  const counts: Record<string, number> = {};
  for (const ch of s) counts[ch] = (counts[ch] ?? 0) + 1;

  // first pass: exact matches
  for (let i = 0; i < g.length; i++) {
    if (g[i] === s[i]) {
      res[i] = "correct";
      counts[g[i]]--;
    }
  }
  // second pass: present elsewhere
  for (let i = 0; i < g.length; i++) {
    if (res[i] === "correct") continue;
    if ((counts[g[i]] ?? 0) > 0) {
      res[i] = "present";
      counts[g[i]]--;
    }
  }
  return res;
}

export const isValidWordGuess = (guess: string) =>
  new RegExp(`^[A-Za-z]{${WORD_LENGTH}}$`).test(guess);

// ── Supply Run (numbers) ──────────────────────────────────────
const SMALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const BIG = [25, 50, 75, 100];

/** All positive-integer values reachable by combining the given numbers. */
function reachableValues(nums: number[]): Set<number> {
  const memo = new Map<string, Set<number>>();

  function solve(list: number[]): Set<number> {
    const key = [...list].sort((a, b) => a - b).join(",");
    const cached = memo.get(key);
    if (cached) return cached;

    const out = new Set<number>(list);
    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const a = list[i];
        const b = list[j];
        const rest = list.filter((_, k) => k !== i && k !== j);
        const combos: number[] = [a + b, a * b];
        if (a - b > 0) combos.push(a - b);
        if (b !== 0 && a % b === 0) combos.push(a / b);
        for (const c of combos) {
          const next = solve([...rest, c]);
          for (const v of next) out.add(v);
        }
      }
    }
    memo.set(key, out);
    return out;
  }
  return solve(nums);
}

export function generateNumbers(day: number): { target: number; pool: number[] } {
  const rng = dayRng(day, 23);
  for (let attempt = 0; attempt < 200; attempt++) {
    const bigCount = 1 + Math.floor(rng() * 2); // 1–2 big numbers
    const pool: number[] = [];
    const bigBag = [...BIG];
    for (let i = 0; i < bigCount; i++) {
      const idx = Math.floor(rng() * bigBag.length);
      pool.push(bigBag.splice(idx, 1)[0]);
    }
    while (pool.length < NUMBERS_POOL_SIZE) pool.push(pick(rng, SMALL));

    const reachable = [...reachableValues(pool)].filter((v) => v >= 100 && v <= 999);
    if (reachable.length === 0) continue;
    const target = reachable[Math.floor(rng() * reachable.length)];
    return { target, pool: pool.sort((a, b) => b - a) };
  }
  // fallback (always solvable): 25*4*3 = 300
  return { target: 300, pool: [25, 10, 5, 4, 3, 2] };
}

// ── Cipher Break (codebreaker) ────────────────────────────────
export function generateCode(day: number): { solution: string[]; palette: string[] } {
  const rng = dayRng(day, 37);
  const palette = [...SYMBOL_PALETTE];
  const bag = [...palette];
  const solution: string[] = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    const idx = Math.floor(rng() * bag.length);
    solution.push(bag.splice(idx, 1)[0]); // distinct symbols
  }
  return { solution, palette };
}

export interface CodePegs {
  exact: number; // right symbol, right position
  present: number; // right symbol, wrong position
}

export function codeFeedback(guess: string[], solution: string[]): CodePegs {
  const n = solution.length;
  let exact = 0;
  const sRem: Record<string, number> = {};
  const gRem: string[] = [];
  for (let i = 0; i < n; i++) {
    if (guess[i] === solution[i]) exact++;
    else {
      sRem[solution[i]] = (sRem[solution[i]] ?? 0) + 1;
      gRem.push(guess[i]);
    }
  }
  let present = 0;
  for (const g of gRem) {
    if ((sRem[g] ?? 0) > 0) {
      present++;
      sRem[g]--;
    }
  }
  return { exact, present };
}

// ── whole-day generation ──────────────────────────────────────
export interface GeneratedPuzzle {
  word_solution: string;
  word_length: number;
  numbers_target: number;
  numbers_pool: number[];
  code_solution: string[];
  code_length: number;
  symbol_palette: string[];
}

export function generatePuzzle(day: number): GeneratedPuzzle {
  const word = pickWord(day);
  const nums = generateNumbers(day);
  const code = generateCode(day);
  return {
    word_solution: word,
    word_length: WORD_LENGTH,
    numbers_target: nums.target,
    numbers_pool: nums.pool,
    code_solution: code.solution,
    code_length: CODE_LENGTH,
    symbol_palette: code.palette,
  };
}
