// Country → game-region mapping. Plain ESM so both the TypeScript map layer
// (lib/map/region-geo.ts) and the Node seed generator (scripts/gen-seed.mjs)
// can import it directly.
//
// Keys are ISO 3166-1 numeric codes as they appear in
// `world-atlas/countries-110m.json` (`objects.countries.geometries[].id`).
// Values are region ids from `lib/game/regions.data.mjs`.
//
// Every country listed here is merged into its region on the map (internal
// borders dissolved). Countries not listed are drawn as inert ocean-coloured
// land (no region, not selectable) — e.g. Antarctica.

export const GEO_TO_GAME_ID = {
  // ── North America ──
  "840": "us",
  "124": "canada",
  "304": "greenland",
  "484": "central-america", "320": "central-america", "340": "central-america",
  "558": "central-america", "188": "central-america", "591": "central-america",
  "084": "central-america", "192": "central-america", "214": "central-america",
  "332": "central-america", "388": "central-america", "044": "central-america",
  "630": "central-america", "780": "central-america", "028": "central-america",
  "052": "central-america", "212": "central-america", "308": "central-america",
  "659": "central-america", "662": "central-america", "670": "central-america",

  // ── South America ──
  "076": "brazil", "068": "brazil", "600": "brazil",
  "032": "argentina", "152": "argentina", "858": "argentina", "238": "argentina",
  "604": "peru", "218": "peru",
  "862": "venezuela", "170": "venezuela", "328": "venezuela", "740": "venezuela", "254": "venezuela",

  // ── Europe ──
  "826": "great-britain", "833": "great-britain",
  "372": "ireland",
  "352": "iceland",
  "250": "western-europe", "724": "western-europe", "620": "western-europe",
  "056": "western-europe", "528": "western-europe", "756": "western-europe",
  "442": "western-europe", "020": "western-europe", "492": "western-europe",
  "276": "northern-europe", "616": "northern-europe", "203": "northern-europe",
  "040": "northern-europe", "438": "northern-europe",
  "752": "scandinavia", "578": "scandinavia", "208": "scandinavia", "234": "scandinavia",
  "246": "leningrad", "233": "leningrad", "428": "leningrad", "440": "leningrad",
  "380": "southern-europe", "300": "southern-europe", "191": "southern-europe",
  "705": "southern-europe", "008": "southern-europe", "807": "southern-europe",
  "499": "southern-europe", "688": "southern-europe", "070": "southern-europe",
  "383": "southern-europe", "470": "southern-europe",
  "804": "ukraine", "112": "ukraine", "498": "ukraine", "642": "ukraine",
  "348": "ukraine", "703": "ukraine", "100": "ukraine",

  // ── Africa ──
  "504": "north-africa", "012": "north-africa", "788": "north-africa",
  "434": "north-africa", "478": "north-africa", "466": "north-africa",
  "562": "north-africa", "148": "north-africa", "732": "north-africa", "854": "north-africa",
  "818": "egypt", "376": "egypt", "400": "egypt", "422": "egypt", "275": "egypt",
  "231": "east-africa", "706": "east-africa", "404": "east-africa", "800": "east-africa",
  "729": "east-africa", "728": "east-africa", "232": "east-africa", "262": "east-africa",
  "834": "east-africa", "646": "east-africa", "108": "east-africa",
  "178": "congo", "180": "congo", "120": "congo", "140": "congo", "266": "congo",
  "226": "congo", "566": "congo", "204": "congo", "768": "congo", "288": "congo",
  "384": "congo", "430": "congo", "694": "congo", "324": "congo", "686": "congo",
  "270": "congo", "624": "congo",
  "710": "south-africa", "516": "south-africa", "072": "south-africa", "716": "south-africa",
  "894": "south-africa", "508": "south-africa", "024": "south-africa", "454": "south-africa",
  "426": "south-africa", "748": "south-africa",
  "450": "madagascar",

  // ── Asia ──
  "792": "turkey", "268": "turkey", "051": "turkey", "031": "turkey", "196": "turkey",
  "682": "middle-east", "368": "middle-east", "364": "middle-east", "760": "middle-east",
  "887": "middle-east", "512": "middle-east", "784": "middle-east", "414": "middle-east",
  "634": "middle-east", "048": "middle-east",
  "004": "afghanistan",
  "398": "ural", "860": "ural", "795": "ural", "762": "ural", "417": "ural",
  "356": "india", "586": "india", "050": "india", "144": "india", "524": "india",
  "064": "india", "462": "india",
  "764": "siam", "704": "siam", "104": "siam", "418": "siam", "116": "siam", "702": "siam",
  "156": "china", "410": "china", "408": "china", "158": "china", "344": "china", "446": "china",
  "496": "mongolia",
  "392": "japan",
  "643": "russia",

  // ── Oceania ──
  "360": "indonesia", "458": "indonesia", "608": "indonesia", "626": "indonesia", "096": "indonesia",
  "598": "new-guinea", "090": "new-guinea", "242": "new-guinea", "548": "new-guinea",
  "036": "australia", "554": "australia",
};
