"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  ArrowRight,
  Swords,
  Compass,
  Send,
  LoaderCircle,
  Info,
} from "lucide-react";
import { REGION_BY_ID, CONTINENT_BY_ID } from "@/lib/game/regions";
import { estimateWinChance } from "@/lib/game/combat";
import type { MapCell } from "@/components/map/WorldMap";

type OrderType = "transfer" | "explore" | "attack";

interface RegionPanelProps {
  selectedId: string | null;
  board: MapCell[];
  currentUserId: string;
  nameById: Record<string, string>;
  committedFromSource: number;
  bonusDice: number;
  onQueue: (target: string, minds: number, orderType: OrderType) => Promise<{ ok: boolean; error?: string }>;
}

export default function RegionPanel({
  selectedId,
  board,
  currentUserId,
  nameById,
  committedFromSource,
  bonusDice,
  onQueue,
}: RegionPanelProps) {
  const cellById = useMemo(() => new Map(board.map((c) => [c.country_id, c])), [board]);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [minds, setMinds] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cell = selectedId ? cellById.get(selectedId) : undefined;
  const region = selectedId ? REGION_BY_ID[selectedId] : undefined;
  const isMine = cell?.owner_id === currentUserId;
  const available = Math.max(0, (cell?.minds ?? 0) - 1 - committedFromSource);

  useEffect(() => {
    setTargetId(null);
    setError(null);
    setMinds(1);
  }, [selectedId]);

  useEffect(() => {
    setMinds((m) => Math.min(Math.max(1, m), Math.max(1, available)));
  }, [available, targetId]);

  if (!region || !cell) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
        <span className="grid size-11 place-items-center rounded-xl bg-surface-2 text-ink-faint">
          <MapPin className="size-5" />
        </span>
        <p className="text-sm font-medium text-ink">No region selected</p>
        <p className="max-w-[16rem] text-xs text-ink-soft">
          Tap a region on the map to inspect it, or select one you control to move Minds.
        </p>
      </div>
    );
  }

  const continent = CONTINENT_BY_ID[region.continent];
  const ownerLabel = cell.owner_id
    ? isMine
      ? "You"
      : nameById[cell.owner_id] ?? "Rival operative"
    : "Neutral";

  const target = targetId ? cellById.get(targetId) : undefined;
  const targetRegion = targetId ? REGION_BY_ID[targetId] : undefined;
  const orderType: OrderType = !target
    ? "transfer"
    : target.owner_id === currentUserId
      ? "transfer"
      : target.owner_id === null
        ? "explore"
        : "attack";

  const winChance =
    target && orderType === "attack"
      ? estimateWinChance(minds, target.minds, bonusDice, 400)
      : null;
  const annexOk = target && orderType === "explore" ? minds >= target.minds : null;

  async function submit() {
    if (!targetId) return;
    setBusy(true);
    setError(null);
    const res = await onQueue(targetId, minds, orderType);
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Order rejected.");
    else {
      setTargetId(null);
      setMinds(1);
    }
  }

  return (
    <div className="px-4 py-4">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="bd-eyebrow">{continent?.name ?? region.continent}</p>
          <h3 className="truncate text-lg font-semibold tracking-tight text-ink">{region.name}</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-ink">{cell.minds}</p>
          <p className="bd-eyebrow">Minds</p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isMine
              ? "bg-teal-50 text-teal-700"
              : cell.owner_id
                ? "bg-rose-100 text-rose-600"
                : "bg-surface-2 text-ink-soft"
          }`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {ownerLabel}
        </span>
        {isMine && (
          <span className="text-xs text-ink-faint">
            {available} deployable · 1 holds
          </span>
        )}
      </div>

      {/* order composer */}
      {isMine ? (
        <div className="mt-4">
          <p className="bd-eyebrow mb-2">Issue order — pick a target</p>
          <div className="flex flex-wrap gap-1.5">
            {region.connections.map((cid) => {
              const tc = cellById.get(cid);
              const tr = REGION_BY_ID[cid];
              if (!tc || !tr) return null;
              const mine = tc.owner_id === currentUserId;
              const neutral = tc.owner_id === null;
              const active = cid === targetId;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => setTargetId(active ? null : cid)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-100"
                      : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      mine ? "bg-teal-500" : neutral ? "bg-ink-faint/50" : "bg-rose-500"
                    }`}
                  />
                  {tr.name}
                  <span className="tabular-nums text-ink-faint">{tc.minds}</span>
                </button>
              );
            })}
          </div>

          {targetId && targetRegion && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-line bg-surface-2 p-3.5"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <span className="truncate">{region.name}</span>
                <ArrowRight className="size-4 shrink-0 text-ink-faint" />
                <span className="truncate">{targetRegion.name}</span>
                <span
                  className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    orderType === "attack"
                      ? "bg-rose-100 text-rose-600"
                      : orderType === "explore"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-teal-50 text-teal-700"
                  }`}
                >
                  {orderType === "attack" ? (
                    <Swords className="size-3" />
                  ) : orderType === "explore" ? (
                    <Compass className="size-3" />
                  ) : (
                    <Send className="size-3" />
                  )}
                  {orderType}
                </span>
              </div>

              {/* minds slider */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-ink-soft">
                  <span>Commit Minds</span>
                  <span className="tabular-nums font-semibold text-ink">{minds}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, available)}
                  value={minds}
                  disabled={available < 1}
                  onChange={(e) => setMinds(parseInt(e.target.value, 10))}
                  className="mt-1.5 w-full accent-teal-600"
                />
              </div>

              {/* outcome preview */}
              {orderType === "attack" && winChance !== null && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-soft">Estimated win chance</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        winChance >= 0.6 ? "text-teal-700" : winChance >= 0.35 ? "text-amber-600" : "text-rose-500"
                      }`}
                    >
                      {Math.round(winChance * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className={`h-full rounded-full ${
                        winChance >= 0.6 ? "bg-teal-500" : winChance >= 0.35 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.round(winChance * 100)}%` }}
                    />
                  </div>
                  {bonusDice > 0 && (
                    <p className="mt-1 text-[11px] text-ink-faint">Includes +{bonusDice} Combat dice.</p>
                  )}
                </div>
              )}
              {orderType === "explore" && (
                <p className={`mt-3 text-xs ${annexOk ? "text-teal-700" : "text-amber-600"}`}>
                  {annexOk
                    ? `Annexes ${targetRegion.name} · converts ${Math.floor(target!.minds / 2)} locals.`
                    : `Need ≥ ${target!.minds} to annex — a weaker probe withdraws.`}
                </p>
              )}
              {orderType === "transfer" && (
                <p className="mt-3 text-xs text-ink-soft">Reinforces your own region.</p>
              )}

              {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}

              <button
                type="button"
                onClick={submit}
                disabled={busy || available < 1}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"
              >
                {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                Queue order
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-surface-2 p-3 text-xs text-ink-soft">
          <Info className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
          <p>
            You don&apos;t control {region.name}. Select an adjacent region you own to move against it.
          </p>
        </div>
      )}
    </div>
  );
}
