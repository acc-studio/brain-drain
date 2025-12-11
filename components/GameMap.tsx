"use client";

import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { useState, useEffect, memo } from "react";
import { createClient } from "@/utils/supabase/client";
import * as topojson from "topojson-client";
import { Plus, Minus, Move } from "lucide-react";

const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// (Keep your existing mapping list exactly as is)
const GEO_TO_GAME_ID: Record<string, string> = {
    // --- NORTH AMERICA ---
    "840": "eastern_us", "124": "ontario", "304": "greenland",
    "484": "central_america", "320": "central_america", "340": "central_america",
    "558": "central_america", "188": "central_america", "591": "central_america",
    "084": "central_america", "192": "central_america", "214": "central_america",
    "332": "central_america", "388": "central_america", "044": "central_america",
    "630": "central_america", "780": "central_america",
    "028": "central_america", "052": "central_america", "136": "central_america",
    "212": "central_america", "308": "central_america", "659": "central_america",
    "662": "central_america", "670": "central_america",
    // --- SOUTH AMERICA ---
    "076": "brazil", "068": "brazil", "600": "brazil",
    "032": "argentina", "152": "argentina", "858": "argentina", "238": "argentina",
    "604": "peru", "218": "peru",
    "862": "venezuela", "170": "venezuela", "328": "venezuela",
    "740": "venezuela", "254": "venezuela",
    // --- EUROPE ---
    "826": "great_britain", "372": "ireland", "352": "iceland", "833": "great_britain",
    "250": "western_europe", "724": "western_europe", "620": "western_europe",
    "056": "western_europe", "528": "western_europe", "756": "western_europe",
    "442": "western_europe", "020": "western_europe", "492": "western_europe",
    "276": "northern_europe", "616": "northern_europe", "203": "northern_europe",
    "040": "northern_europe", "438": "northern_europe",
    "752": "scandinavia", "578": "scandinavia", "208": "scandinavia", "234": "scandinavia",
    "246": "leningrad", "233": "leningrad", "428": "leningrad", "440": "leningrad",
    "380": "southern_europe", "300": "southern_europe", "191": "southern_europe",
    "705": "southern_europe", "008": "southern_europe", "807": "southern_europe",
    "499": "southern_europe", "688": "southern_europe", "070": "southern_europe",
    "383": "southern_europe", "470": "southern_europe", "674": "southern_europe", "336": "southern_europe",
    "804": "ukraine", "112": "ukraine", "498": "ukraine", "642": "ukraine",
    "348": "ukraine", "703": "ukraine", "100": "ukraine",
    // --- AFRICA ---
    "504": "north_africa", "012": "north_africa", "788": "north_africa",
    "434": "north_africa", "478": "north_africa", "466": "north_africa",
    "562": "north_africa", "148": "north_africa", "732": "north_africa", "854": "north_africa",
    "818": "egypt", "376": "egypt", "400": "egypt", "422": "egypt", "275": "egypt",
    "231": "east_africa", "706": "east_africa", "404": "east_africa",
    "800": "east_africa", "729": "east_africa", "728": "east_africa",
    "232": "east_africa", "262": "east_africa", "834": "east_africa",
    "646": "east_africa", "108": "east_africa",
    "178": "congo", "180": "congo", "120": "congo", "140": "congo",
    "266": "congo", "226": "congo", "566": "congo", "204": "congo",
    "768": "congo", "288": "congo", "384": "congo", "430": "congo",
    "694": "congo", "324": "congo", "686": "congo", "132": "congo",
    "270": "congo", "624": "congo", "678": "congo",
    "710": "south_africa", "516": "south_africa", "072": "south_africa",
    "716": "south_africa", "894": "south_africa", "508": "south_africa",
    "024": "south_africa", "454": "south_africa", "426": "south_africa", "748": "south_africa",
    "450": "madagascar", "174": "madagascar", "690": "madagascar", "480": "madagascar",
    // --- ASIA ---
    "792": "turkey", "268": "turkey", "051": "turkey", "031": "turkey", "196": "turkey",
    "682": "middle_east", "368": "middle_east", "364": "middle_east",
    "760": "middle_east", "887": "middle_east", "512": "middle_east",
    "784": "middle_east", "414": "middle_east", "634": "middle_east", "048": "middle_east",
    "004": "afghanistan",
    "398": "ural", "860": "ural", "795": "ural", "762": "ural", "417": "ural",
    "356": "india", "586": "india", "050": "india", "144": "india",
    "524": "india", "064": "india", "462": "india",
    "764": "siam", "704": "siam", "104": "siam", "418": "siam", "116": "siam", "702": "siam",
    "156": "china", "410": "china", "408": "china", "158": "china", "344": "china", "446": "china",
    "496": "mongolia", "392": "japan",
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

// --------------------------------------------------------------------------
// MEMOIZED MAP CONTENT
// This component only renders when data changes, NOT when the parent zooms/pans.
// This is critical for performance.
// --------------------------------------------------------------------------
const MapGeometries = memo(({
    geographyData,
    mapState
}: {
    geographyData: any[],
    mapState: MapState[]
}) => {

    const getCountryColor = (geoId: string) => {
        const isGameRegion = Object.values(GEO_TO_GAME_ID).includes(geoId);
        if (!isGameRegion) return "#e0f2fe"; // Sky-100 (Ocean Blend)
        const country = mapState.find((c) => c.country_id === geoId);
        if (!country?.owner_id) return "#cbd5e1"; // Neutral
        return "#3b82f6"; // Player
    };

    return (
        <Geographies geography={geographyData}>
            {({ geographies }) =>
                geographies.map((geo) => {
                    const isGameRegion = Object.values(GEO_TO_GAME_ID).includes(geo.id);
                    return (
                        <Geography
                            key={geo.rsmKey || geo.id || Math.random()}
                            geography={geo}
                            fill={getCountryColor(geo.id)}
                            stroke={isGameRegion ? "#ffffff" : "transparent"}
                            // Use a constant stroke width that relies on vector scaling
                            // (Simplifies logic inside the heavy loop)
                            strokeWidth={isGameRegion ? 0.5 : 0}
                            style={{
                                default: { outline: "none" },
                                hover: {
                                    fill: isGameRegion ? "#fbbf24" : "#e0f2fe",
                                    outline: "none",
                                    cursor: isGameRegion ? "pointer" : "grab",
                                    transition: "fill 0.1s ease"
                                },
                                pressed: {
                                    fill: isGameRegion ? "#d97706" : "#e0f2fe",
                                    outline: "none",
                                    cursor: "grabbing"
                                },
                            }}
                            onClick={() => isGameRegion && console.log(`Selected: ${geo.id}`)}
                        />
                    );
                })
            }
        </Geographies>
    );
});
MapGeometries.displayName = "MapGeometries";


// --------------------------------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------------------------------
export default function GameMap() {
    const supabase = createClient();
    const [mapState, setMapState] = useState<MapState[]>([]);
    const [geographyData, setGeographyData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // CONTROLLED ZOOM STATE
    const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

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

                const mergedFeatures = Object.keys(groupedGeometries).map((gameId) => {
                    const group = groupedGeometries[gameId];
                    const mergedGeometry = topojson.merge(topology, group);
                    return { type: "Feature", id: gameId, geometry: mergedGeometry, properties: { name: gameId } };
                });

                const backgroundFeatures = backgroundGeometries.map(geo =>
                    topojson.feature(topology, geo)
                );

                setGeographyData([...backgroundFeatures, ...mergedFeatures]);
                setLoading(false);
            });
    }, []);

    // HANDLERS
    const handleZoomIn = () => {
        if (position.zoom >= 4) return;
        setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
    };

    const handleZoomOut = () => {
        if (position.zoom <= 1) {
            setPosition({ coordinates: [0, 20], zoom: 1 });
            return;
        }
        setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
    };

    // FIX: Type as 'any' to bypass incorrect TypeScript definitions from the library
    const handleMove = (pos: any) => {
        // The library returns { coordinates, zoom, x, y, k, dragging }
        // We only care about coordinates and zoom
        if (pos.coordinates && pos.zoom) {
            setPosition({ coordinates: pos.coordinates, zoom: pos.zoom });
        }
    };

    return (
        <div className="w-full h-[850px] bg-sky-100 border border-slate-200 rounded-xl overflow-hidden relative shadow-inner cursor-grab active:cursor-grabbing">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                    <span className="font-bold text-slate-800 animate-pulse">Scanning Global Topology...</span>
                </div>
            )}

            <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 140 }}
                width={800}
                height={600}
            >
                <ZoomableGroup
                    zoom={position.zoom}
                    center={position.coordinates}
                    onMove={handleMove} // The Magic Fix: Updates state during drag
                    minZoom={1}
                    maxZoom={6}
                >
                    {/* Render the heavy geometry in a memoized child */}
                    <MapGeometries geographyData={geographyData} mapState={mapState} />
                </ZoomableGroup>
            </ComposableMap>

            {/* ZOOM CONTROLS */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 shadow-xl">
                <button
                    onClick={handleZoomIn}
                    className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-teal-600 active:bg-slate-100 transition-all z-20"
                >
                    <Plus className="w-6 h-6" />
                </button>
                <button
                    onClick={handleZoomOut}
                    className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-teal-600 active:bg-slate-100 transition-all z-20"
                >
                    <Minus className="w-6 h-6" />
                </button>
            </div>

            <div className="absolute top-4 right-4 bg-white/70 backdrop-blur px-3 py-1.5 rounded-lg border border-white/50 text-[10px] text-slate-500 font-bold uppercase pointer-events-none select-none flex items-center gap-2">
                <Move className="w-3 h-3" /> Drag to Pan
            </div>
        </div>
    );
}