/**
 * Client-safe puzzle types — the exact shape returned by /api/puzzle/status and
 * /api/puzzle/guess. Kept separate from `puzzle-service.ts` (which is
 * server-only) and `puzzles.ts` (which contains the SECRET solution list) so
 * client components can import these types without pulling any answers into the
 * browser bundle.
 */
export type Tier = 0 | 1 | 2 | 3;
export type LetterState = "correct" | "present" | "absent";
export interface CodePegs {
  exact: number;
  present: number;
}

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

export type PillarKey = "initiative" | "economy" | "combat";
