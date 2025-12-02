"use client";

import { CombinedCountryData } from "@/types/game";
import { useState } from "react";
import { MAP_PATHS } from "./MapPaths";
import OrderForm from "@/components/OrderForm";

interface GameMapProps {
    countries: CombinedCountryData[];
}

export default function GameMap({ countries }: GameMapProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [target, setTarget] = useState<string | null>(null);

    // Helper to find data for a specific country ID
    const getCountry = (id: string) => countries.find((c) => c.country_id === id);

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

    const getFillColor = (ownerId: string | null) => {
        if (!ownerId) return "#334155"; // Neutral Slate
        return "#3b82f6"; // Player Blue
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-2 relative">

            {/* ORDER MODAL */}
            {selected && target && (
                <OrderForm
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
                                        stroke={isSelected ? "#ffffff" : isNeighbor ? "#fbbf24" : "#0f172a"}
                                        strokeWidth={isSelected ? 3 : isNeighbor ? 2 : 1}
                                        className="transition-all duration-300"
                                    />
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