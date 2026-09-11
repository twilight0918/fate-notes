"use client";

import type { YearlyFortune } from "@/utils/iztro-helpers";
import Tooltip from "@/components/Tooltip";
import ExpandableSection from "@/components/ExpandableSection";
import { getTooltipProps, getValueDesc, normalizePalaceName } from "@/utils/glossary";

export const MUTAGEN_LABELS = ["化祿", "化權", "化科", "化忌"] as const;
const MUTAGEN_COLORS = [
  "text-green-400",   // 祿
  "text-amber-400",   // 權
  "text-cyan-400",    // 科
  "text-red-400",     // 忌
];

/** 四化落入宮位的白話影響 — 用於流年解讀面板 */
export const MUTAGEN_YEARLY_EFFECT: Record<string, string> = {
  "化祿": "這個領域今年會比較順利，容易有收穫和好運",
  "化權": "這個領域今年你會更有主導權和決策力",
  "化科": "這個領域今年容易得到貴人相助或獲得認可",
  "化忌": "這個領域今年需要特別留意，可能會遇到卡關或波折",
};

/** 四化的白話定位說明 — 用於解釋每個四化「是什麼」 */
export const MUTAGEN_PLAIN_DESC: Record<string, string> = {
  "化祿": "化祿落在哪顆星所在的宮位，那個領域今年比較順，容易有好事",
  "化權": "化權落在哪顆星所在的宮位，那個領域今年你會更有掌控力和決策權",
  "化科": "化科落在哪顆星所在的宮位，那個領域今年容易得貴人、被看見",
  "化忌": "化忌落在哪顆星所在的宮位，那個領域今年容易卡關或需要多費心",
};

export default function YearlyFortuneCard({ fortune, captureMode }: { fortune: YearlyFortune; captureMode?: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-base font-semibold text-indigo-400">
          流年運勢
        </h2>
        <span className="text-sm text-slate-400">
          {fortune.year} 年（{fortune.heavenlyStem}{fortune.earthlyBranch}年）
        </span>
      </div>

      {/* 四化 */}
      <div className="mb-4">
        <Tooltip {...getTooltipProps("ziwei.field.yearlyMutagen")}>
          <h3 className="text-xs text-slate-500 mb-2">流年四化</h3>
        </Tooltip>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {fortune.mutagen.map((starName, i) => (
            <div key={i} className="bg-slate-800 rounded-lg p-2.5 text-center">
              <Tooltip
                fieldDesc={getValueDesc(`ziwei.value.${MUTAGEN_LABELS[i]}`)}
                valueDesc={getValueDesc(`ziwei.value.${starName}`) ?? undefined}
              >
                <span className={`text-xs font-medium ${MUTAGEN_COLORS[i]} mb-0.5`}>
                  {MUTAGEN_LABELS[i]}
                </span>
              </Tooltip>
              <div className="text-sm text-white font-medium mt-0.5">{starName}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 重點宮位 */}
      <div>
        <Tooltip {...getTooltipProps("ziwei.field.yearlyKeyPalace")}>
          <h3 className="text-xs text-slate-500 mb-2">重點宮位</h3>
        </Tooltip>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fortune.keyPalaces.map((palace) => {
            const normalized = normalizePalaceName(palace.name);
            const starDesc = palace.majorStars.length > 0
              ? palace.majorStars
                  .map((s) => {
                    const desc = getValueDesc(`ziwei.value.${s}.in.${normalized}`)
                      ?? getValueDesc(`ziwei.value.${s}`);
                    return desc ? `${s}：${desc}` : null;
                  })
                  .filter(Boolean)
                  .join("\n") || undefined
              : getValueDesc("ziwei.value.無主星") ?? undefined;

            return (
              <div key={palace.name} className="bg-slate-800 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <Tooltip
                    fieldDesc={getValueDesc(`ziwei.value.palace.${normalized}`)}
                    valueDesc={starDesc}
                  >
                    <span className="text-xs font-medium text-slate-300">{palace.name}</span>
                  </Tooltip>
                  <span className="text-[10px] text-slate-600">
                    {palace.heavenlyStem}{palace.earthlyBranch}
                  </span>
                </div>
                <div className="text-[11px] text-amber-300">
                  {palace.majorStars.length > 0
                    ? palace.majorStars.join("、")
                    : <span className="text-slate-600">無主星</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expandable detailed interpretation */}
      <ExpandableSection title="📖 流年解讀" forceOpen={captureMode}>
        {/* 四化解讀 */}
        <div className="text-slate-300">
          <p className="font-medium text-slate-200 text-xs mb-1">流年四化</p>
          <p className="ml-3 text-[11px] text-slate-500 mb-2">
            四化是今年的四股主要能量，分別影響你人生中的不同領域。
          </p>
          {fortune.mutagen.map((starName, i) => {
            const starDesc = getValueDesc(`ziwei.value.${starName}`);
            return (
              <div key={i} className="ml-3 text-xs text-slate-400 mb-2">
                <span className={MUTAGEN_COLORS[i]}>{MUTAGEN_LABELS[i]}</span>
                <span className="text-slate-500">（{starName}）</span>
                <span className="block ml-3 text-slate-500 mt-0.5">
                  {MUTAGEN_PLAIN_DESC[MUTAGEN_LABELS[i]]}
                </span>
                {starDesc && (
                  <span className="block ml-3 text-slate-500">
                    {starName}：{starDesc}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 重點宮位解讀（含流年四化影響） */}
        <div className="text-slate-300">
          <p className="font-medium text-slate-200 text-xs mb-1">重點宮位（今年能量走向）</p>
          <p className="ml-3 text-[11px] text-slate-500 mb-2">
            以下為今年六大重點宮位的能量分析。每個宮位代表人生的一個面向，主星是這個領域的核心能量，而四化則是今年特別加強或需要注意的部分。
          </p>
          {fortune.keyPalaces.map((palace) => {
            const normalized = normalizePalaceName(palace.name);
            const palaceDesc = getValueDesc(`ziwei.value.palace.${normalized}`);

            // Cross-reference: which 四化 stars fall in this palace?
            const mutagenHitsInPalace = palace.majorStars
              .map((star) => {
                const idx = fortune.mutagen.indexOf(star);
                return idx >= 0 ? { star, label: MUTAGEN_LABELS[idx], color: MUTAGEN_COLORS[idx] } : null;
              })
              .filter(Boolean) as { star: string; label: string; color: string }[];

            return (
              <div key={palace.name} className="ml-3 mb-3">
                {/* Palace header */}
                <p className="text-xs text-slate-300">
                  <span className="font-medium">{palace.name}</span>
                  {palaceDesc && <span className="text-slate-500"> — {palaceDesc}</span>}
                </p>

                {/* 四化 yearly effect callout */}
                {mutagenHitsInPalace.map(({ label, color }) => (
                  <p key={label} className="ml-3 text-xs mt-1">
                    <span className={color}>⭐ 今年{label}能量進入此宮</span>
                    <span className="text-slate-400"> — {MUTAGEN_YEARLY_EFFECT[label]}</span>
                  </p>
                ))}

                {/* Star descriptions with yearly context */}
                {palace.majorStars.length > 0 ? (
                  palace.majorStars.map((s) => {
                    const mutagenIdx = fortune.mutagen.indexOf(s);
                    const hasMutagen = mutagenIdx >= 0;
                    const desc = getValueDesc(`ziwei.value.${s}.in.${normalized}`)
                      ?? getValueDesc(`ziwei.value.${s}`);

                    if (!desc) return null;

                    return (
                      <p key={s} className="ml-3 text-xs text-slate-400 mt-0.5">
                        {hasMutagen ? (
                          <>
                            {s}（今年<span className={MUTAGEN_COLORS[mutagenIdx]}>{MUTAGEN_LABELS[mutagenIdx]}</span>）：{desc}。在今年{MUTAGEN_LABELS[mutagenIdx]}的加持下，這股能量會特別明顯。
                          </>
                        ) : (
                          <>
                            {s}：{desc}（今年做為此宮位的基礎能量）
                          </>
                        )}
                      </p>
                    );
                  })
                ) : (
                  <p className="ml-3 text-xs text-slate-500 mt-0.5">
                    此宮位無主星，能量更靈活——受流年和對面宮位影響，表現因人而異。
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </ExpandableSection>
    </div>
  );
}
