"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, LoaderCircle, ShieldCheck, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerOperative } from "./actions";

type Mode = "login" | "enlist";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "enlist") {
        const res = await registerOperative({ email, password, username, accessCode });
        if (!res.ok) {
          setError(res.error ?? "Enlistment failed.");
          return;
        }
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-4 sm:p-6">
      {/* ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--color-teal-100), transparent 40%) 0%, transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="bd-card w-full max-w-md overflow-hidden"
      >
        {/* header */}
        <div className="relative border-b border-line bg-surface-2 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white shadow-sm">
              <Radio className="size-5" />
            </span>
            <div>
              <p className="bd-eyebrow">Encrypted Channel</p>
              <h1 className="text-lg font-semibold tracking-tight text-ink">Brain Drain</h1>
            </div>
          </div>
        </div>

        {/* tab switch */}
        <div className="grid grid-cols-2 gap-1 p-1.5">
          {(["login", "enlist"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mode === m ? "text-teal-700" : "text-ink-faint hover:text-ink-soft"
              }`}
            >
              {mode === m && (
                <motion.span
                  layoutId="authTab"
                  className="absolute inset-0 -z-10 rounded-lg bg-teal-50"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {m === "login" ? "Sign in" : "Enlist"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 px-6 pb-6 pt-2">
          <AnimatePresence initial={false}>
            {mode === "enlist" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Field
                  label="Callsign"
                  value={username}
                  onChange={setUsername}
                  placeholder="ghost-01"
                  autoComplete="username"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="operative@agency.gov"
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          <AnimatePresence initial={false}>
            {mode === "enlist" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Field
                  label="Access code"
                  value={accessCode}
                  onChange={setAccessCode}
                  placeholder="issued by command"
                  icon={<KeyRound className="size-4" />}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-600"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {mode === "login" ? "Enter the console" : "Request clearance"}
          </button>
        </form>
      </motion.div>

      <p className="mt-5 max-w-md text-center text-xs text-ink-faint">
        A daily asynchronous conquest. Solve your calibration, command your Minds, hold the world.
      </p>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="bd-eyebrow mb-1.5 block">{label}</span>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className={`w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 ${
            icon ? "pl-9" : ""
          }`}
        />
      </div>
    </label>
  );
}
