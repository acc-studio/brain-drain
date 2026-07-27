"use client";

import { Trophy, Crown } from "lucide-react";
import type { ScoreRowUI } from "./types";

export default function Scoreboard({
  rows,
  ownerHue,
}: {
  rows: ScoreRowUI[];
  ownerHue: Record<string, number>;
}) {
  const top = rows[0]?.gii ?? 1;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Trophy className="size-4 text-amber-500" />
        <p className="bd-eyebrow">Global Influence</p>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-ink-soft">
          The world is unclaimed. Enlist to appear on the board.
        </p>
      ) : (
        <ol className="space-y-1.5 px-3 py-3">
          {rows.map((r, i) => {
            const hue = ownerHue[r.playerId] ?? 210;
            return (
              <li
                key={r.playerId}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${
                  r.isMe ? "bg-teal-50 ring-1 ring-teal-100" : ""
                }`}
              >
                <span className="w-4 text-center text-xs font-semibold tabular-nums text-ink-faint">
                  {i + 1}
                </span>
                <span
                  className="size-2.5 shrink-0 rounded-full ring-2 ring-surface"
                  style={{ background: r.isMe ? "var(--color-teal-500)" : `oklch(0.66 0.15 ${hue})` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-medium text-ink">{r.username}</p>
                    {i === 0 && <Crown className="size-3 text-amber-500" />}
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(6, Math.round((r.gii / top) * 100))}%`,
                        background: r.isMe ? "var(--color-teal-500)" : `oklch(0.66 0.15 ${hue})`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-ink-faint">
                    {r.regions} regions · {r.minds} minds
                    {r.continents > 0 && ` · ${r.continents} continent${r.continents > 1 ? "s" : ""}`}
                  </p>
                </div>
                <span className="text-base font-bold tabular-nums text-ink">{r.gii}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
