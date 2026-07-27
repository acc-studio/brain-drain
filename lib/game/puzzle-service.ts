import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import {
  wordFeedback,
  codeFeedback,
  isValidWordGuess,
  evaluateExpression,
  type LetterState,
  type CodePegs,
} from "./puzzles";
import {
  WORD_MAX_GUESSES,
  CODE_MAX_GUESSES,
  wordTierFromGuesses,
  codeTierFromGuesses,
  numbersTierFromDelta,
  type Tier,
} from "./constants";

type Admin = SupabaseClient<Database>;

export type PuzzleKind = "word" | "numbers" | "code";

export interface WordState {
  attempts: number;
  maxAttempts: number;
  guesses: { guess: string; feedback: LetterState[] }[];
  solved: boolean;
  tier: Tier;
  done: boolean;
}
export interface NumbersState {
  result: number | null;
  expression: string[] | null;
  target: number;
  pool: number[];
  tier: Tier;
  done: boolean;
}
export interface CodeState {
  attempts: number;
  maxAttempts: number;
  guesses: { guess: string[]; pegs: CodePegs }[];
  solved: boolean;
  tier: Tier;
  done: boolean;
  length: number;
  palette: string[];
}
export interface PuzzleStatus {
  day: number;
  word: WordState;
  numbers: NumbersState;
  code: CodeState;
}

interface PuzzleRow {
  day_number: number;
  word_solution: string;
  word_length: number;
  numbers_target: number;
  numbers_pool: number[];
  code_solution: string[];
  code_length: number;
  symbol_palette: string[];
}
type PerfRow = Database["public"]["Tables"]["daily_performance"]["Row"];

export async function getCurrentDay(admin: Admin): Promise<number> {
  const { data } = await admin
    .from("global_settings")
    .select("value")
    .eq("key", "current_day")
    .maybeSingle();
  const v = data?.value;
  const n = typeof v === "number" ? v : parseInt(String(v ?? "1"), 10);
  return Number.isFinite(n) ? n : 1;
}

async function loadPuzzle(admin: Admin, day: number): Promise<PuzzleRow> {
  const { data, error } = await admin
    .from("daily_puzzles")
    .select("*")
    .eq("day_number", day)
    .single();
  if (error || !data) throw new Error(`No puzzle for day ${day}`);
  return data as PuzzleRow;
}

async function loadPerf(admin: Admin, userId: string, day: number): Promise<PerfRow | null> {
  const { data } = await admin
    .from("daily_performance")
    .select("*")
    .eq("user_id", userId)
    .eq("day_number", day)
    .maybeSingle();
  return (data as PerfRow) ?? null;
}

function buildStatus(puzzle: PuzzleRow, perf: PerfRow | null): PuzzleStatus {
  const wordGuesses = (perf?.word_guesses ?? []) as string[];
  const codeGuesses = (perf?.code_guesses ?? []) as string[][];

  return {
    day: puzzle.day_number,
    word: {
      attempts: perf?.word_attempts ?? 0,
      maxAttempts: WORD_MAX_GUESSES,
      guesses: wordGuesses.map((g) => ({
        guess: g,
        feedback: wordFeedback(g, puzzle.word_solution),
      })),
      solved: !!perf && perf.word_tier > 0,
      tier: (perf?.word_tier ?? 0) as Tier,
      done: !!perf?.word_completed_at,
    },
    numbers: {
      result: perf?.numbers_result ?? null,
      expression: (perf?.numbers_expression as string[] | null) ?? null,
      target: puzzle.numbers_target,
      pool: puzzle.numbers_pool,
      tier: (perf?.numbers_tier ?? 0) as Tier,
      done: !!perf?.numbers_completed_at,
    },
    code: {
      attempts: perf?.code_attempts ?? 0,
      maxAttempts: CODE_MAX_GUESSES,
      guesses: codeGuesses.map((g) => ({ guess: g, pegs: codeFeedback(g, puzzle.code_solution) })),
      solved: !!perf && perf.code_tier > 0,
      tier: (perf?.code_tier ?? 0) as Tier,
      done: !!perf?.code_completed_at,
      length: puzzle.code_length,
      palette: puzzle.symbol_palette,
    },
  };
}

export async function getStatus(admin: Admin, userId: string): Promise<PuzzleStatus> {
  const day = await getCurrentDay(admin);
  const [puzzle, perf] = await Promise.all([loadPuzzle(admin, day), loadPerf(admin, userId, day)]);
  return buildStatus(puzzle, perf);
}

async function upsertPerf(
  admin: Admin,
  userId: string,
  day: number,
  patch: Partial<Database["public"]["Tables"]["daily_performance"]["Insert"]>,
) {
  await admin
    .from("daily_performance")
    .upsert(
      { user_id: userId, day_number: day, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id,day_number" },
    );
}

export interface GuessOutcome {
  ok: boolean;
  error?: string;
  status?: PuzzleStatus;
}

export async function submitWord(admin: Admin, userId: string, guess: string): Promise<GuessOutcome> {
  const day = await getCurrentDay(admin);
  const puzzle = await loadPuzzle(admin, day);
  const perf = await loadPerf(admin, userId, day);

  if (perf?.word_completed_at) return { ok: false, error: "Cipher already locked for today." };
  if (!isValidWordGuess(guess)) return { ok: false, error: "Enter a 5-letter word." };

  const g = guess.toUpperCase();
  const guesses = [...((perf?.word_guesses ?? []) as string[]), g];
  const attempts = guesses.length;
  const solved = g === puzzle.word_solution.toUpperCase();
  const failed = !solved && attempts >= WORD_MAX_GUESSES;

  const patch: Partial<Database["public"]["Tables"]["daily_performance"]["Insert"]> = {
    word_attempts: attempts,
    word_guesses: guesses,
  };
  if (solved || failed) {
    patch.word_tier = solved ? wordTierFromGuesses(attempts, true) : 0;
    patch.word_completed_at = new Date().toISOString();
  }
  await upsertPerf(admin, userId, day, patch);
  return { ok: true, status: buildStatus(puzzle, await loadPerf(admin, userId, day)) };
}

export async function submitCode(
  admin: Admin,
  userId: string,
  guess: string[],
): Promise<GuessOutcome> {
  const day = await getCurrentDay(admin);
  const puzzle = await loadPuzzle(admin, day);
  const perf = await loadPerf(admin, userId, day);

  if (perf?.code_completed_at) return { ok: false, error: "Cipher Break already locked for today." };
  if (
    !Array.isArray(guess) ||
    guess.length !== puzzle.code_length ||
    !guess.every((s) => puzzle.symbol_palette.includes(s))
  ) {
    return { ok: false, error: "Invalid code guess." };
  }

  const guesses = [...((perf?.code_guesses ?? []) as string[][]), guess];
  const attempts = guesses.length;
  const pegs = codeFeedback(guess, puzzle.code_solution);
  const solved = pegs.exact === puzzle.code_length;
  const failed = !solved && attempts >= CODE_MAX_GUESSES;

  const patch: Partial<Database["public"]["Tables"]["daily_performance"]["Insert"]> = {
    code_attempts: attempts,
    code_guesses: guesses,
  };
  if (solved || failed) {
    patch.code_tier = solved ? codeTierFromGuesses(attempts, true) : 0;
    patch.code_completed_at = new Date().toISOString();
  }
  await upsertPerf(admin, userId, day, patch);
  return { ok: true, status: buildStatus(puzzle, await loadPerf(admin, userId, day)) };
}

export async function submitNumbers(
  admin: Admin,
  userId: string,
  expression: string[],
): Promise<GuessOutcome> {
  const day = await getCurrentDay(admin);
  const puzzle = await loadPuzzle(admin, day);
  const perf = await loadPerf(admin, userId, day);

  if (perf?.numbers_completed_at) return { ok: false, error: "Supply Run already locked for today." };

  const evalRes = evaluateExpression(expression, puzzle.numbers_pool);
  if (!evalRes.ok || evalRes.value === undefined) {
    return { ok: false, error: evalRes.error ?? "Invalid expression." };
  }
  const value = Math.round(evalRes.value);
  const tier = numbersTierFromDelta(value - puzzle.numbers_target);

  await upsertPerf(admin, userId, day, {
    numbers_result: value,
    numbers_expression: expression,
    numbers_tier: tier,
    numbers_completed_at: new Date().toISOString(),
  });
  return { ok: true, status: buildStatus(puzzle, await loadPerf(admin, userId, day)) };
}
