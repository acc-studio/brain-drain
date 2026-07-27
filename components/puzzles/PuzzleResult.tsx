"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Tier } from "@/lib/game/puzzle-types";

export default function PuzzleResult({
  solved,
  tier,
  successLabel,
  failLabel,
}: {
  solved: boolean;
  tier: Tier;
  successLabel: string;
  failLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-4 flex items-center gap-3 rounded-xl border p-3.5 ${
        solved ? "border-teal-100 bg-teal-50" : "border-rose-100 bg-rose-100/60"
      }`}
    >
      {solved ? (
        <CheckCircle2 className="size-5 shrink-0 text-teal-600" />
      ) : (
        <XCircle className="size-5 shrink-0 text-rose-500" />
      )}
      <div className="min-w-0">
        <p className={`text-sm font-medium ${solved ? "text-teal-700" : "text-rose-600"}`}>
          {solved ? successLabel : failLabel}
        </p>
        {solved && (
          <p className="text-xs text-ink-soft">
            Tier {tier} locked in for today.
          </p>
        )}
      </div>
    </motion.div>
  );
}
