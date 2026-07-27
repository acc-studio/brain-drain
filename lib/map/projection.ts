import { geoNaturalEarth1, geoPath } from "d3-geo";
import { merge } from "topojson-client";
import type { Geometry, MultiPolygon, Polygon, Position } from "geojson";
import type { Topology, GeometryObject } from "topojson-specification";
import countriesTopo from "world-atlas/countries-110m.json";
import { GEO_TO_GAME_ID } from "@/lib/map/region-geo";

export const MAP_W = 980;
export const MAP_H = 520;

const topo = countriesTopo as unknown as Topology;
const geometries = (
  topo.objects.countries as unknown as { geometries: (GeometryObject & { id?: string | number })[] }
).geometries;

// Group each country geometry into its game region.
const byRegion: Record<string, GeometryObject[]> = {};
for (const g of geometries) {
  const rid = GEO_TO_GAME_ID[String(g.id)];
  if (!rid) continue;
  (byRegion[rid] ??= []).push(g);
}

// Merge each region's member countries into one geometry (internal borders
// dissolved), so every region is a single filled shape with a clean outline.
const mergedByRegion: Record<string, MultiPolygon> = {};
for (const [rid, geoms] of Object.entries(byRegion)) {
  mergedByRegion[rid] = merge(topo, geoms as never) as MultiPolygon;
}

// Land that isn't part of any region (e.g. Antarctica) — drawn as inert
// backdrop so the world doesn't look cut off.
const backdropGeoms = geometries.filter((g) => !GEO_TO_GAME_ID[String(g.id)]);

const projection = geoNaturalEarth1();

// Fit the projection to the union of all playable regions (keeps the inhabited
// world centred and excludes Antarctica from the framing).
const regionsUnion: Geometry = {
  type: "GeometryCollection",
  geometries: Object.values(mergedByRegion),
};

projection.fitExtent(
  [
    [14, 12],
    [MAP_W - 14, MAP_H - 12],
  ],
  { type: "Feature", properties: {}, geometry: regionsUnion },
);

const pathGen = geoPath(projection);

// ── label placement ────────────────────────────────────────────────────────
// The area centroid of a multi-polygon (island nations, crescent shapes) often
// lands in open water. Instead we place each label at the "pole of
// inaccessibility" of the region's LARGEST landmass — the point furthest from
// any coastline — which is always on soil.

type Ring = [number, number][];

function projectRing(ring: Position[]): Ring {
  const out: Ring = [];
  for (const [lon, lat] of ring) {
    const p = projection([lon, lat]);
    if (p) out.push([p[0], p[1]]);
  }
  return out;
}

function ringSignedArea(ring: Ring): number {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return a / 2;
}

function segDistSq(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  let x = ax, y = ay;
  const dx = bx - ax, dy = by - ay;
  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = bx; y = by; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  const ex = px - x, ey = py - y;
  return ex * ex + ey * ey;
}

/** Signed distance from a point to a polygon (positive when inside). */
function pointToPolyDist(x: number, y: number, rings: Ring[]): number {
  let inside = false;
  let minSq = Infinity;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i], b = ring[j];
      if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) {
        inside = !inside;
      }
      minSq = Math.min(minSq, segDistSq(x, y, a[0], a[1], b[0], b[1]));
    }
  }
  return (inside ? 1 : -1) * Math.sqrt(minSq);
}

interface Cell { x: number; y: number; h: number; d: number; max: number }

function makeCell(x: number, y: number, h: number, rings: Ring[]): Cell {
  const d = pointToPolyDist(x, y, rings);
  return { x, y, h, d, max: d + h * Math.SQRT2 };
}

/** Pole of inaccessibility (after Mapbox's polylabel) in projected px space. */
function polylabel(rings: Ring[], precision = 2): [number, number] {
  const outer = rings[0];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of outer) {
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
  }
  const width = maxX - minX, height = maxY - minY;
  const cellSize = Math.max(1e-6, Math.min(width, height));
  let h = cellSize / 2;

  const queue: Cell[] = [];
  for (let x = minX; x < maxX; x += cellSize) {
    for (let y = minY; y < maxY; y += cellSize) {
      queue.push(makeCell(x + h, y + h, h, rings));
    }
  }

  let best = makeCell(minX + width / 2, minY + height / 2, 0, rings);
  while (queue.length) {
    let bi = 0;
    for (let i = 1; i < queue.length; i++) if (queue[i].max > queue[bi].max) bi = i;
    const cell = queue.splice(bi, 1)[0];
    if (cell.d > best.d) best = cell;
    if (cell.max - best.d <= precision) continue;
    h = cell.h / 2;
    queue.push(
      makeCell(cell.x - h, cell.y - h, h, rings),
      makeCell(cell.x + h, cell.y - h, h, rings),
      makeCell(cell.x - h, cell.y + h, h, rings),
      makeCell(cell.x + h, cell.y + h, h, rings),
    );
  }
  return [best.x, best.y];
}

/** Place a label on the region's largest landmass, always on soil. */
function labelPoint(geom: MultiPolygon): [number, number] {
  const polys: Polygon["coordinates"][] =
    geom.type === "MultiPolygon"
      ? (geom.coordinates as Polygon["coordinates"][])
      : [(geom as unknown as Polygon).coordinates];

  let bestRings: Ring[] | null = null;
  let bestArea = -1;
  for (const poly of polys) {
    const rings = poly.map(projectRing).filter((r) => r.length >= 3);
    if (!rings.length) continue;
    const area = Math.abs(ringSignedArea(rings[0]));
    if (area > bestArea) { bestArea = area; bestRings = rings; }
  }
  if (!bestRings) return pathGen.centroid(geom) as [number, number];
  return polylabel(bestRings);
}

/** Projected SVG path string for each region, keyed by region id. */
export const REGION_PATH: Record<string, string> = {};
/** Projected [x, y] label anchor (on land) for each region, keyed by region id. */
export const REGION_CENTROID: Record<string, [number, number]> = {};

for (const [rid, geom] of Object.entries(mergedByRegion)) {
  REGION_PATH[rid] = pathGen(geom) ?? "";
  REGION_CENTROID[rid] = labelPoint(geom);
}

/** Non-region backdrop land (Antarctica, unmapped islands). */
export const BACKDROP_PATH: string =
  pathGen(merge(topo, backdropGeoms as never) as Geometry) ?? "";
