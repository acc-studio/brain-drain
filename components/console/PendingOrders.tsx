"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Swords, Compass, Send, X, Inbox } from "lucide-react";
import { REGION_BY_ID } from "@/lib/game/regions";
import type { OrderUI } from "./types";

const TYPE_META = {
  attack: { icon: Swords, cls: "text-rose-500" },
  explore: { icon: Compass, cls: "text-amber-600" },
  transfer: { icon: Send, cls: "text-teal-700" },
} as const;

export default function PendingOrders({
  orders,
  onCancel,
  onSelect,
}: {
  orders: OrderUI[];
  onCancel: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onSelect: (id: string) => void;
}) {
  const [cancelling, setCancelling] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <p className="bd-eyebrow">Queued orders</p>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium tabular-nums text-ink-soft">
          {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
          <Inbox className="size-5 text-ink-faint" />
          <p className="text-xs text-ink-soft">No orders queued for today.</p>
        </div>
      ) : (
        <ul className="flex-1 space-y-1.5 overflow-y-auto bd-panel-scroll px-3 py-3">
          <AnimatePresence initial={false}>
            {orders.map((o) => {
              const meta = TYPE_META[o.order_type];
              const Icon = meta.icon;
              const src = REGION_BY_ID[o.source_country_id]?.name ?? o.source_country_id;
              const tgt = REGION_BY_ID[o.target_country_id]?.name ?? o.target_country_id;
              return (
                <motion.li
                  key={o.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="group flex items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 py-2"
                >
                  <Icon className={`size-4 shrink-0 ${meta.cls}`} />
                  <button
                    type="button"
                    onClick={() => onSelect(o.source_country_id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-xs font-medium text-ink">
                      {src} → {tgt}
                    </p>
                    <p className="text-[11px] text-ink-faint">
                      {o.minds} {o.minds === 1 ? "Mind" : "Minds"}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label="Cancel order"
                    disabled={cancelling === o.id}
                    onClick={async () => {
                      setCancelling(o.id);
                      await onCancel(o.id);
                      setCancelling(null);
                    }}
                    className="grid size-6 shrink-0 place-items-center rounded-md text-ink-faint transition hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50"
                  >
                    <X className="size-3.5" />
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
