"use client";

import { Zap, Package, Crosshair, LoaderCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { PuzzleStatus } from "@/lib/game/puzzle-types";
import CipherPuzzle from "./CipherPuzzle";
import SupplyRunPuzzle from "./SupplyRunPuzzle";
import CipherBreakPuzzle from "./CipherBreakPuzzle";

export type PuzzleKind = "word" | "numbers" | "code";

const META: Record<PuzzleKind, { title: string; eyebrow: string; icon: React.ReactNode; accent: "teal" | "amber" | "rose" }> = {
  word: { title: "Cipher", eyebrow: "Initiative calibration", icon: <Zap className="size-5" />, accent: "teal" },
  numbers: { title: "Supply Run", eyebrow: "Economy calibration", icon: <Package className="size-5" />, accent: "amber" },
  code: { title: "Cipher Break", eyebrow: "Combat calibration", icon: <Crosshair className="size-5" />, accent: "rose" },
};

export default function PuzzleDock({
  open,
  status,
  onClose,
  onStatus,
}: {
  open: PuzzleKind | null;
  status: PuzzleStatus | null;
  onClose: () => void;
  onStatus: (s: PuzzleStatus) => void;
}) {
  const meta = open ? META[open] : null;

  return (
    <Modal
      open={!!open}
      onClose={onClose}
      title={meta?.title}
      eyebrow={meta ? `${meta.eyebrow} · Day ${status?.day ?? "—"}` : undefined}
      icon={meta?.icon}
      accent={meta?.accent}
    >
      {!status ? (
        <div className="grid place-items-center gap-2 px-5 py-16 text-ink-faint">
          <LoaderCircle className="size-6 animate-spin" />
          <p className="text-sm">Loading today&apos;s calibration…</p>
        </div>
      ) : open === "word" ? (
        <CipherPuzzle state={status.word} onStatus={onStatus} />
      ) : open === "numbers" ? (
        <SupplyRunPuzzle state={status.numbers} onStatus={onStatus} />
      ) : open === "code" ? (
        <CipherBreakPuzzle state={status.code} onStatus={onStatus} />
      ) : null}
    </Modal>
  );
}
