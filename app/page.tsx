"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import GameMap from "@/components/GameMap";
import InitiativePuzzle from "@/components/puzzles/InitiativePuzzle";
import AuthOverlay from "@/components/AuthOverlay";
import PendingOrders from "@/components/PendingOrders";
import GameLog from "@/components/GameLog";
import { Brain, LogOut, Zap, Radio, Globe, Hammer, Play, Loader2 } from "lucide-react";

export default function Home() {
  const supabase = createClient();

  // -- AUTH STATE --
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // -- GAME DATA STATE --
  const [currentDay, setCurrentDay] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null); // Daily performance (wordle etc)
  const [orders, setOrders] = useState<any[]>([]); // Pending orders
  const [mapState, setMapState] = useState<any[]>([]); // Ownership & minds
  const [logs, setLogs] = useState<any[]>([]); // Battle logs
  const [countriesMeta, setCountriesMeta] = useState<any[]>([]); // Metadata for GII calc

  // -- UI STATE --
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false); // For Dev Button state

  // CENTRAL DATA FETCH
  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    // 1. Fetch Global Settings (The Day)
    const { data: dayData } = await supabase.from('global_settings').select('value').eq('key', 'current_day').single();
    const day = parseInt(dayData?.value || '1');
    setCurrentDay(day);

    // 2. Fetch User
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user && day) {
      // 3. Fetch Profile
      const { data: profileData } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      setProfile(profileData);

      // 4. Fetch Performance for THIS SPECIFIC DAY
      const { data: statsData } = await supabase.from("daily_performance").select("*").eq("user_id", user.id).eq("day_number", day).single();
      setStats(statsData || null);

      // 5. Fetch Orders for THIS DAY
      const { data: orderData } = await supabase.from("orders").select("*").eq("user_id", user.id).eq("day_number", day);
      if (orderData) setOrders(orderData);

      // 6. Fetch Map (Always current)
      const { data: mapData } = await supabase.from("map_state").select("*");
      if (mapData) setMapState(mapData);

      // 7. Fetch Metadata for GII (Continents)
      const { data: cMeta } = await supabase.from("countries").select("id, continent");
      if (cMeta) setCountriesMeta(cMeta);

      // 8. Fetch Logs
      const { data: logData } = await supabase.from("game_logs").select("*").order('created_at', { ascending: false });
      if (logData) setLogs(logData);
    }

    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --- GII CALCULATOR ---
  const calculateGII = () => {
    if (!mapState.length || !countriesMeta.length) return { score: 0, territory: 0, minds: 0 };

    // 1. My Countries
    const myCountries = mapState.filter((c: any) => c.owner_id === user?.id);
    const territoryScore = myCountries.length;

    // 2. My Minds
    const totalMinds = myCountries.reduce((sum: number, c: any) => sum + c.minds, 0);
    const mindScore = Math.floor(totalMinds / 3);

    // 3. Continents (Bonus)
    const myContinentCounts: Record<string, number> = {};
    myCountries.forEach((c: any) => {
      const meta = countriesMeta.find((m: any) => m.id === c.country_id);
      if (meta) {
        myContinentCounts[meta.continent] = (myContinentCounts[meta.continent] || 0) + 1;
      }
    });

    // Simple bonus logic (+5 per continent presence)
    const continents = Object.keys(myContinentCounts).length;
    const continentScore = continents * 5;

    return {
      score: territoryScore + mindScore + continentScore,
      territory: territoryScore,
      minds: totalMinds
    };
  };

  const gii = calculateGII();

  // --- DEV: FORCE RESOLUTION ---
  const handleDevEndDay = async () => {
    setResolving(true);
    try {
      await fetch('/api/dev/end-day', { method: 'POST' });
      await refreshData(true); // Refresh map to see results
    } catch (e) {
      console.error(e);
    }
    setResolving(false);
  };

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <span className="font-bold text-sm text-slate-400 uppercase tracking-widest">Establishing Uplink...</span>
      </div>
    </div>
  );

  if (!user) return <AuthOverlay />;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 pb-12">

      {showPuzzle && currentDay && (
        <InitiativePuzzle
          user={user}
          dayNumber={currentDay}
          onClose={() => setShowPuzzle(false)}
          onComplete={() => { setShowPuzzle(false); refreshData(true); }}
        />
      )}

      {/* NAV BAR */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
            <Brain className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl tracking-tight leading-none text-slate-900">BRAIN DRAIN</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Season 0 / Day {currentDay}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* DEV BUTTON */}
          <button
            onClick={handleDevEndDay}
            disabled={resolving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {resolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
            FORCE RESOLUTION
          </button>

          <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>

          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Operative</div>
            <div className="font-bold text-sm text-slate-800">{profile?.username || "Unknown"}</div>
          </div>
          <button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><LogOut className="w-5 h-5" /></button>
        </div>
      </nav>

      {/* 2-8-2 GRID */}
      <div className="max-w-[1920px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: ACTIONS & STATS */}
        <div className="lg:col-span-2 space-y-4">

          {/* Action Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Calibration</h2>
            <button
              onClick={() => !stats?.wordle_guesses && setShowPuzzle(true)}
              disabled={!!stats?.wordle_guesses}
              className={`w-full flex flex-col items-center justify-center text-center p-4 border rounded-xl transition-all group ${stats?.wordle_guesses ? "bg-teal-50 border-teal-200" : "bg-white border-slate-200 hover:border-teal-500 hover:shadow-md"}`}
            >
              <div className={`font-bold text-sm mb-1 ${stats?.wordle_guesses ? "text-teal-900" : "text-slate-800"}`}>Initiative</div>
              {stats?.wordle_guesses ? <div className="px-2 py-1 bg-teal-200 text-teal-800 text-[10px] font-bold rounded">{getInitiativeTier()}</div> : <span className="text-[10px] text-slate-400 group-hover:text-teal-600">Pending...</span>}
            </button>
          </div>

          {/* GII CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              Global Influence
            </h2>

            <div className="text-center mb-4">
              <div className="text-4xl font-black text-slate-900">{gii.score}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Index Score</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <div className="text-lg font-bold text-slate-700">{gii.territory}</div>
                <div className="text-[8px] text-slate-400 uppercase">Regions</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <div className="text-lg font-bold text-teal-600">{gii.minds}</div>
                <div className="text-[8px] text-slate-400 uppercase">Minds</div>
              </div>
            </div>
          </div>

        </div>

        {/* CENTER: MAP */}
        <div className="lg:col-span-8">
          <GameMap
            orders={orders}
            mapState={mapState}
            userId={user.id}
            currentDay={currentDay || 1} // <--- PASS IT HERE
            onRefresh={() => refreshData(true)}
          />
        </div>

        {/* RIGHT: COMMS & LOGS (Split) */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* 1. COMMS (Pending Orders) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden max-h-[400px]">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Radio className="w-4 h-4 text-slate-400" /> Comms</h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">{orders.length} Queued</div>
            </div>
            <div className="flex-1 p-3 overflow-y-auto bg-slate-50/30">
              <PendingOrders orders={orders} onUpdate={() => refreshData(true)} />
            </div>
          </div>

          {/* 2. LOGS (History) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-[300px]">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Hammer className="w-4 h-4 text-slate-400" /> Resolution Log</h2>
            </div>
            <div className="flex-1 p-3 overflow-y-auto">
              <GameLog logs={logs} />
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}