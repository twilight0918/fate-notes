// ─── 標準人體圖（Human Design bodygraph） ────────────────────────────────────
// 幾何取自 hdkit／natalengine 的標準版型（utils/hd-bodygraph-geometry.ts，MIT）：
// 中心形狀與朝向、64 個閘門在中心邊上的位置、每個閘門一段「半通道」。
// 閘門啟動 → 那段半通道塗滿；兩端都啟動就連成完整通道，只有一端就是懸掛閘門。
// 顏色全走 CSS 變數，網頁（深色）與 HTML 報告（紙本／深色）各自覆寫。
// 註：免費版 API 不分個性（黑）／設計（紅），所以啟動一律用同一個顏色。

import { GATE_PATHS, CENTER_SHAPES, GATE_CIRCLE_POSITIONS } from "@/utils/hd-bodygraph-geometry";

interface Props {
  centers: { name: string; defined: boolean }[];
  gates: number[];
  channels: string[]; // e.g. ["1-8", "3-60"]
  className?: string;
}

const VIEW_W = 851.41;
const VIEW_H = 1309.4;
const PAD = 16;

/** API 的中心名稱 → 幾何資料的鍵 */
const CENTER_KEY: Record<string, string> = {
  Head: "Head", Ajna: "Ajna", Throat: "Throat", G: "G", Heart: "Ego",
  Sacral: "Sacral", "Solar Plexus": "SolarPlexus", Spleen: "Spleen", Root: "Root",
};

/** 傳統配色：頭腦／G 黃、邏輯綠、意志力／薦骨紅、其餘棕 */
const CENTER_COLOR: Record<string, string> = {
  Head: "#e9d56b", Ajna: "#a3c46c", Throat: "#c2a06b", G: "#e9d56b", Ego: "#dd6356",
  Sacral: "#dd6356", SolarPlexus: "#c2a06b", Spleen: "#c2a06b", Root: "#c2a06b",
};

const STYLE = `
.hdg-path{fill:var(--hdg-channel,#ebe6de)}
.hdg-path.on{fill:var(--hdg-active,#2a2520)}
.hdg-center{fill:var(--hdg-open,#ffffff);stroke:var(--hdg-stroke,#c9c0b4);stroke-width:1.5}
.hdg-center.on{stroke:none}
.hdg-gate{fill:var(--hdg-open,#ffffff);stroke:var(--hdg-stroke,#c9c0b4);stroke-width:1}
.hdg-center.on~.hdg-gate{fill:none}
.hdg-gate.on{fill:var(--hdg-active,#2a2520);stroke:none}
.hdg-num{font:500 11px system-ui,sans-serif;fill:var(--hdg-num,#9a9086);text-anchor:middle}
.hdg-num.on{font-weight:700;fill:var(--hdg-num-on,#ffffff)}
`;

export default function BodyGraphStandard({ centers, gates, channels, className }: Props) {
  const active = new Set<number>(gates);
  for (const ch of channels) {
    for (const g of ch.split("-").map(Number)) if (Number.isFinite(g)) active.add(g);
  }
  const defined = new Set(
    centers.filter((c) => c.defined).map((c) => CENTER_KEY[c.name]).filter(Boolean),
  );

  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${VIEW_W + PAD * 2} ${VIEW_H + PAD * 2}`}
      className={className}
      role="img"
      aria-label={`人類圖身體圖：已定義 ${defined.size} 個中心、啟動 ${active.size} 個閘門`}
    >
      <style>{STYLE}</style>

      {/* 半通道：每個閘門一段 */}
      <g>
        {Object.entries(GATE_PATHS).map(([g, d]) => (
          <path key={g} d={d} className={`hdg-path${active.has(Number(g)) ? " on" : ""}`} />
        ))}
      </g>

      {/* 九個中心 */}
      <g>
        {Object.entries(CENTER_SHAPES).map(([key, shape]) => {
          const on = defined.has(key);
          return (
            <path
              key={key}
              d={shape.path}
              className={`hdg-center${on ? " on" : ""}`}
              style={on ? { fill: CENTER_COLOR[key] } : undefined}
            />
          );
        })}
      </g>

      {/* 閘門號碼 */}
      <g>
        {Object.entries(GATE_CIRCLE_POSITIONS).map(([g, c]) => {
          const on = active.has(Number(g));
          return (
            <g key={g}>
              <circle cx={c.cx} cy={c.cy} r={c.r} className={`hdg-gate${on ? " on" : ""}`} />
              <text x={c.cx} y={c.cy + 4} className={`hdg-num${on ? " on" : ""}`}>{g}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
