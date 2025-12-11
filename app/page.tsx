"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import GameMap from "@/components/GameMap";
import InitiativePuzzle from "@/components/puzzles/InitiativePuzzle";
import AuthOverlay from "@/components/AuthOverlay";
import { Brain, Crosshair, Users, Lock, Check, LogOut } from "lucide-react";

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [loading, setLoading] = useState(true);

  // HARDCODED SEASON CONSTANT (For Phase 1)
  const CURRENT_DAY = 1;

  // 1. INITIALIZE DATA
  useEffect(() => {
    const init = async () => {
      // A. Check Auth Status
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // B. Fetch Profile (Username)
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        setProfile(profileData);

        // C. Fetch Daily Performance
        const { data: statsData } = await supabase
          .from("daily_performance")
          .select("*")
          .eq("user_id", user.id)
          .eq("day_number", CURRENT_DAY)
          .single();

        if (statsData) setStats(statsData);
      }
      setLoading(false);
    };
    init();
  }, []);

  // 2. HELPER: Calculate Initiative Tier
  const getInitiativeTier = () => {
    if (!stats?.wordle_guesses) return "Pending";
    if (stats.wordle_guesses <= 2) return "Tier 1 (Priority)";
    if (stats.wordle_guesses <= 4) return "Tier 2 (Standard)";
    return "Tier 3 (Lagged)";
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // 3. RENDER: LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-mono text-xs text-teal-500 uppercase tracking-widest">Establishing Uplink...</span>
        </div>
      </div>
    );
  }

  // 4. RENDER: AUTH OVERLAY (If not authenticated)
  // This replaces the old Google Login screen
  if (!user) {
    return <AuthOverlay />;
  }

  // 5. RENDER: THE DASHBOARD (Authenticated)
  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-100">

      {/* PUZZLE MODAL */}
      {showPuzzle && (
        <InitiativePuzzle
          user={user}
          dayNumber={CURRENT_DAY}
          onClose={() => setShowPuzzle(false)}
          onComplete={() => {
            setShowPuzzle(false);
            window.location.reload(); // Reload to fetch fresh stats
          }}
        />
      )}

      {/* TOP NAVIGATION BAR */}
      <nav className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
            <Brain className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-none">BRAIN DRAIN</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Season 0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Operative</div>
            <div className="font-mono font-bold text-sm text-slate-700">
              {profile?.username || "Unknown"}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 hover:border-red-100"
          >
            <LogOut className="w-3 h-3" />
            ABORT
          </button>
        </div>
      </nav>

      {/* MAIN LAYOUT GRID */}
      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: CONTROLS & STATS */}
        <div className="lg:col-span-3 space-y-6">

          {/* Action Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stats?.wordle_guesses ? "bg-green-500" : "bg-teal-500 animate-pulse"}`}></span>
              Daily Calibration
            </h2>

            <div className="space-y-3">

              {/* BUTTON 1: INITIATIVE PUZZLE */}
              <button
                onClick={() => !stats?.wordle_guesses && setShowPuzzle(true)}
                disabled={!!stats?.wordle_guesses}
                className={`w-full flex items-center justify-between p-3 border rounded-lg transition-all group relative overflow-hidden ${stats?.wordle_guesses
                    ? "bg-teal-50 border-teal-200 cursor-default"
                    : "bg-white border-slate-200 hover:border-teal-500 hover:shadow-md"
                  }`}
              >
                <div className="flex items-center gap-3 z-10">
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-lg ${stats?.wordle_guesses ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-500"
                    }`}>
                    A
                  </div>
                  <div className="text-left">
                    <div className={`font-bold text-sm ${stats?.wordle_guesses ? "text-teal-900" : "text-slate-700"}`}>
                      Initiative Protocol
                    </div>
                    <div className="text-[10px] text-slate-400">Wordle Clone</div>
                  </div>
                </div>

                {stats?.wordle_guesses ? (
                  <Check className="w-5 h-5 text-teal-600 z-10" />
                ) : (
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-medium z-10">Pending</span>
                )}
              </button>

              {/* TIER DISPLAY (Only shows if played) */}
              {stats?.wordle_guesses && (
                <div className="text-xs text-center text-teal-700 font-bold bg-teal-100/50 p-2 rounded border border-teal-100">
                  Status: {getInitiativeTier()}
                </div>
              )}

              {/* BUTTON 2: COMBAT TRIVIA (LOCKED) */}
              <button disabled className="w-full flex items-center justify-between p-3 bg-slate-100 border border-slate-200 rounded-lg opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center font-bold text-lg text-slate-400">
                    B
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-slate-500">Combat Power</div>
                    <div className="text-[10px] text-slate-400">Trivia Assessment</div>
                  </div>
                </div>
                <Lock className="w-4 h-4 text-slate-400" />
              </button>

            </div>
          </div>

          {/* Player Stats Card */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-lg relative overflow-hidden">
            {/* Decorative Background Blob */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl"></div>

            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 relative z-10">Global Influence</h2>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Territories</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="text-2xl font-bold text-teal-400">3</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Minds</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Order Queue Open until 00:00 UTC
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: THE MAP */}
        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-800">Strategic Theater</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <Users className="w-4 h-4" />
              <span>45 Regions Active</span>
            </div>
          </div>

          <GameMap />

          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex items-start gap-3">
            <div className="w-5 h-5 mt-0.5 flex-shrink-0 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">i</div>
            <p>
              <span className="font-bold block mb-1">Welcome to Day 1.</span>
              Before you can issue orders, you must complete the Initiative Protocol (Puzzle A) to determine your turn speed.
              Faster solutions = earlier execution priority at midnight.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}