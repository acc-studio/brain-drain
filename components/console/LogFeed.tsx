"use client";

import { motion } from "framer-motion";
import { Swords, Flag, Coins, Radio, ScrollText } from "lucide-react";
import type { LogUI } from "./types";

const TYPE_META = {
  combat: { icon: Swords, cls: "text-rose-500", ring: "bg-rose-100" },
  conquest: { icon: Flag, cls: "text-teal-700", ring: "bg-teal-50" },
  economy: { icon: Coins, cls: "text-amber-600", ring: "bg-amber-100" },
  info: { icon: Radio, cls: "text-ink-soft", ring: "bg-surface-2" },
} as const;

export default function LogFeed({ logs }: { logs: LogUI[] }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-4 pt-4">
        <ScrollText className="size-4 text-ink-faint" />
        <p className="bd-eyebrow">Field comms</p>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 py-8 text-center">
          <p className="text-xs text-ink-soft">
            No transmissions yet. Resolve a day to receive intel.
          </p>
        </div>
      ) : (
        <ul className="flex-1 space-y-2.5 overflow-y-auto bd-panel-scroll px-4 py-3">
          {logs.map((l, i) => {
            const meta = TYPE_META[l.type] ?? TYPE_META.info;
            const Icon = meta.icon;
            return (
              <motion.li
                key={l.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.02 }}
                className="flex gap-2.5"
              >
                <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md ${meta.ring} ${meta.cls}`}>
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs leading-relaxed text-ink-soft">{l.message}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
                    Day {l.day_number}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
