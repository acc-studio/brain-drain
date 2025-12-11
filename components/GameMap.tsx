"use client";

import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker, Line } from "react-simple-maps";
import { useState, useEffect, memo } from "react";
import { createClient } from "@/utils/supabase/client";
import * as topojson from "topojson-client";
import { geoCentroid } from "d3-geo";
// FIX 1: Added 'Users' to imports
import { Plus, Minus, Move, XCircle, Users } from "lucide-react";
import OrderModal from "./OrderModal";

const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ==============================================================
// 1. SEA ROUTES (Whitelist)
// ==============================================================
const SEA_ROUTES = [
    // ... existing ...
    ["brazil", "north_africa"],
    ["greenland", "iceland"],
    ["iceland", "great_britain"],
    ["iceland", "scandinavia"],
    ["great_britain", "western_europe"],
    ["north_africa", "western_europe"],
    ["north_africa", "southern_europe"],
    ["madagascar", "east_africa"],
    ["madagascar", "south_africa"],
    ["japan", "china"],
    ["japan", "russia"],
    ["alaska", "russia"],
    ["indonesia", "australia"],      // CHANGED
    ["indonesia", "new_guinea"],
    ["new_guinea", "australia"],     // CHANGED
];

const isSeaRoute = (id1: string, id2: string) => {
    return SEA_ROUTES.some(pair =>
        (pair[0] === id1 && pair[1] === id2) ||
        (pair[0] === id2 && pair[1] === id1)
    );
};

// ==============================================================
// 2. MAPPING DICTIONARY
// ==============================================================
const GEO_TO_GAME_ID: Record<string, string> = {
    // --- NORTH AMERICA ---
    "840": "us",       // CHANGED: USA -> us
    "124": "canada",   // CHANGED: Canada -> canada
    "304": "greenland",

    // Central America (Mexico southwards)
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

    // URAL (Kazakhstan & Central Asia)
    "398": "ural", "860": "ural", "795": "ural", "762": "ural", "417": "ural",

    // INDIA
    "356": "india", "586": "india", "050": "india", "144": "india",
    "524": "india", "064": "india", "462": "india",

    // SIAM
    "764": "siam", "704": "siam", "104": "siam", "418": "siam", "116": "siam", "702": "siam",

    // CHINA
    "156": "china", "410": "china", "408": "china", "158": "china", "344": "china", "446": "china",

    // MONGOLIA (Restored as its own node because it is a distinct shape)
    "496": "mongolia",

    // JAPAN
    "392": "japan",

    // RUSSIA (The massive single polygon)
    "643": "russia",

    // --- OCEANIA ---
    "360": "indonesia", "458": "indonesia", "608": "indonesia", "626": "indonesia", "096": "indonesia",
    "598": "new_guinea", "090": "new_guinea", "242": "new_guinea", "548": "new_guinea",
    // AUSTRALIA (Merged)
    "036": "australia", // CHANGED: Australia -> australia
    "554": "australia", // CHANGED: New Zealand -> australia
};

interface MapState {
    country_id: string;
    owner_id: string | null;
    minds: number;
}

// ==============================================================
// 3. MEMOIZED MAP RENDERER
// ==============================================================
const MapGeometries = memo(({
    geographyData,
    mapState,
    connections,
    selection,
    userId,
    zoomLevel,
    centroids,
    onSelect
}: {
    geographyData: any[];
    mapState: MapState[];
    connections: Record<string, string[]>;
    selection: { source: string | null };
    userId: string | null;
    zoomLevel: number;
    centroids: Record<string, [number, number]>;
    onSelect: (id: string) => void;
}) => {

    const getCountryColor = (geoId: string) => {
        const isGameRegion = Object.values(GEO_TO_GAME_ID).includes(geoId);
        if (!isGameRegion) return "#e0f2fe";

        if (selection.source === geoId) return "#f59e0b"; // Highlight Source

        const isNeighbor = selection.source && connections[selection.source]?.includes(geoId);
        if (isNeighbor) {
            const targetState = mapState.find(c => c.country_id === geoId);
            const isMyLand = targetState?.owner_id === userId;
            return isMyLand ? "#2dd4bf" : "#f87171"; // Teal/Red
        }

        const country = mapState.find((c) => c.country_id === geoId);
        if (!country?.owner_id) return "#cbd5e1"; // Neutral
        if (country.owner_id === userId) return "#3b82f6"; // Me
        return "#64748b"; // Enemy
    };

    const connectionLines: JSX.Element[] = [];
    const processedPairs = new Set();

    Object.entries(connections).forEach(([sourceId, targets]) => {
        const sourceCoords = centroids[sourceId];
        if (!sourceCoords) return;

        targets.forEach(targetId => {
            // CHECK: Is this a SEA ROUTE? If not, skip drawing.
            if (!isSeaRoute(sourceId, targetId)) return;

            const targetCoords = centroids[targetId];
            if (!targetCoords) return;

            const pairKey = [sourceId, targetId].sort().join("-");
            if (processedPairs.has(pairKey)) return;
            processedPairs.add(pairKey);

            connectionLines.push(
                <Line
                    key={pairKey}
                    from={sourceCoords}
                    to={targetCoords}
                    stroke="#475569"
                    strokeWidth={1 / zoomLevel}
                    strokeDasharray={`${3 / zoomLevel} ${3 / zoomLevel}`}
                    strokeLinecap="round"
                    style={{ pointerEvents: "none", opacity: 0.6 }}
                />
            );
        });
    });

    return (
        <>
            <Geographies geography={geographyData}>
                {({ geographies }) =>
                    geographies.map((geo) => {
                        const isGameRegion = Object.values(GEO_TO_GAME_ID).includes(geo.id);
                        const isSelected = selection.source === geo.id;

                        return (
                            <Geography
                                key={geo.rsmKey || geo.id || Math.random()}
                                geography={geo}
                                fill={getCountryColor(geo.id)}
                                stroke={isGameRegion ? "#ffffff" : "transparent"}
                                strokeWidth={isGameRegion ? (isSelected ? 1 / zoomLevel : 0.5 / zoomLevel) : 0}
                                style={{
                                    default: { outline: "none" },
                                    hover: {
                                        fill: isGameRegion ? "#fcd34d" : "#e0f2fe",
                                        outline: "none",
                                        cursor: isGameRegion ? "pointer" : "grab",
                                        transition: "fill 0.1s ease"
                                    },
                                    pressed: { fill: "#d97706", outline: "none" },
                                }}
                                onClick={() => isGameRegion && onSelect(geo.id)}
                            >
                                {isGameRegion && (
                                    <title>{geo.properties.name?.toUpperCase().replace("_", " ")}</title>
                                )}
                            </Geography>
                        );
                    })
                }
            </Geographies>

            <g className="pointer-events-none">
                {connectionLines}
            </g>

            {Object.entries(centroids).map(([id, coords]) => {
                const state = mapState.find(s => s.country_id === id);
                const count = state?.minds || 0;
                const scaleFactor = Math.max(1, 6 / Math.sqrt(zoomLevel));

                return (
                    <Marker key={id} coordinates={coords}>
                        <circle
                            r={scaleFactor}
                            fill="rgba(255, 255, 255, 0.95)"
                            stroke="#334155"
                            strokeWidth={0.5 / zoomLevel}
                            style={{ pointerEvents: "none", filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.1))" }}
                        />
                        <text
                            textAnchor="middle"
                            y={scaleFactor / 3}
                            style={{
                                fontFamily: "monospace",
                                fontSize: scaleFactor * 1.2,
                                fill: "#0f172a",
                                fontWeight: "bold",
                                pointerEvents: "none",
                                userSelect: "none"
                            }}
                        >
                            {count}
                        </text>
                    </Marker>
                );
            })}
        </>
    );
});
MapGeometries.displayName = "MapGeometries";

// ==============================================================
// 4. MAIN COMPONENT
// ==============================================================
export default function GameMap() {
    const supabase = createClient();
    const [userId, setUserId] = useState<string | null>(null);
    const [mapState, setMapState] = useState<MapState[]>([]);
    const [countryData, setCountryData] = useState<Record<string, string[]>>({});
    const [geographyData, setGeographyData] = useState<any[]>([]);
    const [centroids, setCentroids] = useState<Record<string, [number, number]>>({});
    const [loading, setLoading] = useState(true);

    // INTERACTION
    const [selection, setSelection] = useState<{ source: string | null, target: string | null }>({ source: null, target: null });
    const [inspected, setInspected] = useState<string | null>(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    // ZOOM
    const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

    // Load Data
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);

            const { data: state } = await supabase.from("map_state").select("*");
            if (state) setMapState(state);

            const { data: countries } = await supabase.from("countries").select("id, connections");
            if (countries) {
                const graph: Record<string, string[]> = {};
                countries.forEach((c: any) => graph[c.id] = c.connections);
                setCountryData(graph);
            }
        };
        init();
    }, []);

    // Compute Shapes
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

                const centerPoints: Record<string, [number, number]> = {};

                const mergedFeatures = Object.keys(groupedGeometries).map((gameId) => {
                    const group = groupedGeometries[gameId];
                    const mergedGeometry = topojson.merge(topology, group);

                    const feature: any = { type: "Feature", geometry: mergedGeometry };
                    centerPoints[gameId] = geoCentroid(feature);

                    return { ...feature, id: gameId, properties: { name: gameId } };
                });

                const backgroundFeatures = backgroundGeometries.map(geo =>
                    topojson.feature(topology, geo)
                );

                setCentroids(centerPoints);
                setGeographyData([...backgroundFeatures, ...mergedFeatures]);
                setLoading(false);
            });
    }, []);

    const handleCountryClick = (clickedId: string) => {
        setInspected(clickedId);

        if (selection.source === clickedId) {
            setSelection({ source: null, target: null });
            return;
        }

        if (selection.source) {
            const neighbors = countryData[selection.source] || [];
            if (neighbors.includes(clickedId)) {
                setSelection(prev => ({ ...prev, target: clickedId }));
                setShowOrderModal(true);
                return;
            }
        }

        const country = mapState.find(c => c.country_id === clickedId);
        if (country?.owner_id === userId) {
            setSelection({ source: clickedId, target: null });
        } else {
            setSelection({ source: null, target: null });
        }
    };

    const handleZoomIn = () => {
        if (position.zoom >= 6) return;
        setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
    };

    const handleZoomOut = () => {
        if (position.zoom <= 1) {
            setPosition({ coordinates: [0, 20], zoom: 1 });
            return;
        }
        setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
    };

    // FIX 2: Restored handleMove
    const handleMove = (pos: any) => {
        if (pos.coordinates && pos.zoom) {
            setPosition({ coordinates: pos.coordinates, zoom: pos.zoom });
        }
    };

    const getInspectedData = () => {
        if (!inspected) return null;
        const data = mapState.find(c => c.country_id === inspected);
        if (!data) return null;

        let ownerName = "Neutral";
        let ownerColor = "text-slate-500";

        if (data.owner_id === userId) {
            ownerName = "YOU";
            ownerColor = "text-blue-600";
        } else if (data.owner_id) {
            ownerName = "Enemy";
            ownerColor = "text-red-600";
        }

        return { ...data, ownerName, ownerColor };
    };

    const info = getInspectedData();

    return (
        <>
            <div className="w-full h-[850px] bg-sky-100 border border-slate-200 rounded-xl overflow-hidden relative shadow-inner cursor-grab active:cursor-grabbing">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                        <span className="font-bold text-slate-800 animate-pulse">Scanning Global Topology...</span>
                    </div>
                )}

                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ scale: 140 }}
                    style={{ width: "100%", height: "100%" }}
                >
                    <ZoomableGroup
                        zoom={position.zoom}
                        center={position.coordinates}
                        onMove={handleMove}
                        minZoom={1}
                        maxZoom={8}
                        disableZooming={true}
                        disablePanning={false}
                    >
                        <MapGeometries
                            geographyData={geographyData}
                            mapState={mapState}
                            connections={countryData}
                            selection={selection}
                            userId={userId}
                            zoomLevel={position.zoom}
                            centroids={centroids}
                            onSelect={handleCountryClick}
                        />
                    </ZoomableGroup>
                </ComposableMap>

                {/* CONTROLS */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-2 shadow-xl">
                    <button onClick={handleZoomIn} className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-all z-20"><Plus className="w-6 h-6" /></button>
                    <button onClick={handleZoomOut} className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition-all z-20"><Minus className="w-6 h-6" /></button>
                </div>

                {/* INSPECTION CARD */}
                {info && (
                    <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-xl w-64 animate-in slide-in-from-bottom-4 fade-in">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-black text-lg text-slate-800 uppercase leading-none">
                                {inspected?.replace("_", " ")}
                            </h3>
                            <button onClick={() => setInspected(null)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                <span className="text-slate-500 font-bold text-xs uppercase">Occupant</span>
                                <span className={`font-bold ${info.ownerColor}`}>{info.ownerName}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-slate-500 font-bold text-xs uppercase">Garrison</span>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    <span className="font-mono font-bold text-slate-800 text-lg">{info.minds}</span>
                                </div>
                            </div>
                        </div>

                        {selection.source && selection.source !== inspected && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                {countryData[selection.source]?.includes(inspected!) ? (
                                    <div className="text-xs text-center text-teal-600 font-bold bg-teal-50 py-1 rounded">
                                        Valid Target
                                    </div>
                                ) : (
                                    <div className="text-xs text-center text-slate-400 font-medium italic">
                                        Out of Range
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>

            {showOrderModal && selection.source && selection.target && (
                <OrderModal
                    sourceId={selection.source}
                    targetId={selection.target}
                    maxMinds={mapState.find(c => c.country_id === selection.source)?.minds || 0}
                    isAttack={mapState.find(c => c.country_id === selection.target)?.owner_id !== userId}
                    onClose={() => { setShowOrderModal(false); setSelection({ source: null, target: null }); }}
                    onSuccess={() => { setShowOrderModal(false); setSelection({ source: null, target: null }); }}
                />
            )}
        </>
    );
}