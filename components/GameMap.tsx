"use client";

import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import * as topojson from "topojson-client";

const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ==============================================================
// THE "WATERTIGHT" MAPPING
// Fixes specific holes in West Africa, East Africa, and Europe.
// ==============================================================
const GEO_TO_GAME_ID: Record<string, string> = {
    // --- NORTH AMERICA ---
    "840": "eastern_us", "124": "ontario", "304": "greenland",
    // Central America
    "484": "central_america", "320": "central_america", "340": "central_america",
    "558": "central_america", "188": "central_america", "591": "central_america",
    "084": "central_america", "192": "central_america", "214": "central_america",
    "332": "central_america", "388": "central_america", "044": "central_america",
    "630": "central_america", "780": "central_america",
    "028": "central_america", // Antigua
    "052": "central_america", // Barbados
    "136": "central_america", // Cayman Islands
    "212": "central_america", // Dominica
    "308": "central_america", // Grenada
    "659": "central_america", // St Kitts
    "662": "central_america", // St Lucia
    "670": "central_america", // St Vincent

    // --- SOUTH AMERICA ---
    "076": "brazil", "068": "brazil", "600": "brazil",
    "032": "argentina", "152": "argentina", "858": "argentina", "238": "argentina",
    "604": "peru", "218": "peru",
    "862": "venezuela", "170": "venezuela", "328": "venezuela",
    "740": "venezuela", "254": "venezuela",

    // --- EUROPE ---
    "826": "great_britain", "372": "ireland", "352": "iceland", "833": "great_britain", // Isle of Man
    // Western Europe
    "250": "western_europe", "724": "western_europe", "620": "western_europe",
    "056": "western_europe", "528": "western_europe", "756": "western_europe",
    "442": "western_europe", // Luxembourg (Hole Fix)
    "020": "western_europe", // Andorra (Hole Fix)
    "492": "western_europe", // Monaco
    // Northern Europe
    "276": "northern_europe", "616": "northern_europe", "203": "northern_europe",
    "040": "northern_europe", "438": "northern_europe", // Liechtenstein
    // Scandinavia
    "752": "scandinavia", "578": "scandinavia", "208": "scandinavia", "234": "scandinavia", // Faroes
    // Leningrad
    "246": "leningrad", "233": "leningrad", "428": "leningrad", "440": "leningrad",
    // Southern Europe
    "380": "southern_europe", "300": "southern_europe", "191": "southern_europe",
    "705": "southern_europe", "008": "southern_europe", "807": "southern_europe",
    "499": "southern_europe", "688": "southern_europe", "070": "southern_europe",
    "383": "southern_europe", // Kosovo
    "470": "southern_europe", // Malta (Hole Fix)
    "674": "southern_europe", // San Marino
    "336": "southern_europe", // Vatican
    // Ukraine/East
    "804": "ukraine", "112": "ukraine", "498": "ukraine", "642": "ukraine",
    "348": "ukraine", "703": "ukraine", "100": "ukraine",

    // --- AFRICA ---
    // North Africa
    "504": "north_africa", "012": "north_africa", "788": "north_africa",
    "434": "north_africa", "478": "north_africa", "466": "north_africa",
    "562": "north_africa", "148": "north_africa", "732": "north_africa",
    "854": "north_africa", // Burkina Faso (MAJOR FIX)
    // Egypt
    "818": "egypt", "376": "egypt", "400": "egypt", "422": "egypt", "275": "egypt",
    // East Africa
    "231": "east_africa", "706": "east_africa", "404": "east_africa",
    "800": "east_africa", "729": "east_africa", "728": "east_africa",
    "232": "east_africa", "262": "east_africa",
    "834": "east_africa", // Tanzania (MAJOR FIX)
    "646": "east_africa", // Rwanda (Hole Fix)
    "108": "east_africa", // Burundi (Hole Fix)
    // Congo
    "178": "congo", "180": "congo", "120": "congo", "140": "congo",
    "266": "congo", "226": "congo", "566": "congo", "204": "congo",
    "768": "congo", "288": "congo", "384": "congo", "430": "congo",
    "694": "congo", "324": "congo", "686": "congo", "132": "congo",
    "270": "congo", "624": "congo", "678": "congo", // Sao Tome
    // South Africa
    "710": "south_africa", "516": "south_africa", "072": "south_africa",
    "716": "south_africa", "894": "south_africa", "508": "south_africa",
    "024": "south_africa", "454": "south_africa", "426": "south_africa",
    "748": "south_africa",
    "450": "madagascar", "174": "madagascar", // Comoros
    "690": "madagascar", // Seychelles
    "480": "madagascar", // Mauritius

    // --- ASIA ---
    // Turkey + Caucasus
    "792": "turkey", "268": "turkey", "051": "turkey", "031": "turkey", "196": "turkey",
    // Middle East
    "682": "middle_east", "368": "middle_east", "364": "middle_east",
    "760": "middle_east", "887": "middle_east", "512": "middle_east",
    "784": "middle_east", "414": "middle_east", "634": "middle_east", "048": "middle_east", // Bahrain
    // Afghanistan
    "004": "afghanistan",
    // Ural
    "398": "ural", "860": "ural", "795": "ural", "762": "ural", "417": "ural",
    // India
    "356": "india", "586": "india", "050": "india", "144": "india",
    "524": "india", "064": "india", "462": "india", // Maldives
    // Siam
    "764": "siam", "704": "siam", "104": "siam", "418": "siam",
    "116": "siam", "702": "siam",
    // China
    "156": "china", "410": "china", "408": "china", "158": "china",
    "344": "china", // Hong Kong
    "446": "china", // Macau
    // Mongolia & Japan
    "496": "mongolia", "392": "japan",
    // Siberia
    "643": "siberia",

    // --- OCEANIA ---
    "360": "indonesia", "458": "indonesia", "608": "indonesia", "626": "indonesia", "096": "indonesia",
    "598": "new_guinea", "090": "new_guinea", "242": "new_guinea", "548": "new_guinea",
    "036": "eastern_australia", "554": "eastern_australia",
};

interface MapState {
    country_id: string;
    owner_id: string | null;
    minds: number;
}

export default function GameMap() {
    const supabase = createClient();
    const [mapState, setMapState] = useState<MapState[]>([]);
    const [geographyData, setGeographyData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchState = async () => {
            const { data } = await supabase.from("map_state").select("*");
            if (data) setMapState(data);
        };
        fetchState();
    }, []);

    useEffect(() => {
        fetch(TOPO_URL)
            .then((res) => res.json())
            .then((topology) => {
                const { countries } = topology.objects;

                const groupedGeometries: Record<string, any[]> = {};
                const backgroundGeometries: any[] = [];

                (countries.geometries as any[]).forEach((geo) => {
                    const isoCode = String(geo.id);
                    const gameId = GEO_TO_GAME_ID[isoCode];

                    if (gameId) {
                        if (!groupedGeometries[gameId]) groupedGeometries[gameId] = [];
                        groupedGeometries[gameId].push(geo);
                    } else {
                        backgroundGeometries.push(geo);
                    }
                });

                // MERGE LOGIC
                const mergedFeatures = Object.keys(groupedGeometries).map((gameId) => {
                    const group = groupedGeometries[gameId];
                    const mergedGeometry = topojson.merge(topology, group);

                    return {
                        type: "Feature",
                        id: gameId,
                        geometry: mergedGeometry,
                        properties: { name: gameId }
                    };
                });

                // BACKGROUND LOGIC
                const backgroundFeatures = backgroundGeometries.map(geo =>
                    topojson.feature(topology, geo)
                );

                setGeographyData([...backgroundFeatures, ...mergedFeatures]);
                setLoading(false);
            });
    }, []);

    const getCountryColor = (geoId: string) => {
        const isGameRegion = Object.values(GEO_TO_GAME_ID).includes(geoId);

        // Non-Game Regions
        if (!isGameRegion) return "#e2e8f0"; // slate-200

        // Game Regions
        const country = mapState.find((c) => c.country_id === geoId);
        if (!country) return "#94a3b8"; // Neutral
        if (!country.owner_id) return "#94a3b8"; // Owned by Neutral
        return "#3b82f6"; // Player Owned
    };

    const getStrokeColor = (geoId: string) => {
        const isGameRegion = Object.values(GEO_TO_GAME_ID).includes(geoId);
        // Cleaner look: White borders for active regions, transparent for background
        return isGameRegion ? "#ffffff" : "transparent";
    };

    return (
        <div className="w-full h-[600px] bg-slate-100 border border-slate-200 rounded-xl overflow-hidden relative shadow-inner">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                    <span className="font-bold text-slate-800 animate-pulse">Scanning Global Topology...</span>
                </div>
            )}

            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 135 }}>
                <Geographies geography={geographyData}>
                    {({ geographies }) =>
                        geographies.map((geo) => {
                            const isGameRegion = Object.values(GEO_TO_GAME_ID).includes(geo.id);

                            return (
                                <Geography
                                    key={geo.rsmKey || geo.id || Math.random()}
                                    geography={geo}
                                    fill={getCountryColor(geo.id)}
                                    stroke={getStrokeColor(geo.id)}
                                    strokeWidth={isGameRegion ? 1 : 0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: {
                                            fill: isGameRegion ? "#fbbf24" : "#e2e8f0",
                                            outline: "none",
                                            cursor: isGameRegion ? "pointer" : "default",
                                            transition: "all 0.1s"
                                        },
                                        pressed: {
                                            fill: isGameRegion ? "#d97706" : "#e2e8f0",
                                            outline: "none"
                                        },
                                    }}
                                    onClick={() => isGameRegion && console.log(`Selected: ${geo.id}`)}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
        </div>
    );
}