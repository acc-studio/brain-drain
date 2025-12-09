import GameMap from "@/components/GameMap";
import { Brain, Crosshair, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-100">
      {/* Top Bar */}
      <nav className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-none">BRAIN DRAIN</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Season 0</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Server Time</div>
            <div className="font-mono font-bold text-lg">00:00 UTC</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200"></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-3 space-y-6">

          {/* Action Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Daily Tasks</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-teal-500 hover:shadow-md transition-all group">
                <span className="font-bold text-slate-700 group-hover:text-teal-600">Initiative Puzzle</span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Pending</span>
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-orange-500 hover:shadow-md transition-all group">
                <span className="font-bold text-slate-700 group-hover:text-orange-600">Combat Trivia</span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Pending</span>
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-lg">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Global Influence</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-xs text-slate-400">Territories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-teal-400">3</div>
                <div className="text-xs text-slate-400">Total Minds</div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: The Map */}
        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-slate-400" />
              Strategic Theater
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>45 Regions Active</span>
            </div>
          </div>

          <GameMap />

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 flex items-center gap-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            System Message: Welcome to Day 1. Complete your puzzles to generate combat initiative.
          </div>
        </div>

      </div>
    </main>
  );
}