// Raw region-graph data — the single source of truth shared by the TypeScript
// game layer (lib/game/regions.ts) and the Node seed generator
// (scripts/gen-seed.mjs). Plain ESM so both can import it directly.
//
// Regions are COUNTRY-ALIGNED: each region is a real country or a small group
// of neighbouring countries, so it can be drawn as a filled shape with real
// borders (internal borders between grouped countries are merged away on the
// map). The country → region grouping lives in lib/map/region-geo.ts and MUST
// stay in sync with the ids below.

export const CONTINENTS = [
  { id: "north-america", name: "North America", hue: 25 },
  { id: "south-america", name: "South America", hue: 140 },
  { id: "europe", name: "Europe", hue: 210 },
  { id: "africa", name: "Africa", hue: 45 },
  { id: "asia", name: "Asia", hue: 350 },
  { id: "oceania", name: "Oceania", hue: 285 },
];

export const REGIONS = [
  // ── North America ──
  { id: "us", name: "United States", continent: "north-america", lon: -98, lat: 39, connections: ["canada", "central-america", "russia"] },
  { id: "canada", name: "Canada", continent: "north-america", lon: -106, lat: 60, connections: ["us", "greenland"] },
  { id: "greenland", name: "Greenland", continent: "north-america", lon: -42, lat: 72, connections: ["canada", "iceland"] },
  { id: "central-america", name: "Central America", continent: "north-america", lon: -90, lat: 16, connections: ["us", "venezuela"] },

  // ── South America ──
  { id: "venezuela", name: "Venezuela", continent: "south-america", lon: -66, lat: 7, connections: ["central-america", "brazil", "peru"] },
  { id: "peru", name: "Peru", continent: "south-america", lon: -75, lat: -10, connections: ["venezuela", "brazil", "argentina"] },
  { id: "brazil", name: "Brazil", continent: "south-america", lon: -52, lat: -10, connections: ["venezuela", "peru", "argentina", "north-africa"] },
  { id: "argentina", name: "Argentina", continent: "south-america", lon: -65, lat: -35, connections: ["peru", "brazil"] },

  // ── Europe ──
  { id: "iceland", name: "Iceland", continent: "europe", lon: -19, lat: 65, connections: ["greenland", "great-britain", "scandinavia"] },
  { id: "great-britain", name: "Great Britain", continent: "europe", lon: -2, lat: 54, connections: ["iceland", "ireland", "scandinavia", "northern-europe", "western-europe"] },
  { id: "ireland", name: "Ireland", continent: "europe", lon: -8, lat: 53, connections: ["great-britain", "western-europe"] },
  { id: "western-europe", name: "Western Europe", continent: "europe", lon: 2, lat: 46, connections: ["great-britain", "ireland", "northern-europe", "southern-europe", "north-africa"] },
  { id: "northern-europe", name: "Northern Europe", continent: "europe", lon: 12, lat: 51, connections: ["great-britain", "scandinavia", "leningrad", "western-europe", "southern-europe", "ukraine"] },
  { id: "scandinavia", name: "Scandinavia", continent: "europe", lon: 15, lat: 63, connections: ["iceland", "great-britain", "northern-europe", "leningrad"] },
  { id: "leningrad", name: "Leningrad", continent: "europe", lon: 26, lat: 62, connections: ["scandinavia", "northern-europe", "ukraine", "russia"] },
  { id: "southern-europe", name: "Southern Europe", continent: "europe", lon: 14, lat: 42, connections: ["western-europe", "northern-europe", "ukraine", "turkey", "north-africa"] },
  { id: "ukraine", name: "Ukraine", continent: "europe", lon: 32, lat: 49, connections: ["northern-europe", "leningrad", "southern-europe", "turkey", "russia"] },

  // ── Africa ──
  { id: "north-africa", name: "North Africa", continent: "africa", lon: 10, lat: 23, connections: ["brazil", "western-europe", "southern-europe", "egypt", "east-africa", "congo"] },
  { id: "egypt", name: "Egypt", continent: "africa", lon: 30, lat: 26, connections: ["north-africa", "east-africa", "middle-east"] },
  { id: "east-africa", name: "East Africa", continent: "africa", lon: 38, lat: 3, connections: ["egypt", "north-africa", "congo", "south-africa", "madagascar", "middle-east"] },
  { id: "congo", name: "Congo", continent: "africa", lon: 20, lat: -2, connections: ["north-africa", "east-africa", "south-africa"] },
  { id: "south-africa", name: "South Africa", continent: "africa", lon: 24, lat: -29, connections: ["congo", "east-africa", "madagascar"] },
  { id: "madagascar", name: "Madagascar", continent: "africa", lon: 47, lat: -19, connections: ["east-africa", "south-africa"] },

  // ── Asia ──
  { id: "turkey", name: "Turkey", continent: "asia", lon: 35, lat: 39, connections: ["southern-europe", "ukraine", "middle-east"] },
  { id: "middle-east", name: "Middle East", continent: "asia", lon: 47, lat: 26, connections: ["turkey", "egypt", "east-africa", "ural", "afghanistan", "india"] },
  { id: "afghanistan", name: "Afghanistan", continent: "asia", lon: 66, lat: 34, connections: ["ural", "china", "india", "middle-east"] },
  { id: "ural", name: "Ural", continent: "asia", lon: 62, lat: 48, connections: ["russia", "china", "afghanistan", "middle-east"] },
  { id: "india", name: "India", continent: "asia", lon: 79, lat: 22, connections: ["afghanistan", "china", "middle-east", "siam"] },
  { id: "china", name: "China", continent: "asia", lon: 104, lat: 35, connections: ["russia", "ural", "mongolia", "afghanistan", "india", "siam", "japan"] },
  { id: "mongolia", name: "Mongolia", continent: "asia", lon: 103, lat: 46, connections: ["russia", "china"] },
  { id: "japan", name: "Japan", continent: "asia", lon: 138, lat: 37, connections: ["china", "russia"] },
  { id: "siam", name: "Siam", continent: "asia", lon: 101, lat: 15, connections: ["china", "india", "indonesia"] },
  { id: "russia", name: "Russia", continent: "asia", lon: 96, lat: 62, connections: ["leningrad", "ukraine", "ural", "mongolia", "china", "japan", "us"] },

  // ── Oceania ──
  { id: "indonesia", name: "Indonesia", continent: "oceania", lon: 118, lat: -2, connections: ["siam", "new-guinea", "australia"] },
  { id: "new-guinea", name: "New Guinea", continent: "oceania", lon: 145, lat: -6, connections: ["indonesia", "australia"] },
  { id: "australia", name: "Australia", continent: "oceania", lon: 134, lat: -25, connections: ["indonesia", "new-guinea"] },
];

// Edges that cross open water — drawn dashed on the map.
export const SEA_EDGE_PAIRS = [
  ["greenland", "iceland"],
  ["iceland", "great-britain"],
  ["iceland", "scandinavia"],
  ["great-britain", "western-europe"],
  ["great-britain", "northern-europe"],
  ["great-britain", "scandinavia"],
  ["ireland", "great-britain"],
  ["ireland", "western-europe"],
  ["western-europe", "north-africa"],
  ["southern-europe", "north-africa"],
  ["brazil", "north-africa"],
  ["us", "russia"],
  ["japan", "china"],
  ["japan", "russia"],
  ["east-africa", "madagascar"],
  ["south-africa", "madagascar"],
  ["east-africa", "middle-east"],
  ["siam", "indonesia"],
  ["indonesia", "australia"],
  ["indonesia", "new-guinea"],
  ["new-guinea", "australia"],
];
