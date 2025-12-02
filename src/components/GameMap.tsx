"use client";

import { CombinedCountryData } from "@/types/game";
import { useState } from "react";
import { MAP_PATHS } from "./MapPaths";
import OrderPopup from "./OrderForm"; // Make sure this matches your file name

interface GameMapProps {
    countries: CombinedCountryData[];
}

export default function GameMap({ countries }: GameMapProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [target, setTarget] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Helper to find data for a specific country ID
    const getCountry = (id: string) => countries.find((c) => c.country_id === id);

    // LOGIC: Click handling
    const handleCountryClick = (clickedId: string) => {
        // 1. If nothing selected, just select the clicked country
        if (!selected) {
            setSelected(clickedId);
            return;
        }

        // 2. If clicking the ALREADY selected country, deselect everything
        if (selected === clickedId) {
            setSelected(null);
            setTarget(null);
            return;
        }

        // 3. If clicking a DIFFERENT country, check if it is a neighbor
        const originCountry = getCountry(selected);

        if (originCountry?.adjacencies.includes(clickedId)) {
            setTarget(clickedId); // Trigger the modal
        } else {
            setSelected(clickedId); // Switch selection
            setTarget(null);
        }
    };

    // LOGIC: Color coding
    const getFillColor = (ownerId: string | null) => {
        if (!ownerId) return "#334155"; // Neutral Slate
        return "#3b82f6"; // Player Blue
    };

    // NEW LOGIC: Trigger the API Engine
    const handleEndTurn = async () => {
        if (!confirm("Are you sure? This will resolve all queued orders.")) return;

        setLoading(true);
        try {
            const res = await fetch("/api/resolve-turn");
            const data = await res.json();
            alert(data.message);
            window.location.reload(); // Refresh page to see new troop positions
        } catch (err) {
            console.error(err);
            alert("Failed to resolve turn");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-2 relative">

            {/* HEADER & DEV TOOLS */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-white text-2xl font-black tracking-tight">WORLD MAP</h2>
                    <p className="text-slate-400 text-sm">Season 0: Alpha</p>
                </div>

                <button
                    onClick={handleEndTurn}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-full font-bold shadow-lg border border-purple-400 transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? "PROCESSING..." : "⚡ FORCE END DAY"}
                </button>
            </div>

            {/* ORDER MODAL */}
            {selected && target && (
                <OrderPopup
                    origin={getCountry(selected) || null}
                    target={getCountry(target)!}
                    onClose={() => {
                        setTarget(null);
                        setSelected(null);
                    }}
                />
            )}

            <div className="flex flex-col md:flex-row gap-4">

                {/* MAP VISUALS */}
                <div className="flex-grow relative z-10">
                    <svg viewBox="0 0 800 500" className="w-full h-auto bg-slate-900 rounded-xl border border-slate-700 shadow-2xl">
                        {Object.entries(MAP_PATHS).map(([id, pathData]) => {
                            const countryData = getCountry(id);
                            const isSelected = selected === id;
                            const isNeighbor = selected
                                ? getCountry(selected)?.adjacencies.includes(id)
                                : false;

                            return (
                                <g
                                    key={id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCountryClick(id);
                                    }}
                                    className={`cursor-pointer transition-all duration-200 ${isNeighbor ? 'hover:opacity-100' : 'hover:opacity-80'
                                        }`}
                                >
                                    <path
                                        d={pathData}
                                        fill={getFillColor(countryData?.owner_id || null)}
                                        // STROKE LOGIC: White for Selected, Yellow for Neighbor, Dark for others
                                        stroke={isSelected ? "#ffffff" : isNeighbor ? "#fbbf24" : "#0f172a"}
                                        strokeWidth={isSelected ? 3 : isNeighbor ? 2 : 1}
                                        className="transition-all duration-300"
                                    />

                                    {/* TEXT LOGIC: Center Minds Count */}
                                    <text
                                        x={getCenter(pathData).x}
                                        y={getCenter(pathData).y}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="text-[8px] pointer-events-none fill-white font-bold select-none opacity-70"
                                    >
                                        {countryData?.minds_count}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* SIDEBAR INFO */}
                <div className="w-full md:w-64 flex-shrink-0 z-0">
                    <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-white h-full min-h-[200px]">
                        {selected ? (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-2xl font-black uppercase text-blue-400">
                                        {getCountry(selected)?.name}
                                    </h2>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest">
                                        {getCountry(selected)?.continent}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-700 p-2 rounded">
                                        <p className="text-xs text-slate-400">Owner</p>
                                        <p className="font-mono">{getCountry(selected)?.owner_id ? "Player" : "Neutral"}</p>
                                    </div>
                                    <div className="bg-slate-700 p-2 rounded">
                                        <p className="text-xs text-slate-400">Minds</p>
                                        <p className="font-mono text-yellow-400 text-xl">{getCountry(selected)?.minds_count}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-700">
                                    <p className="text-xs text-slate-400 mb-2">Valid Targets (Neighbors):</p>
                                    <div className="flex flex-wrap gap-1">
                                        {getCountry(selected)?.adjacencies.map(adj => (
                                            <span key={adj} className="text-[10px] px-2 py-1 bg-slate-900 rounded border border-slate-600 text-slate-300">
                                                {countries.find(c => c.country_id === adj)?.name.substring(0, 15)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 italic text-center">
                                Select a territory<br />to issue orders
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Center calculation helper
function getCenter(pathString: string) {
    const nums = pathString.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
    let x = 0, y = 0, count = 0;
    for (let i = 0; i < nums.length; i += 2) {
        x += nums[i];
        y += nums[i + 1];
        count++;
    }
    return { x: x / count, y: y / count };
}