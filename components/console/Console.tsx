"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, LogOut, Trophy, CalendarClock, Zap, LoaderCircle } from "lucide-react";
import WorldMap, { type MapCell } from "@/components/map/WorldMap";
import PillarStrip from "./PillarStrip";
import RegionPanel from "./RegionPanel";
import PendingOrders from "./PendingOrders";
import Scoreboard from "./Scoreboard";
import LogFeed from "./LogFeed";
import EnlistGate from "./EnlistGate";
import PuzzleDock, { type PuzzleKind } from "@/components/puzzles/PuzzleDock";
import { fetchStatus } from "@/components/puzzles/api";
import { queueOrder, cancelOrder, resolveNow } from "@/app/actions/game";
import { signOut } from "@/app/actions/auth";
import { COMBAT_BONUS_DICE } from "@/lib/game/constants";
import type { PuzzleStatus, Tier } from "@/lib/game/puzzle-types";
import type { OrderUI, LogUI, ScoreRowUI } from "./types";

interface ConsoleProps {
  currentUserId: string;
  username: string;
  day: number;
  board: MapCell[];
  orders: OrderUI[];
  logs: LogUI[];
  ownerHue: Record<string, number>;
  nameById: Record<string, string>;
  scoreboard: ScoreRowUI[];
  enlisted: boolean;
}

export default function Console(props: ConsoleProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<PuzzleStatus | null>(null);
  const [openPuzzle, setOpenPuzzle] = useState<PuzzleKind | null>(null);
  const [resolving, setResolving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const loadStatus = useCallback(async () => {
    const s = await fetchStatus();
    setStatus(s);
  }, []);

  useEffect(() => {
    if (props.enlisted) loadStatus();
  }, [props.enlisted, loadStatus, props.day]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const myScore = props.scoreboard.find((r) => r.isMe);
  const targetedIds = useMemo(
    () => new Set(props.orders.map((o) => o.target_country_id)),
    [props.orders],
  );
  const committedFromSource = useMemo(
    () =>
      selectedId
        ? props.orders
            .filter((o) => o.source_country_id === selectedId)
            .reduce((s, o) => s + o.minds, 0)
        : 0,
    [props.orders, selectedId],
  );
  const bonusDice = COMBAT_BONUS_DICE[(status?.code.tier ?? 0) as Tier];

  const handleQueue = useCallback(
    async (target: string, minds: number, orderType: "transfer" | "explore" | "attack") => {
      const res = await queueOrder({ source: selectedId!, target, minds, orderType });
      if (res.ok) router.refresh();
      return res;
    },
    [selectedId, router],
  );

  const handleCancel = useCallback(
    async (id: string) => {
      const res = await cancelOrder(id);
      if (res.ok) router.refresh();
      return res;
    },
    [router],
  );

  async function handleResolve() {
    setResolving(true);
    const res = await resolveNow();
    setResolving(false);
    if (res.ok) {
      setToast({ msg: "Day resolved — new orders await.", ok: true });
      router.refresh();
      loadStatus();
    } else {
      setToast({ msg: res.error ?? "Resolution failed.", ok: false });
    }
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* ── full-screen map (base layer) ──────────────── */}
      <div className="absolute inset-0 z-0">
        <WorldMap
          board={props.board}
          ownerHue={props.ownerHue}
          currentUserId={props.currentUserId}
          selectedId={selectedId}
          targetedIds={targetedIds}
          onSelectRegion={setSelectedId}
        />
      </div>

      {/* ── header (floating) ─────────────────────────── */}
      <header className="absolute inset-x-0 top-0 z-30 border-b border-line/60 bg-surface/70 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-teal-600 text-white shadow-sm">
            <Radio className="size-5" />
          </span>
          <div className="mr-1">
            <p className="bd-eyebrow leading-none">Command Console</p>
            <h1 className="text-base font-semibold leading-tight tracking-tight text-ink">
              Brain Drain
            </h1>
          </div>

          <Chip icon={<CalendarClock className="size-3.5" />} label="Day" value={props.day} />
          <Chip
            icon={<Trophy className="size-3.5 text-amber-500" />}
            label="Your GII"
            value={myScore?.gii ?? 0}
          />

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleResolve}
              disabled={resolving}
              title="Force-resolve the current day (admin/dev only)"
              className="hidden items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-surface-2 disabled:opacity-50 sm:flex"
            >
              {resolving ? <LoaderCircle className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
              Resolve day
            </button>
            <span className="hidden text-sm font-medium text-ink sm:block">{props.username}</span>
            <button
              type="button"
              onClick={() => signOut()}
              aria-label="Sign out"
              className="grid size-9 place-items-center rounded-lg text-ink-faint transition hover:bg-line/60 hover:text-ink"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── pillar strip (floating, top-centre) ───────── */}
      <div className="pointer-events-none absolute inset-x-0 top-[60px] z-20 hidden justify-center px-4 lg:flex">
        <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-line/60 bg-surface/80 p-1 shadow-float backdrop-blur-md">
          <PillarStrip status={status} onOpen={setOpenPuzzle} />
        </div>
      </div>

      {/* ── left column (region + orders) ─────────────── */}
      <div className="absolute bottom-3 left-3 top-[60px] z-20 flex w-[336px] max-w-[calc(100vw-1.5rem)] flex-col gap-3">
        <div className="bd-card shrink-0 overflow-hidden border-line/60 bg-surface/85 backdrop-blur-md">
          <RegionPanel
            selectedId={selectedId}
            board={props.board}
            currentUserId={props.currentUserId}
            nameById={props.nameById}
            committedFromSource={committedFromSource}
            bonusDice={bonusDice}
            onQueue={handleQueue}
          />
        </div>
        <div className="bd-card min-h-[10rem] flex-1 overflow-hidden border-line/60 bg-surface/85 backdrop-blur-md">
          <PendingOrders orders={props.orders} onCancel={handleCancel} onSelect={setSelectedId} />
        </div>
      </div>

      {/* ── right column (scoreboard + log) ───────────── */}
      <div className="absolute bottom-3 right-3 top-[60px] z-20 hidden w-[320px] flex-col gap-3 md:flex">
        <div className="bd-card shrink-0 overflow-hidden border-line/60 bg-surface/85 backdrop-blur-md">
          <Scoreboard rows={props.scoreboard} ownerHue={props.ownerHue} />
        </div>
        <div className="bd-card min-h-[10rem] flex-1 overflow-hidden border-line/60 bg-surface/85 backdrop-blur-md">
          <LogFeed logs={props.logs} />
        </div>
      </div>

      {/* ── overlays ───────────────────────────────────── */}
      {!props.enlisted && <EnlistGate />}
      <PuzzleDock
        open={openPuzzle}
        status={status}
        onClose={() => setOpenPuzzle(null)}
        onStatus={setStatus}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-float ${
              toast.ok ? "bg-teal-600" : "bg-rose-500"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <span className="hidden items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 sm:flex">
      {icon}
      <span className="bd-eyebrow">{label}</span>
      <span className="text-sm font-bold tabular-nums text-ink">{value}</span>
    </span>
  );
}
