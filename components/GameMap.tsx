"use client";

import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ==============================================================
// THE AGGREGATION MAP
// This groups multiple real-world ISO codes into single Game IDs
// to create those chunky "Risk-style" regions.
// ==============================================================
const GEO_TO_GAME_ID: Record<string, string> = {
    // --- NORTH AMERICA ---
    "840": "eastern_us", // USA -> Maps to Eastern US (Limitation: Can't split US without custom map)
    "124": "ontario",    // Canada -> Maps to Ontario
    "484": "central_america", // Mexico
    "320": "central_america", // Guatemala
    "340": "central_america", // Honduras
    "558": "central_america", // Nicaragua
    "188": "central_america", // Costa Rica
    "591": "central_america", // Panama
    "304": "greenland",

    // --- SOUTH AMERICA ---
    "076": "brazil",
    "068": "brazil", // Bolivia -> Merged into Brazil visual
    "600": "brazil", // Paraguay -> Merged into Brazil visual

    "032": "argentina",
    "152": "argentina", // Chile -> Merged into Argentina visual
    "858": "argentina", // Uruguay -> Merged into Argentina visual

    "604": "peru",
    "218": "peru", // Ecuador -> Merged into Peru

    "862": "venezuela",
    "170": "venezuela", // Colombia -> Merged into Venezuela
    "328": "venezuela", // Guyana
    "740": "venezuela", // Suriname

    // --- EUROPE ---
    "826": "great_britain",
    "372": "ireland",
    "352": "iceland",

    "250": "western_europe", // France
    "724": "western_europe", // Spain
    "620": "western_europe", // Portugal
    "056": "western_europe", // Belgium
    "528": "western_europe", // Netherlands
    "756": "western_europe", // Switzerland

    "276": "northern_europe", // Germany
    "616": "northern_europe", // Poland
    "203": "northern_europe", // Czechia
    "040": "northern_europe", // Austria

    "752": "scandinavia", // Sweden
    "578": "scandinavia", // Norway
    "208": "scandinavia", // Denmark

    "246": "leningrad", // Finland
    "233": "leningrad", // Estonia
    "428": "leningrad", // Latvia
    "440": "leningrad", // Lithuania

    "380": "southern_europe", // Italy
    "300": "southern_europe", // Greece
    "191": "southern_europe", // Croatia
    "705": "southern_europe", // Slovenia
    "008": "southern_europe", // Albania

    "804": "ukraine",
    "112": "ukraine", // Belarus
    "498": "ukraine", // Moldova
    "642": "ukraine", // Romania
    "348": "ukraine", // Hungary
    "703": "ukraine", // Slovakia

    // --- AFRICA ---
    "504": "north_africa", // Morocco
    "012": "north_africa", // Algeria
    "788": "north_africa", // Tunisia
    "434": "north_africa", // Libya
    "478": "north_africa", // Mauritania

    "818": "egypt",
    "729": "egypt", // Sudan

    "231": "east_africa", // Ethiopia
    "706": "east_africa", // Somalia
    "404": "east_africa", // Kenya
    "800": "east_africa", // Uganda

    "178": "congo", // Congo Republic
    "180": "congo", // DRC
    "024": "congo", // Angola
    "894": "congo", // Zambia
    "716": "congo", // Zimbabwe

    "710": "south_africa",
    "516": "south_africa", // Namibia
    "072": "south_africa", // Botswana
    "450": "madagascar",
    "508": "madagascar", // Mozambique (Visual bridge)

    // --- ASIA ---
    "792": "turkey",
    "682": "middle_east", // Saudi Arabia
    "368": "middle_east", // Iraq
    "364": "middle_east", // Iran
    "760": "middle_east", // Syria
    "400": "middle_east", // Jordan
    "887": "middle_east", // Yemen
    "512": "middle_east", // Oman

    "004": "afghanistan",
    "762": "afghanistan", // Tajikistan
    "795": "afghanistan", // Turkmenistan
    "860": "afghanistan", // Uzbekistan

    "356": "india",
    "586": "india", // Pakistan
    "050": "india", // Bangladesh
    "144": "india", // Sri Lanka

    "764": "siam", // Thailand
    "704": "siam", // Vietnam
    "104": "siam", // Myanmar
    "418": "siam", // Laos
    "116": "siam", // Cambodia

    "156": "china",
    "410": "china", // South Korea
    "408": "china", // North Korea

    "496": "mongolia",
    "392": "japan",

    "643": "siberia", // Russia (Massive blob)
    "398": "ural", // Kazakhstan (Visual proxy for Ural)
    "417": "ural", // Kyrgyzstan

    // --- AUSTRALIA / OCEANIA ---
    "036": "eastern_australia", // Australia (Limitation: One block)
    "360": "indonesia",
    "458": "indonesia", // Malaysia
    "608": "indonesia", // Philippines
    "598": "new_guinea",
    "554": "new_guinea", // New Zealand (Visual proxy)
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
            if (data) setMapState(data);
            setLoading(false);
        };
        fetchState();
    }, []);

    const getCountryColor = (gameId: string) => {
        const country = mapState.find((c) => c.country_id === gameId);
        if (!country) return "#cbd5e1"; // Game Region, but Neutral (slate-300)
        if (!country.owner_id) return "#94a3b8"; // Owned by Neutral
        return "#3b82f6"; // Player Owned
    };

    return (
        <div className="w-full h-[600px] bg-blue-50/50 border border-slate-200 rounded-xl overflow-hidden relative shadow-inner">

            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                    <span className="font-bold text-slate-800 animate-pulse">Scanning Topology...</span>
                </div>
            )}

            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 135 }}>
                <Geographies geography={GEO_URL}>
                    {({ geographies }: { geographies: any[] }) =>
                        geographies.map((geo: any) => {
                            const gameId = GEO_TO_GAME_ID[geo.id];

                            // 1. If it maps to a game ID, color it based on state
                            if (gameId) {
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={getCountryColor(gameId)}
                                        stroke="#ffffff"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#fbbf24", outline: "none", cursor: "pointer", transition: "all 0.1s" },
                                            pressed: { fill: "#d97706", outline: "none" },
                                        }}
                                        onClick={() => console.log(`Selected: ${gameId}`)}
                                    />
                                );
                            }

                            // 2. If it's NOT a game country (e.g. Antarctica, minor islands), 
                            // render it as a background shape so the map isn't "Swiss Cheese"
                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#e2e8f0" // Very light gray
                                    stroke="#ffffff"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none", pointerEvents: "none" }, // Non-interactive
                                        hover: { outline: "none", pointerEvents: "none" },
                                        pressed: { outline: "none", pointerEvents: "none" },
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
}