"use client";

import type { CrossAnalysis } from "@/app/api/cross-analysis/route";

interface Props {
  analysis: CrossAnalysis;
  name?: string;
}

const SYSTEM_BADGE_COLORS: Record<string, string> = {
  "紫微斗數": "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  "八字":     "bg-amber-500/20 text-amber-300 border-amber-500/40",
  "人類圖":   "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  "星座":     "bg-pink-500/20 text-pink-300 border-pink-500/40",
};

const LIFE_ASPECT_CONFIG: { key: keyof CrossAnalysis["lifeAspects"]; label: string; icon: string }[] = [
  { key: "career",  label: "事業",     icon: "💼" },
  { key: "wealth",  label: "財富",     icon: "💰" },
  { key: "love",    label: "感情",     icon: "💕" },
  { key: "family",  label: "家庭",     icon: "🏠" },
  { key: "health",  label: "健康",     icon: "🌿" },
  { key: "growth",  label: "個人成長", icon: "🌱" },
];

export default function CrossAnalysisCard({ analysis, name }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-violet-400">
          {name ? `${name} 的人生使用說明書` : "人生使用說明書"}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          AI 四系統交叉分析 — 紫微斗數 × 八字 × 人類圖 × 星座
        </p>
      </div>

      {/* Portrait */}
      <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-xl p-5">
        <p className="text-xs text-violet-300/70 mb-2">核心人格畫像</p>
        {analysis.tagline && (
          <p className="text-violet-300 font-semibold text-base mb-3">
            「{analysis.tagline}」
          </p>
        )}
        <p className="text-slate-200 text-sm leading-relaxed">
          {analysis.portrait}
        </p>
      </div>

      {/* Resonances */}
      {analysis.resonances.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-3">共振信號 — 多系統交叉驗證</p>
          <div className="space-y-3">
            {analysis.resonances.map((r, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-white font-medium text-sm">{r.theme}</span>
                  <div className="flex flex-wrap gap-1">
                    {r.systems.map((sys) => (
                      <span
                        key={sys}
                        className={`px-1.5 py-0.5 rounded text-[10px] border whitespace-nowrap ${
                          SYSTEM_BADGE_COLORS[sys] ?? "bg-slate-700 text-slate-300 border-slate-600"
                        }`}
                      >
                        {sys}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{r.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tensions */}
      {analysis.tensions.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-3">張力與互補 — 系統間的矛盾</p>
          <div className="space-y-3">
            {analysis.tensions.map((t, i) => (
              <div key={i} className="bg-amber-900/15 border border-amber-700/30 rounded-lg p-4">
                <p className="text-amber-300 font-medium text-sm mb-1">{t.theme}</p>
                <p className="text-slate-300 text-sm leading-relaxed">{t.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Life Aspects — 6-grid */}
      <div>
        <p className="text-xs text-slate-500 mb-3">人生各面向深度解讀</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LIFE_ASPECT_CONFIG.map(({ key, label, icon }) => (
            <div key={key} className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{icon}</span>
                <span className="text-slate-300 font-medium text-sm">{label}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                {analysis.lifeAspects[key]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Yearly Insight */}
      {analysis.yearlyInsight && (
        <div>
          <p className="text-xs text-slate-500 mb-3">流年重點</p>
          <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-xl p-5">
            <p className="text-slate-200 text-sm leading-relaxed">
              {analysis.yearlyInsight}
            </p>
          </div>
        </div>
      )}

      {/* Guidance */}
      <div className="border-t border-slate-800 pt-4">
        <p className="text-xs text-slate-500 mb-2">核心行動建議</p>
        <p className="text-violet-300 text-sm font-medium italic">
          {analysis.guidance}
        </p>
      </div>
    </div>
  );
}
