"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import GameMap from "@/components/GameMap";
import InitiativePuzzle from "@/components/puzzles/InitiativePuzzle";
import AuthOverlay from "@/components/AuthOverlay";
import { Brain, Crosshair, Users, Lock, Check, LogOut, Activity, Globe, Zap } from "lucide-react";

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [loading, setLoading] = useState(true);

  const CURRENT_DAY = 1;

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("username").eq("id", user.id).single();
        setProfile(profileData);
        const { data: statsData } = await supabase.from("daily_performance").select("*").eq("user_id", user.id).eq("day_number", CURRENT_DAY).single();
        if (statsData) setStats(statsData);
      }
      setLoading(false);
    };
    init();
  }, []);

  const getInitiativeTier = () => {
    if (!stats?.wordle_guesses) return "Pending";
    if (stats.wordle_guesses <= 2) return "Tier 1 (Fast)";
    if (stats.wordle_guesses <= 4) return "Tier 2 (Normal)";
    return "Tier 3 (Slow)";
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
          <span className="font-bold text-sm text-slate-400 uppercase tracking-widest">Loading Intelligence...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthOverlay />;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 pb-12">

      {showPuzzle && (
        <InitiativePuzzle
          user={user}
          dayNumber={CURRENT_DAY}
          onClose={() => setShowPuzzle(false)}
          onComplete={() => {
            setShowPuzzle(false);
            window.location.reload();
          }}
        />
      )}

      {/* NAV BAR */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform">
            <Brain className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl tracking-tight leading-none text-slate-900">BRAIN DRAIN</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Season 0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Operative</div>
            <div className="font-bold text-sm text-slate-800">
              {profile?.username || "Unknown"}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* 3-COLUMN LAYOUT: 2 cols - 8 cols - 2 cols */}
      <div className="max-w-[1920px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: ACTIONS (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Card 1: Daily Calibration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Daily Calibration
            </h2>
            <div className="space-y-3">
              {/* Initiative Button */}
              <button
                onClick={() => !stats?.wordle_guesses && setShowPuzzle(true)}
                disabled={!!stats?.wordle_guesses}
                className={`w-full flex flex-col items-center justify-center text-center p-4 border rounded-xl transition-all group ${stats?.wordle_guesses
                  ? "bg-teal-50 border-teal-200"
                  : "bg-white border-slate-200 hover:border-teal-500 hover:shadow-md"
                  }`}
              >
                <div className={`font-bold text-sm mb-1 ${stats?.wordle_guesses ? "text-teal-900" : "text-slate-800"}`}>
                  Initiative
                </div>
                {stats?.wordle_guesses ? (
                  <div className="px-2 py-1 bg-teal-200 text-teal-800 text-[10px] font-bold rounded">
                    {getInitiativeTier()}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 group-hover:text-teal-600">Pending...</span>
                )}
              </button>

              {/* Trivia Button */}
              <button disabled className="w-full flex flex-col items-center justify-center text-center p-4 bg-slate-50 border border-slate-200 rounded-xl opacity-60 cursor-not-allowed">
                <div className="font-bold text-sm text-slate-500">Combat Power</div>
                <Lock className="w-4 h-4 text-slate-400 mt-1" />
              </button>
            </div>
          </div>

          {/* Card 2: Global Influence */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              Influence
            </h2>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="text-2xl font-extrabold text-slate-900">0</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold mt-1">Territories</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="text-2xl font-extrabold text-teal-600">3</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold mt-1">Minds</div>
              </div>
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: THE MAP (8 Cols - Massive) */}
        <div className="lg:col-span-8">
          <GameMap />
        </div>

        {/* RIGHT COLUMN: ACTIVITY LOG (2 Cols) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl h-[850px] shadow-sm flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                Feed
              </h2>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {/* Logs compacted for narrower column */}
              <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                  <span className="text-[10px] font-bold text-slate-500">00:00 UTC</span>
                </div>
                <div className="text-xs text-slate-800 font-medium pl-3.5">
                  Season 0 Initialized.
                </div>
              </div>

              <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                  <span className="text-[10px] font-bold text-teal-600">00:01 UTC</span>
                </div>
                <div className="text-xs text-slate-600 pl-3.5">
                  Map topology scan complete.
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100 text-[11px] text-blue-800 leading-tight">
                <strong>Briefing:</strong> Solve the Initiative Puzzle to calibrate your turn order.
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}