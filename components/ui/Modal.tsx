"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  accent?: "teal" | "amber" | "rose";
  children: React.ReactNode;
  maxWidth?: string;
}

const ACCENT: Record<string, string> = {
  teal: "bg-teal-600",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export default function Modal({
  open,
  onClose,
  title,
  eyebrow,
  icon,
  accent = "teal",
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink/25 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`bd-card relative z-10 w-full ${maxWidth} overflow-hidden`}
          >
            {(title || eyebrow) && (
              <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-5 py-4">
                {icon && (
                  <span
                    className={`grid size-9 place-items-center rounded-xl ${ACCENT[accent]} text-white shadow-sm`}
                  >
                    {icon}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {eyebrow && <p className="bd-eyebrow">{eyebrow}</p>}
                  {title && (
                    <h2 className="truncate text-base font-semibold tracking-tight text-ink">
                      {title}
                    </h2>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid size-8 place-items-center rounded-lg text-ink-faint transition hover:bg-line/60 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            <div className="max-h-[80dvh] overflow-y-auto bd-panel-scroll">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
