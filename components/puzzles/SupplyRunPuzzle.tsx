"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Delete, Eraser, Lock, LoaderCircle } from "lucide-react";
import type { PuzzleStatus, NumbersState, Tier } from "@/lib/game/puzzle-types";
import { evaluateExpression } from "@/lib/game/numbers-eval";
import { numbersTierFromDelta } from "@/lib/game/constants";
import { submitGuess } from "./api";

interface Item {
  t: string;
  idx?: number; // pool index this number came from (undefined for operators)
}

const OPS = ["+", "−", "×", "÷", "(", ")"];

function tierBlurb(tier: Tier): { label: string; cls: string } {
  switch (tier) {
    case 1:
      return { label: "On target · +5 supply", cls: "text-teal-700" };
    case 2:
      return { label: "Within 5 · +3 supply", cls: "text-teal-700" };
    case 3:
      return { label: "Within 25 · +1 supply", cls: "text-amber-600" };
    default:
      return { label: "Too far · no bonus supply", cls: "text-rose-500" };
  }
}

export default function SupplyRunPuzzle({
  state,
  onStatus,
}: {
  state: NumbersState;
  onStatus: (s: PuzzleStatus) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = state.done;
  const usedIdx = useMemo(
    () => new Set(items.filter((i) => i.idx !== undefined).map((i) => i.idx!)),
    [items],
  );

  const evalRes = useMemo(
    () => evaluateExpression(items.map((i) => i.t), state.pool),
    [items, state.pool],
  );
  const value = evalRes.ok && evalRes.value !== undefined ? Math.round(evalRes.value) : null;
  const delta = value !== null ? value - state.target : null;
  const liveTier = delta !== null ? numbersTierFromDelta(delta) : null;

  const push = (item: Item) => {
    if (done) return;
    setError(null);
    setItems((s) => [...s, item]);
  };
  const backspace = () => setItems((s) => s.slice(0, -1));
  const clear = () => setItems([]);

  async function lockIn() {
    if (busy || done) return;
    if (!evalRes.ok) {
      setError(evalRes.error ?? "Finish your expression first.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await submitGuess({ kind: "numbers", expression: items.map((i) => i.t) });
    setBusy(false);
    if (res.error) return setError(res.error);
    if (res.status) onStatus(res.status);
  }

  return (
    <div className="px-5 py-4">
      <p className="text-sm text-ink-soft">
        Hit the target from the pool with + − × ÷. Precision buys{" "}
        <span className="font-medium text-amber-600">bonus supply</span> to your frontline.
      </p>

      {/* target + current */}
      <div className="mt-4 flex items-stretch gap-3">
        <div className="flex-1 rounded-xl border border-line bg-surface-2 p-3 text-center">
          <p className="bd-eyebrow">Target</p>
          <p className="text-3xl font-bold tabular-nums text-ink">{state.target}</p>
        </div>
        <div className="flex-1 rounded-xl border border-line bg-surface-2 p-3 text-center">
          <p className="bd-eyebrow">Your result</p>
          <p
            className={`text-3xl font-bold tabular-nums ${
              value === null ? "text-ink-faint" : delta === 0 ? "text-teal-700" : "text-ink"
            }`}
          >
            {value ?? "—"}
          </p>
        </div>
      </div>

      {done ? (
        <ResultBlock state={state} />
      ) : (
        <>
          {/* expression display */}
          <div className="mt-3 flex min-h-11 flex-wrap items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-2">
            {items.length === 0 ? (
              <span className="text-sm text-ink-faint">Build an expression…</span>
            ) : (
              items.map((it, i) => (
                <span
                  key={i}
                  className={`rounded-md px-1.5 py-0.5 font-mono text-sm ${
                    it.idx !== undefined ? "bg-amber-100 text-amber-600" : "text-ink-soft"
                  }`}
                >
                  {it.t}
                </span>
              ))
            )}
          </div>

          {delta !== null && liveTier !== null && (
            <p className={`mt-2 text-xs font-medium ${tierBlurb(liveTier).cls}`}>
              {delta === 0 ? "Exact hit! " : `Δ ${delta > 0 ? "+" : ""}${delta} · `}
              {tierBlurb(liveTier).label}
            </p>
          )}
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}

          {/* number tiles */}
          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {state.pool.map((n, idx) => {
              const used = usedIdx.has(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={used}
                  onClick={() => push({ t: String(n), idx })}
                  className={`grid h-12 place-items-center rounded-lg border-2 text-base font-bold tabular-nums transition ${
                    used
                      ? "cursor-not-allowed border-line bg-surface-2 text-ink-faint/40"
                      : "border-amber-400/40 bg-amber-100/50 text-amber-600 hover:border-amber-400 hover:bg-amber-100"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>

          {/* operators */}
          <div className="mt-1.5 grid grid-cols-6 gap-1.5">
            {OPS.map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => push({ t: op })}
                className="grid h-10 place-items-center rounded-lg bg-line/70 text-base font-semibold text-ink transition hover:bg-line"
              >
                {op}
              </button>
            ))}
          </div>

          {/* controls */}
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
              onClick={clear}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-2"
            >
              <Eraser className="size-4" /> Clear
            </button>
            <button
              type="button"
              onClick={lockIn}
              disabled={busy || items.length === 0}
              className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Lock in
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-faint">
            One submission per day — lock in your best result.
          </p>
        </>
      )}
    </div>
  );
}

function ResultBlock({ state }: { state: NumbersState }) {
  const delta = state.result !== null ? state.result - state.target : null;
  const blurb = tierBlurb(state.tier);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-4 rounded-xl border p-3.5 ${
        state.tier > 0 ? "border-teal-100 bg-teal-50" : "border-rose-100 bg-rose-100/60"
      }`}
    >
      <p className={`text-sm font-medium ${blurb.cls}`}>{blurb.label}</p>
      <p className="mt-1 font-mono text-xs text-ink-soft">
        {(state.expression ?? []).join(" ")} = {state.result}
        {delta !== null && delta !== 0 && ` (Δ ${delta > 0 ? "+" : ""}${delta})`}
      </p>
    </motion.div>
  );
}
