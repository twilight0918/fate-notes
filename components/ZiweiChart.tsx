"use client";

import type { PalaceData } from "@/utils/iztro-helpers";
import Tooltip from "@/components/Tooltip";
import ExpandableSection from "@/components/ExpandableSection";
import { getValueDesc, normalizePalaceName } from "@/utils/glossary";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ZiweiChartProps {
  palaces: PalaceData[];
  fiveElementsClass: string;
  soul: string;
  body: string;
  lunarDate: string;
  captureMode?: boolean;
}

// ─── Grid mapping: earthly branch → CSS grid position (1-indexed) ────────────

export const BRANCH_GRID: Record<string, { row: number; col: number }> = {
  "巳": { row: 1, col: 1 }, "午": { row: 1, col: 2 }, "未": { row: 1, col: 3 }, "申": { row: 1, col: 4 },
  "辰": { row: 2, col: 1 },                                                     "酉": { row: 2, col: 4 },
  "卯": { row: 3, col: 1 },                                                     "戌": { row: 3, col: 4 },
  "寅": { row: 4, col: 1 }, "丑": { row: 4, col: 2 }, "子": { row: 4, col: 3 }, "亥": { row: 4, col: 4 },
};

// ─── Build tooltip descriptions for a palace ────────────────────────────────

function buildPalaceTooltip(palace: PalaceData): { fieldDesc?: string; valueDesc?: string } {
  const normalized = normalizePalaceName(palace.name);
  const fieldDesc = getValueDesc(`ziwei.value.palace.${normalized}`);

  let valueDesc: string | undefined;
  if (palace.majorStars.length > 0) {
    valueDesc = palace.majorStars
      .map((s) => {
        const desc = getValueDesc(`ziwei.value.${s}.in.${normalized}`)
          ?? getValueDesc(`ziwei.value.${s}`);
        return desc ? `${s}：${desc}` : null;
      })
      .filter(Boolean)
      .join("\n") || undefined;
  } else {
    valueDesc = getValueDesc("ziwei.value.無主星") ?? undefined;
  }

  return { fieldDesc, valueDesc };
}

// ─── Palace cell ─────────────────────────────────────────────────────────────

function PalaceCell({ palace, style }: { palace: PalaceData; style: React.CSSProperties }) {
  const borderColor = palace.isSoulPalace
    ? "border-accent"
    : palace.isBodyPalace
    ? "border-gold"
    : "border-line";

  const tooltipProps = buildPalaceTooltip(palace);

  return (
    <div
      className={`bg-card border ${borderColor} p-1.5 sm:p-2 flex flex-col min-h-[72px] sm:min-h-[88px]`}
      style={style}
    >
      {/* Palace name + heavenly stem / earthly branch */}
      <div className="flex items-start justify-between gap-0.5 mb-0.5">
        <Tooltip {...tooltipProps}>
          <span className="text-[10px] sm:text-xs font-bold text-ink leading-tight">
            {palace.name}
            {palace.isSoulPalace && <span className="text-accent ml-0.5">[命]</span>}
            {palace.isBodyPalace && <span className="text-gold ml-0.5">[身]</span>}
          </span>
        </Tooltip>
        <span className="text-[8px] sm:text-[10px] text-muted/70 whitespace-nowrap">
          {palace.heavenlyStem}{palace.earthlyBranch}
        </span>
      </div>

      {/* Major stars */}
      <div className="text-[10px] sm:text-[11px] text-accent leading-tight font-medium">
        {palace.majorStars.length > 0
          ? palace.majorStars.join(" ")
          : <span className="text-muted/70">無主星</span>
        }
      </div>

      {/* Minor stars */}
      {palace.minorStars.length > 0 && (
        <div className="text-[8px] sm:text-[9px] text-muted leading-tight mt-auto pt-0.5">
          {palace.minorStars.slice(0, 4).join(" ")}
          {palace.minorStars.length > 4 && " …"}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ZiweiChart({ palaces, fiveElementsClass, soul, body, lunarDate, captureMode }: ZiweiChartProps) {
  return (
    <div className="bg-card border border-line rounded-2xl p-4 sm:p-6">
      <h2 className="text-base font-semibold text-accent mb-4">紫微命盤</h2>

      {/* 手機上四欄硬塞會擠到看不清：命盤保持最小寬度，在框內左右滑動 */}
      <p className="sm:hidden text-[11px] text-muted mb-2">← 命盤可左右滑動 →</p>
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <div className="grid grid-cols-4 rounded-lg min-w-[31rem]">
        {/* 12 palace cells — positioned by earthly branch */}
        {palaces.map((palace) => {
          const pos = BRANCH_GRID[palace.earthlyBranch];
          if (!pos) return null;
          return (
            <PalaceCell
              key={palace.name}
              palace={palace}
              style={{ gridRow: pos.row, gridColumn: pos.col }}
            />
          );
        })}

        {/* Center info — spans middle 2×2 */}
        <div
          className="bg-paper border border-line p-3 flex flex-col items-center justify-center text-center"
          style={{ gridRow: "2 / 4", gridColumn: "2 / 4" }}
        >
          <p className="text-accent font-bold text-sm mb-1.5">紫微命盤</p>
          <p className="text-muted text-xs">{lunarDate}</p>
          <p className="text-muted text-xs">{fiveElementsClass}</p>
          <div className="mt-2 flex gap-3 text-xs">
            <span>
              <span className="text-muted">命主 </span>
              <span className="text-ink font-medium">{soul}</span>
            </span>
            <span>
              <span className="text-muted">身主 </span>
              <span className="text-ink font-medium">{body}</span>
            </span>
          </div>
        </div>
      </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-[10px] text-muted">
        <span><span className="inline-block w-2.5 h-2.5 border-2 border-accent rounded-sm mr-1 align-middle" />命宮</span>
        <span><span className="inline-block w-2.5 h-2.5 border-2 border-gold rounded-sm mr-1 align-middle" />身宮</span>
        <span><span className="text-accent">■</span> 主星</span>
      </div>
      <div className="mt-2 text-[10px] text-muted/70 space-y-0.5">
        <p>命宮：代表你天生的性格、才華和核心特質，是命盤中最重要的宮位。</p>
        <p>身宮：代表後天的發展方向和行為模式，反映你在人生經驗中逐漸展現的樣貌。</p>
      </div>

      {/* Expandable detailed interpretation */}
      <ExpandableSection title="📖 命盤解讀" forceOpen={captureMode}>
        {palaces.map((palace) => {
          const normalized = normalizePalaceName(palace.name);
          const palaceDesc = getValueDesc(`ziwei.value.palace.${normalized}`);
          const { valueDesc } = buildPalaceTooltip(palace);

          return (
            <div key={palace.name} className="text-ink/80">
              <p className="font-medium text-ink text-xs">
                {palace.name}
                {palace.isSoulPalace && <span className="text-accent ml-1">[命宮]</span>}
                {palace.isBodyPalace && <span className="text-gold ml-1">[身宮]</span>}
                {palaceDesc && <span className="text-muted font-normal"> — {palaceDesc}</span>}
              </p>
              {valueDesc ? (
                <div className="ml-3 mt-0.5 text-xs text-muted whitespace-pre-line">
                  {valueDesc}
                </div>
              ) : (
                <p className="ml-3 mt-0.5 text-xs text-muted/70">
                  {getValueDesc("ziwei.value.無主星") ?? "此宮位無主星"}
                </p>
              )}
            </div>
          );
        })}
      </ExpandableSection>
    </div>
  );
}
