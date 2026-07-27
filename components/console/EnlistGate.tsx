"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Flag, LoaderCircle, Globe2 } from "lucide-react";
import { enlist } from "@/app/actions/game";

export default function EnlistGate() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setBusy(true);
    setError(null);
    const res = await enlist();
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Enlistment failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/25 backdrop-blur-sm" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bd-card relative z-10 w-full max-w-md p-7 text-center"
      >
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal-600 text-white shadow-sm">
          <Globe2 className="size-6" />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">Report for duty</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">
          Command will assign you a foothold on the map. From there, calibrate daily and expand
          your influence across the world.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-600">{error}</p>
        )}

        <button
          type="button"
          onClick={claim}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
        >
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Flag className="size-4" />}
          Claim starting region
        </button>
      </motion.div>
    </div>
  );
}
