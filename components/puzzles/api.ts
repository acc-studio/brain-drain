import type { PuzzleStatus } from "@/lib/game/puzzle-types";

export interface GuessResult {
  status?: PuzzleStatus;
  error?: string;
}

/** Submit a guess to the server-authoritative validator. */
export async function submitGuess(body: Record<string, unknown>): Promise<GuessResult> {
  try {
    const res = await fetch("/api/puzzle/guess", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return { status: (await res.json()) as PuzzleStatus };
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    return { error: j.error ?? "Guess rejected." };
  } catch {
    return { error: "Network error — try again." };
  }
}

export async function fetchStatus(): Promise<PuzzleStatus | null> {
  try {
    const res = await fetch("/api/puzzle/status", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as PuzzleStatus;
  } catch {
    return null;
  }
}
