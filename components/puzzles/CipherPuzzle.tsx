"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Delete, CornerDownLeft } from "lucide-react";
import type { PuzzleStatus, WordState, LetterState } from "@/lib/game/puzzle-types";
import { submitGuess } from "./api";
import PuzzleResult from "./PuzzleResult";

const WORD_LEN = 5;
const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

const TILE: Record<LetterState | "empty" | "active", string> = {
  correct: "bg-teal-500 text-white border-teal-500",
  present: "bg-amber-400 text-white border-amber-400",
  absent: "bg-surface-2 text-ink-faint border-line",
  empty: "bg-surface border-line",
  active: "bg-surface border-line-strong",
};

function aggregateKeys(guesses: WordState["guesses"]): Record<string, LetterState> {
  const rank: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 };
  const out: Record<string, LetterState> = {};
  for (const g of guesses) {
    for (let i = 0; i < g.guess.length; i++) {
      const ch = g.guess[i];
      const s = g.feedback[i];
      if (!out[ch] || rank[s] > rank[out[ch]]) out[ch] = s;
    }
  }
  return out;
}

export default function CipherPuzzle({
  state,
  onStatus,
}: {
  state: WordState;
  onStatus: (s: PuzzleStatus) => void;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const done = state.done;
  const keyStates = aggregateKeys(state.guesses);

  const submit = useCallback(async () => {
    if (busy || done) return;
    if (input.length !== WORD_LEN) {
      setError("Enter 5 letters.");
      setShake(true);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await submitGuess({ kind: "word", guess: input });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      setShake(true);
      return;
    }
    if (res.status) {
      onStatus(res.status);
      setInput("");
    }
  }, [busy, done, input, onStatus]);

  const type = useCallback(
    (ch: string) => {
      if (done) return;
      setError(null);
      if (ch === "ENTER") return void submit();
      if (ch === "BACK") return setInput((s) => s.slice(0, -1));
      if (/^[A-Z]$/.test(ch)) setInput((s) => (s.length < WORD_LEN ? s + ch : s));
    },
    [done, submit],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") type("ENTER");
      else if (e.key === "Backspace") type("BACK");
      else {
        const ch = e.key.toUpperCase();
        if (/^[A-Z]$/.test(ch)) type(ch);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [type]);

  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(false), 400);
    return () => clearTimeout(t);
  }, [shake]);

  const rows = Array.from({ length: state.maxAttempts }, (_, r) => {
    if (r < state.guesses.length) return { kind: "done" as const, data: state.guesses[r] };
    if (r === state.guesses.length && !done) return { kind: "active" as const };
    return { kind: "empty" as const };
  });

  return (
    <div className="px-5 py-4">
      <p className="text-sm text-ink-soft">
        Break the 5-letter cipher. A clean solve buys{" "}
        <span className="font-medium text-teal-700">Initiative</span> — your orders strike first.
      </p>

      {/* grid */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        {rows.map((row, r) => (
          <motion.div
            key={r}
            animate={shake && row.kind === "active" ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.35 }}
            className="flex gap-1.5"
          >
            {Array.from({ length: WORD_LEN }, (_, i) => {
              let ch = "";
              let cls = TILE.empty;
              if (row.kind === "done") {
                ch = row.data.guess[i];
                cls = TILE[row.data.feedback[i]];
              } else if (row.kind === "active") {
                ch = input[i] ?? "";
                cls = ch ? TILE.active : TILE.empty;
              }
              return (
                <div
                  key={i}
                  className={`grid size-12 place-items-center rounded-lg border-2 text-xl font-bold uppercase transition-colors ${cls}`}
                >
                  {ch}
                </div>
              );
            })}
          </motion.div>
        ))}
      </div>

      {error && <p className="mt-3 text-center text-xs text-rose-500">{error}</p>}

      {done ? (
        <PuzzleResult
          solved={state.solved}
          tier={state.tier}
          successLabel={
            state.tier === 1
              ? "Flawless — First strike secured."
              : state.tier === 2
                ? "Solved — Early-mover advantage."
                : "Solved — Standard initiative."
          }
          failLabel="Cipher not broken. Your orders resolve last today."
        />
      ) : (
        <div className="mt-4 space-y-1.5">
          {ROWS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1">
              {ri === 2 && (
                <KeyBtn wide onClick={() => type("ENTER")} disabled={busy}>
                  <CornerDownLeft className="size-4" />
                </KeyBtn>
              )}
              {row.split("").map((ch) => (
                <KeyBtn key={ch} state={keyStates[ch]} onClick={() => type(ch)} disabled={busy}>
                  {ch}
                </KeyBtn>
              ))}
              {ri === 2 && (
                <KeyBtn wide onClick={() => type("BACK")} disabled={busy}>
                  <Delete className="size-4" />
                </KeyBtn>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KeyBtn({
  children,
  onClick,
  state,
  wide,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  state?: LetterState;
  wide?: boolean;
  disabled?: boolean;
}) {
  const cls =
    state === "correct"
      ? "bg-teal-500 text-white"
      : state === "present"
        ? "bg-amber-400 text-white"
        : state === "absent"
          ? "bg-surface-2 text-ink-faint"
          : "bg-line/70 text-ink hover:bg-line";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`grid h-11 place-items-center rounded-md text-sm font-semibold uppercase transition disabled:opacity-60 ${
        wide ? "px-3" : "w-8"
      } ${cls}`}
    >
      {children}
    </button>
  );
}
