"use client";

import { useMemo, useState } from "react";
import {
  GATE_TO_CENTER,
  CENTER_GATES,
  CHANNELS,
} from "@/utils/hd-gates";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BodyGraphProps {
  centers: { name: string; defined: boolean }[];
  gates: number[];
  channels: string[]; // e.g. ["1-8", "3-60"]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VIEW_W = 420;
const VIEW_H = 520;
const CX = 210; // body center x

// ─── Center layout ───────────────────────────────────────────────────────────

interface CenterLayout {
  x: number;
  y: number;
  shape: "triangle-up" | "triangle-down" | "square" | "diamond";
  size: number;
  color: string;
  label: string;
}

const CENTERS: Record<string, CenterLayout> = {
  Head:           { x: CX,      y: 50,  shape: "triangle-up",   size: 28, color: "#eab308", label: "頭腦" },
  Ajna:           { x: CX,      y: 115, shape: "triangle-down", size: 28, color: "#22c55e", label: "邏輯" },
  Throat:         { x: CX,      y: 185, shape: "square",        size: 26, color: "#92400e", label: "喉嚨" },
  G:              { x: CX,      y: 260, shape: "diamond",       size: 30, color: "#eab308", label: "G" },
  Heart:          { x: CX + 90, y: 230, shape: "triangle-down", size: 18, color: "#ef4444", label: "意志力" },
  Spleen:         { x: CX - 92, y: 345, shape: "triangle-up",   size: 24, color: "#92400e", label: "直覺" },
  Sacral:         { x: CX,      y: 350, shape: "square",        size: 28, color: "#ef4444", label: "薦骨" },
  "Solar Plexus": { x: CX + 92, y: 345, shape: "triangle-up",   size: 24, color: "#92400e", label: "情緒" },
  Root:           { x: CX,      y: 430, shape: "square",        size: 26, color: "#92400e", label: "根部" },
};

// ─── Gate positioning ────────────────────────────────────────────────────────

function getGatePositions(
  centerName: string,
  activeGates: number[],
  cx: number,
  cy: number,
  size: number,
): { gate: number; x: number; y: number }[] {
  const allGates = CENTER_GATES[centerName] ?? [];
  const result: { gate: number; x: number; y: number }[] = [];

  for (const gate of allGates) {
    if (!activeGates.includes(gate)) continue;
    const idx = allGates.indexOf(gate);
    const total = allGates.length;
    const angle = ((idx / total) * 360 - 90) * (Math.PI / 180);
    const radius = size + 16;
    result.push({
      gate,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }
  return result;
}

// ─── Shape renderer ──────────────────────────────────────────────────────────

function CenterShape({ layout, defined }: { layout: CenterLayout; defined: boolean }) {
  const { x, y, shape, size, color } = layout;
  const fill = defined ? color + "40" : "transparent";
  const stroke = defined ? color : "#475569";
  const sw = defined ? 2.5 : 1.5;

  switch (shape) {
    case "triangle-up":
      return <polygon points={`${x},${y - size} ${x + size},${y + size * 0.65} ${x - size},${y + size * 0.65}`} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "triangle-down":
      return <polygon points={`${x},${y + size} ${x + size},${y - size * 0.65} ${x - size},${y - size * 0.65}`} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "square":
      return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} rx={4} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "diamond":
      return <polygon points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }
}

// ─── SVG Chart content (reused for normal + zoom) ────────────────────────────

function BodyGraphSVG({ gates, channels, activeChannelSet, centerMap }: {
  centers: { name: string; defined: boolean }[];
  gates: number[];
  channels: string[];
  activeChannelSet: Set<string>;
  centerMap: Map<string, boolean>;
}) {
  return (
    <>
      {/* Channel lines */}
      {CHANNELS.map(([gA, gB]) => {
        const cA = GATE_TO_CENTER[gA];
        const cB = GATE_TO_CENTER[gB];
        if (!cA || !cB || cA === cB) return null;
        const posA = CENTERS[cA];
        const posB = CENTERS[cB];
        if (!posA || !posB) return null;

        const sorted = [gA, gB].sort((a, b) => a - b);
        const key = `${sorted[0]}-${sorted[1]}`;
        const isActive = activeChannelSet.has(key);

        return (
          <line
            key={`ch-${key}`}
            x1={posA.x} y1={posA.y}
            x2={posB.x} y2={posB.y}
            stroke={isActive ? "#818cf8" : "#334155"}
            strokeWidth={isActive ? 3.5 : 1}
            strokeDasharray={isActive ? undefined : "4 4"}
            opacity={isActive ? 0.9 : 0.25}
            strokeLinecap="round"
          />
        );
      })}

      {/* Centers + gates */}
      {Object.entries(CENTERS).map(([name, layout]) => {
        const defined = centerMap.get(name) ?? false;
        const gatePositions = getGatePositions(name, gates, layout.x, layout.y, layout.size);

        return (
          <g key={name}>
            <CenterShape layout={layout} defined={defined} />
            <text
              x={layout.x} y={layout.y + 5}
              textAnchor="middle"
              className="text-[11px] font-bold"
              fill={defined ? "#e2e8f0" : "#64748b"}
              style={{ pointerEvents: "none" }}
            >
              {layout.label}
            </text>

            {gatePositions.map(({ gate, x, y }) => (
              <g key={`gate-${gate}`}>
                <circle
                  cx={x} cy={y} r={11}
                  fill={defined ? layout.color + "20" : "#0f172a"}
                  stroke={defined ? layout.color + "80" : "#475569"}
                  strokeWidth={1.2}
                />
                <text
                  x={x} y={y + 4}
                  textAnchor="middle"
                  className="text-[9px] font-mono font-bold"
                  fill={defined ? "#e2e8f0" : "#94a3b8"}
                  style={{ pointerEvents: "none" }}
                >
                  {gate}
                </text>
              </g>
            ))}
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${CX - 140}, ${VIEW_H - 28})`}>
        <circle cx={6} cy={6} r={5} fill="#eab30840" stroke="#eab308" strokeWidth={1.5} />
        <text x={18} y={10} className="text-[10px]" fill="#94a3b8">已定義</text>
        <circle cx={80} cy={6} r={5} fill="transparent" stroke="#475569" strokeWidth={1.5} />
        <text x={92} y={10} className="text-[10px]" fill="#94a3b8">開放</text>
        <line x1={140} y1={6} x2={164} y2={6} stroke="#818cf8" strokeWidth={3} strokeLinecap="round" />
        <text x={172} y={10} className="text-[10px]" fill="#94a3b8">啟動通道</text>
      </g>
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function BodyGraph({ centers, gates, channels }: BodyGraphProps) {
  const [zoomed, setZoomed] = useState(false);

  const centerMap = useMemo(
    () => new Map(centers.map((c) => [c.name, c.defined])),
    [centers],
  );

  const activeChannelSet = useMemo(() => {
    const set = new Set<string>();
    for (const ch of channels) {
      const parts = ch.split("-").map(Number).sort((a, b) => a - b);
      set.add(`${parts[0]}-${parts[1]}`);
    }
    return set;
  }, [channels]);

  const sharedProps = { centers, gates, channels, activeChannelSet, centerMap };

  return (
    <>
      {/* Normal view — click to zoom */}
      <div
        className="relative cursor-zoom-in group"
        onClick={() => setZoomed(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setZoomed(true)}
        aria-label="點擊放大人類圖"
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full max-w-sm mx-auto"
          role="img"
          aria-label="人類圖身體圖"
        >
          <BodyGraphSVG {...sharedProps} />
        </svg>
        {/* Zoom hint */}
        <div className="absolute bottom-2 right-2 bg-slate-800/80 rounded-lg px-2 py-1 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          🔍 點擊放大
        </div>
      </div>

      {/* Zoom modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-label="人類圖放大檢視"
        >
          <div
            className="relative bg-slate-950 rounded-2xl border border-slate-700 p-4 max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setZoomed(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white text-lg z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
              aria-label="關閉"
            >
              ✕
            </button>

            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="w-full"
              role="img"
              aria-label="人類圖身體圖（放大）"
            >
              <BodyGraphSVG {...sharedProps} />
            </svg>
          </div>
        </div>
      )}
    </>
  );
}
