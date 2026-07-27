"use client";

import { Zap, Package, Crosshair, Lock, ChevronRight, type LucideIcon } from "lucide-react";
import type { PuzzleStatus, Tier } from "@/lib/game/puzzle-types";
import type { PuzzleKind } from "@/components/puzzles/PuzzleDock";

interface PillarStripProps {
  status: PuzzleStatus | null;
  onOpen: (kind: PuzzleKind) => void;
}

interface PillarMeta {
  kind: PuzzleKind;
  name: string;
  puzzle: string;
  icon: LucideIcon;
  accent: string; // text/border accent classes
  chip: string;
  effect: (tier: Tier) => string;
}

const PILLARS: PillarMeta[] = [
  {
    kind: "word",
    name: "Initiative",
    puzzle: "Cipher",
    icon: Zap,
    accent: "text-teal-700",
    chip: "bg-teal-50 text-teal-700",
    effect: (t) => (t === 1 ? "First strike" : t === 2 ? "Early move" : t === 3 ? "Standard order" : "Resolves last"),
  },
  {
    kind: "numbers",
    name: "Economy",
    puzzle: "Supply Run",
    icon: Package,
    accent: "text-amber-600",
    chip: "bg-amber-100 text-amber-600",
    effect: (t) => (t === 0 ? "No bonus supply" : `+${{ 1: 5, 2: 3, 3: 1 }[t]} bonus supply`),
  },
  {
    kind: "code",
    name: "Combat",
    puzzle: "Cipher Break",
    icon: Crosshair,
    accent: "text-rose-500",
    chip: "bg-rose-100 text-rose-600",
    effect: (t) => (t === 0 ? "No dice edge" : `+${{ 1: 2, 2: 1, 3: 0 }[t]} attack dice`),
  },
];

function TierDots({ tier }: { tier: Tier }) {
  const filled = tier === 0 ? 0 : 4 - tier; // T1→3, T2→2, T3→1
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`size-1.5 rounded-full ${i < filled ? "bg-current" : "bg-current/20"}`}
        />
      ))}
    </span>
  );
}

export default function PillarStrip({ status, onOpen }: PillarStripProps) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {PILLARS.map((p) => {
        const st = status
          ? p.kind === "word"
            ? status.word
            : p.kind === "numbers"
              ? status.numbers
              : status.code
          : null;
        const tier = (st?.tier ?? 0) as Tier;
        const done = !!st?.done;
        const attempts =
          st && "attempts" in st ? (st as { attempts: number }).attempts : 0;
        const maxAttempts =
          st && "maxAttempts" in st ? (st as { maxAttempts: number }).maxAttempts : 0;
        const Icon = p.icon;

        return (
          <button
            key={p.kind}
            type="button"
            onClick={() => onOpen(p.kind)}
            className="group relative flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left shadow-sm transition hover:border-line-strong hover:shadow-md"
          >
            <span className={`grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 ${p.accent}`}>
              <Icon className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-ink">{p.name}</span>
                {done && <Lock className="size-3 text-ink-faint" />}
              </div>
              <p className="truncate text-xs text-ink-soft">
                {status
                  ? done
                    ? p.effect(tier)
                    : maxAttempts
                      ? `Calibrating · ${attempts}/${maxAttempts}`
                      : "Awaiting calibration"
                  : "Loading…"}
              </p>
            </div>
            <div className={`flex flex-col items-end gap-1 ${p.accent}`}>
              {done && tier > 0 ? (
                <TierDots tier={tier} />
              ) : done ? (
                <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                  Failed
                </span>
              ) : (
                <ChevronRight className="size-4 text-ink-faint transition group-hover:translate-x-0.5" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
