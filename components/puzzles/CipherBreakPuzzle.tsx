"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Delete, Send, LoaderCircle } from "lucide-react";
import type { PuzzleStatus, CodeState } from "@/lib/game/puzzle-types";
import { submitGuess } from "./api";
import PuzzleResult from "./PuzzleResult";

// distinct hues for up to 6 palette symbols
const HUES = [188, 70, 300, 18, 145, 255];

function symbolStyle(palette: string[], sym: string) {
  const idx = Math.max(0, palette.indexOf(sym));
  const hue = HUES[idx % HUES.length];
  return {
    bg: `oklch(0.7 0.14 ${hue})`,
    ring: `oklch(0.55 0.14 ${hue})`,
    glyph: sym[0],
  };
}

export default function CipherBreakPuzzle({
  state,
  onStatus,
}: {
  state: CodeState;
  onStatus: (s: PuzzleStatus) => void;
}) {
  const [guess, setGuess] = useState<(string | null)[]>(Array(state.length).fill(null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = state.done;
  const full = guess.every((g) => g !== null);

  const place = (sym: string) => {
    if (done) return;
    setError(null);
    setGuess((g) => {
      const i = g.findIndex((x) => x === null);
      if (i === -1) return g;
      const next = [...g];
      next[i] = sym;
      return next;
    });
  };
  const clearSlot = (i: number) => {
    if (done) return;
    setGuess((g) => {
      const next = [...g];
      next[i] = null;
      return next;
    });
  };
  const backspace = () =>
    setGuess((g) => {
      const filled = g.map((x, i) => (x !== null ? i : -1)).filter((i) => i >= 0);
      if (!filled.length) return g;
      const next = [...g];
      next[filled[filled.length - 1]] = null;
      return next;
    });

  async function submit() {
    if (busy || done || !full) return;
    setBusy(true);
    setError(null);
    const res = await submitGuess({ kind: "code", guess: guess as string[] });
    setBusy(false);
    if (res.error) return setError(res.error);
    if (res.status) {
      onStatus(res.status);
      setGuess(Array(state.length).fill(null));
    }
  }

  const rows = Array.from({ length: state.maxAttempts }, (_, r) => {
    if (r < state.guesses.length) return { kind: "done" as const, data: state.guesses[r] };
    if (r === state.guesses.length && !done) return { kind: "active" as const };
    return { kind: "empty" as const };
  });

  return (
    <div className="px-5 py-4">
      <p className="text-sm text-ink-soft">
        Crack the {state.length}-symbol code. Pegs show hits:{" "}
        <span className="font-medium text-teal-700">teal</span> = right spot,{" "}
        <span className="font-medium text-amber-600">amber</span> = wrong spot. A fast crack sharpens{" "}
        <span className="font-medium text-rose-500">Combat</span>.
      </p>

      {/* rows */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        {rows.map((row, r) => (
          <div key={r} className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              {Array.from({ length: state.length }, (_, i) => {
                const sym =
                  row.kind === "done"
                    ? row.data.guess[i]
                    : row.kind === "active"
                      ? guess[i]
                      : null;
                if (sym) {
                  const st = symbolStyle(state.palette, sym);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => row.kind === "active" && clearSlot(i)}
                      className="grid size-11 place-items-center rounded-lg text-sm font-bold text-white ring-2"
                      style={{ background: st.bg, borderColor: st.ring, boxShadow: `inset 0 0 0 2px ${st.ring}` }}
                    >
                      {st.glyph}
                    </button>
                  );
                }
                return (
                  <div
                    key={i}
                    className={`grid size-11 place-items-center rounded-lg border-2 ${
                      row.kind === "active" ? "border-line-strong bg-surface" : "border-line bg-surface-2"
                    }`}
                  />
                );
              })}
            </div>
            {/* pegs */}
            <div className="grid w-8 grid-cols-2 gap-1">
              {Array.from({ length: state.length }, (_, i) => {
                let cls = "bg-line";
                if (row.kind === "done") {
                  if (i < row.data.pegs.exact) cls = "bg-teal-500";
                  else if (i < row.data.pegs.exact + row.data.pegs.present) cls = "bg-amber-400";
                }
                return <span key={i} className={`size-2.5 rounded-full ${cls}`} />;
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-center text-xs text-rose-500">{error}</p>}

      {done ? (
        <PuzzleResult
          solved={state.solved}
          tier={state.tier}
          successLabel={
            state.tier === 1
              ? "Cracked fast — +2 attack dice today."
              : state.tier === 2
                ? "Cracked — +1 attack dice today."
                : "Cracked — no dice edge, but decoded."
          }
          failLabel="Code held. No combat edge today."
        />
      ) : (
        <>
          {/* palette */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {state.palette.map((sym) => {
              const st = symbolStyle(state.palette, sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => place(sym)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-105"
                  style={{ background: st.bg }}
                >
                  <span className="grid size-5 place-items-center rounded bg-white/25">{st.glyph}</span>
                  {sym}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={backspace}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-2"
            >
              <Delete className="size-4" /> Back
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy || !full}
              className="flex flex-[1.6] items-center justify-center gap-1.5 rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50"
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
              Transmit guess
            </button>
          </div>
        </>
      )}
    </div>
  );
}
