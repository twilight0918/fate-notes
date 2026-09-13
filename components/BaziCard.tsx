"use client";

import type { BaziAnalysis } from "@/app/api/analyze/route";
import Tooltip from "@/components/Tooltip";
import { getTooltipProps } from "@/utils/glossary";

interface Props {
  analysis: BaziAnalysis;
  chineseDate: string;
  fiveElementsClass: string;
}

const ELEMENT_COLORS: Record<string, string> = {
  木: "text-wood",
  火: "text-fire",
  土: "text-earth",
  金: "text-metal",
  水: "text-water",
};

const STRENGTH_BADGE: Record<string, string> = {
  身強: "bg-gold/20 text-gold border-gold/40",
  身弱: "bg-water/20 text-water border-water/40",
  中和: "bg-accent-soft text-accent border-accent/30",
};

export default function BaziCard({ analysis, chineseDate, fiveElementsClass }: Props) {
  return (
    <div className="bg-card border border-line rounded-2xl p-6 space-y-5">
      <h2 className="text-lg font-semibold text-accent">八字分析</h2>

      {/* 四柱 */}
      <div className="bg-paper border border-line rounded-lg p-3">
        <span className="block text-xs text-muted mb-1">
          <Tooltip {...getTooltipProps("bazi.field.chineseDate")}>
            <span>四柱干支（iztro 計算）</span>
          </Tooltip>
        </span>
        <p className="text-ink font-mono">{chineseDate}</p>
        <span className="block text-xs text-muted mt-2">
          <Tooltip {...getTooltipProps("bazi.field.fiveElementsClass")}>
            <span>五行局：{fiveElementsClass}</span>
          </Tooltip>
        </span>
      </div>

      {/* 日主 + 身強弱 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-paper border border-line rounded-lg p-3">
          <span className="block text-xs text-muted mb-1">
            <Tooltip {...getTooltipProps("bazi.field.dayMaster")}>
              <span>日主</span>
            </Tooltip>
          </span>
          <p className="text-ink font-semibold">{analysis.dayMaster}</p>
        </div>
        <Tooltip {...getTooltipProps("bazi.field.dayMasterStrength", `bazi.value.${analysis.dayMasterStrength}`)}>
          <div
            className={`px-3 py-1 rounded-full border text-sm font-medium ${
              STRENGTH_BADGE[analysis.dayMasterStrength] ??
              "bg-line/20 text-ink/70 border-line"
            }`}
          >
            {analysis.dayMasterStrength}
          </div>
        </Tooltip>
      </div>

      {/* 五行強弱 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-paper border border-line rounded-lg p-3">
          <span className="block text-xs text-muted mb-1">
            <Tooltip {...getTooltipProps("bazi.field.dominantElement", `bazi.value.${analysis.dominantElement}`)}>
              <span>最旺五行</span>
            </Tooltip>
          </span>
          <p className={`font-semibold ${ELEMENT_COLORS[analysis.dominantElement] ?? "text-ink"}`}>
            {analysis.dominantElement}
          </p>
        </div>
        <div className="bg-paper border border-line rounded-lg p-3">
          <span className="block text-xs text-muted mb-1">
            <Tooltip {...getTooltipProps("bazi.field.lackingElement", `bazi.value.${analysis.lackingElement}`)}>
              <span>最弱五行</span>
            </Tooltip>
          </span>
          <p className={`font-semibold ${ELEMENT_COLORS[analysis.lackingElement] ?? "text-muted"}`}>
            {analysis.lackingElement}
          </p>
        </div>
      </div>

      {/* 性格特質 */}
      <div>
        <span className="block text-xs text-muted mb-2">
          <Tooltip {...getTooltipProps("bazi.field.personalityTraits")}>
            <span>核心特質</span>
          </Tooltip>
        </span>
        <div className="flex flex-wrap gap-2">
          {analysis.personalityTraits.map((trait) => (
            <span
              key={trait}
              className="px-2 py-1 bg-paper rounded-full text-xs text-ink/80 border border-line whitespace-nowrap"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      {/* 命局摘要 */}
      <div className="bg-paper border border-line rounded-lg p-4">
        <span className="block text-xs text-muted mb-2">
          <Tooltip {...getTooltipProps("bazi.field.summary")}>
            <span>命局解讀</span>
          </Tooltip>
        </span>
        <p className="text-ink text-sm leading-relaxed">{analysis.summary}</p>
      </div>

      {/* 交叉觀察 */}
      <div className="border-t border-line pt-4">
        <span className="block text-xs text-muted mb-1">
          <Tooltip {...getTooltipProps("bazi.field.crossSystemNote")}>
            <span>跨系統觀察（紫微 × 八字 × 星座）</span>
          </Tooltip>
        </span>
        <p className="text-accent text-sm italic">{analysis.crossSystemNote}</p>
      </div>
    </div>
  );
}
