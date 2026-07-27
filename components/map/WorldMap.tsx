"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Plus, Minus, Locate } from "lucide-react";
import {
  REGION_PATH,
  REGION_CENTROID,
  BACKDROP_PATH,
  MAP_W,
  MAP_H,
} from "@/lib/map/projection";
import { REGION_BY_ID, isSeaEdge } from "@/lib/game/regions";

export interface MapCell {
  country_id: string;
  owner_id: string | null;
  minds: number;
}

interface WorldMapProps {
  board: MapCell[];
  ownerHue: Record<string, number>;
  currentUserId: string;
  selectedId?: string | null;
  targetedIds?: Set<string>;
  onSelectRegion?: (id: string | null) => void;
}

export default function WorldMap({
  board,
  ownerHue,
  currentUserId,
  selectedId,
  targetedIds,
  onSelectRegion,
}: WorldMapProps) {
  const cellById = useMemo(
    () => new Map(board.map((c) => [c.country_id, c])),
    [board],
  );

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // valid neighbours of the current selection (highlight potential targets)
  const neighbourIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    return new Set(REGION_BY_ID[selectedId]?.connections ?? []);
  }, [selectedId]);

  // sea-route hints from the selected region to its across-water neighbours
  const seaHints = useMemo(() => {
    if (!selectedId) return [] as Array<[number, number, number, number]>;
    const from = REGION_CENTROID[selectedId];
    if (!from) return [];
    return (REGION_BY_ID[selectedId]?.connections ?? [])
      .filter((n) => isSeaEdge(selectedId, n))
      .map((n) => REGION_CENTROID[n])
      .filter(Boolean)
      .map((to) => [from[0], from[1], to![0], to![1]] as [number, number, number, number]);
  }, [selectedId]);

  // ── pan / zoom ──────────────────────────────────────────────
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [t, setT] = useState({ k: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; k: number } | null>(null);
  const dragged = useRef(false);

  const clampK = (k: number) => Math.max(1, Math.min(7, k));

  const toLocal = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * MAP_W,
      y: ((clientY - rect.top) / rect.height) * MAP_H,
    };
  }, []);

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setT((prev) => {
      const k = clampK(prev.k * factor);
      const ratio = k / prev.k;
      return {
        k,
        x: cx - (cx - prev.x) * ratio,
        y: cy - (cy - prev.y) * ratio,
      };
    });
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const { x, y } = toLocal(e.clientX, e.clientY);
    zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, x, y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), k: t.k };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = toLocal((a.x + b.x) / 2, (a.y + b.y) / 2);
      const k = clampK((pinchStart.current.k * dist) / pinchStart.current.dist);
      setT((p) => {
        const ratio = k / p.k;
        return { k, x: mid.x - (mid.x - p.x) * ratio, y: mid.y - (mid.y - p.y) * ratio };
      });
      dragged.current = true;
      return;
    }

    const rect = svgRef.current!.getBoundingClientRect();
    const dx = ((e.clientX - prev.x) / rect.width) * MAP_W;
    const dy = ((e.clientY - prev.y) / rect.height) * MAP_H;
    if (Math.abs(e.clientX - prev.x) + Math.abs(e.clientY - prev.y) > 3) dragged.current = true;
    setT((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  };

  const reset = () => setT({ k: 1, x: 0, y: 0 });

  const bgClick = () => {
    if (!dragged.current) onSelectRegion?.(null);
  };

  // ── per-region fill / stroke ────────────────────────────────
  function fillFor(id: string) {
    const c = cellById.get(id);
    const isMine = c?.owner_id === currentUserId;
    const isNeutral = !c?.owner_id;
    const selected = id === selectedId;
    const neighbour = neighbourIds.has(id);

    if (selected) return "oklch(0.72 0.13 188)";
    if (neighbour) {
      const targetMine = cellById.get(id)?.owner_id === currentUserId;
      return targetMine ? "oklch(0.82 0.09 188)" : "oklch(0.82 0.11 30)";
    }
    if (isNeutral) return "oklch(0.9 0.008 250)";
    if (isMine) return "oklch(0.78 0.1 188)";
    const hue = ownerHue[c!.owner_id!] ?? 300;
    return `oklch(0.72 0.14 ${hue})`;
  }

  function strokeFor(id: string) {
    const c = cellById.get(id);
    const isMine = c?.owner_id === currentUserId;
    const isNeutral = !c?.owner_id;
    if (isNeutral) return "oklch(0.7 0.01 250)";
    if (isMine) return "oklch(0.5 0.11 190)";
    const hue = ownerHue[c!.owner_id!] ?? 300;
    return `oklch(0.5 0.15 ${hue})`;
  }

  const regionIds = useMemo(() => Object.keys(REGION_PATH), []);

  return (
    <div className="relative size-full overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="size-full touch-none select-none"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={bgClick}
        role="img"
        aria-label="Strategic world map"
      >
        <defs>
          <radialGradient id="ocean" cx="50%" cy="42%" r="80%">
            <stop offset="0%" stopColor="oklch(0.97 0.02 220)" />
            <stop offset="100%" stopColor="oklch(0.93 0.03 232)" />
          </radialGradient>
          <filter id="regionGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="url(#ocean)" />

        <g transform={`translate(${t.x} ${t.y}) scale(${t.k})`}>
          {/* inert backdrop land (Antarctica etc.) */}
          {BACKDROP_PATH && (
            <path
              d={BACKDROP_PATH}
              fill="oklch(0.94 0.004 240)"
              stroke="oklch(0.88 0.006 240)"
              strokeWidth={0.4 / t.k}
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* sea-route hints for the selected region */}
          <g style={{ pointerEvents: "none" }} strokeLinecap="round">
            {seaHints.map(([x1, y1, x2, y2], i) => (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="oklch(0.6 0.12 200)"
                strokeWidth={1 / t.k}
                strokeDasharray={`${3 / t.k} ${3 / t.k}`}
                strokeOpacity={0.75}
              />
            ))}
          </g>

          {/* regions */}
          {regionIds.map((id) => {
            const d = REGION_PATH[id];
            if (!d) return null;
            const selected = id === selectedId;
            const hovered = id === hoveredId;
            const targeted = targetedIds?.has(id);
            const emphasised = selected || hovered;

            return (
              <path
                key={id}
                d={d}
                fill={fillFor(id)}
                stroke={
                  targeted
                    ? "oklch(0.68 0.17 62)"
                    : emphasised
                      ? "oklch(0.3 0.02 250)"
                      : strokeFor(id)
                }
                strokeWidth={
                  (emphasised ? 1.8 : targeted ? 1.4 : 0.6) / t.k
                }
                strokeLinejoin="round"
                filter={emphasised ? "url(#regionGlow)" : undefined}
                className="cursor-pointer transition-[fill] duration-150"
                style={{ outline: "none" }}
                onPointerEnter={() => setHoveredId(id)}
                onPointerLeave={() => setHoveredId((h) => (h === id ? null : h))}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!dragged.current) onSelectRegion?.(id);
                }}
              >
                <title>{`${REGION_BY_ID[id]?.name ?? id} — ${cellById.get(id)?.minds ?? 0} minds`}</title>
              </path>
            );
          })}

          {/* minds labels at region centroids */}
          <g style={{ pointerEvents: "none" }}>
            {regionIds.map((id) => {
              const xy = REGION_CENTROID[id];
              if (!xy) return null;
              const c = cellById.get(id);
              const minds = c?.minds ?? 0;
              const isNeutral = !c?.owner_id;
              const selected = id === selectedId;
              const fs = Math.max(6, 10 / Math.sqrt(t.k));
              return (
                <text
                  key={id}
                  x={xy[0]}
                  y={xy[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fs}
                  fontWeight={700}
                  fill={isNeutral && !selected ? "oklch(0.42 0.01 250)" : "white"}
                  stroke={isNeutral && !selected ? "oklch(1 0 0 / 0.6)" : "oklch(0 0 0 / 0.28)"}
                  strokeWidth={fs * 0.14}
                  paintOrder="stroke"
                  style={{ pointerEvents: "none" }}
                >
                  {minds}
                </text>
              );
            })}
          </g>
        </g>
      </svg>

      {/* zoom controls */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-row gap-1">
        {[
          { icon: <Plus className="size-4" />, fn: () => zoomAt(1.3, MAP_W / 2, MAP_H / 2), label: "Zoom in" },
          { icon: <Minus className="size-4" />, fn: () => zoomAt(1 / 1.3, MAP_W / 2, MAP_H / 2), label: "Zoom out" },
          { icon: <Locate className="size-4" />, fn: reset, label: "Reset view" },
        ].map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={b.fn}
            aria-label={b.label}
            className="grid size-9 place-items-center rounded-lg border border-line bg-surface/90 text-ink-soft shadow-sm backdrop-blur transition hover:bg-surface hover:text-ink"
          >
            {b.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
