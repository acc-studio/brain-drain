"use client";

import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// MAPPING: ISO-3 Numeric Code -> Your Database IDs
const GEO_TO_GAME_ID: Record<string, string> = {
    // North America
    "840": "eastern_us", "124": "ontario", "484": "central_america", "304": "greenland",
    // South America
    "076": "brazil", "032": "argentina", "604": "peru", "862": "venezuela",
    // Europe
    "826": "great_britain",
    "372": "ireland",
    "352": "iceland",
    "250": "western_europe", // France
    "276": "northern_europe", // Germany
    "752": "scandinavia", // Sweden
    "246": "leningrad", // Finland (Visual proxy)
    "380": "southern_europe", // Italy
    "804": "ukraine",
    // Africa
    "818": "egypt", "504": "north_africa", "178": "congo", "710": "south_africa", "450": "madagascar", "231": "east_africa",
    // Asia
    "792": "turkey",
    "682": "middle_east", // Saudi Arabia
    "004": "afghanistan", "356": "india", "156": "china", "392": "japan", "496": "mongolia", "764": "siam", "643": "siberia",
    // Australia
    "036": "eastern_australia", "360": "indonesia", "598": "new_guinea"
};

interface MapState {
    country_id: string;
    owner_id: string | null;
    minds: number;
}

export default function GameMap() {
    const supabase = createClient();
    const [mapState, setMapState] = useState<MapState[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchState = async () => {
            const { data, error } = await supabase.from("map_state").select("*");
            if (error) console.error("Error loading map:", error);
            if (data) setMapState(data);
            setLoading(false);
        };
        fetchState();
    }, []);

    const getCountryColor = (gameId: string) => {
        const country = mapState.find((c) => c.country_id === gameId);
        if (!country) return "#e2e8f0"; // slate-200 (Land)
        if (!country.owner_id) return "#94a3b8"; // slate-400 (Neutral)
        return "#3b82f6"; // blue-500 (Player Owned - generic for now)
    };

    return (
        <div className="w-full h-[600px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden relative shadow-sm">
            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-sm font-bold text-slate-600 tracking-wider">CONNECTING TO SATELLITE...</span>
                    </div>
                </div>
            )}

            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 135 }}>
                <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            const gameId = GEO_TO_GAME_ID[geo.id];
                            // Only draw countries that exist in our DB
                            if (!gameId) return null;

                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={getCountryColor(gameId)}
                                    stroke="#ffffff"
                                    strokeWidth={0.75}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#f59e0b", outline: "none", cursor: "pointer", transition: "all 0.2s" },
                                        pressed: { fill: "#d97706", outline: "none" },
                                    }}
                                    onClick={() => console.log(`Selected: ${gameId}`)}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
}