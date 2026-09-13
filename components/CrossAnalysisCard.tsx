"use client";

import type { CrossAnalysis } from "@/app/api/cross-analysis/route";

interface Props {
  analysis: CrossAnalysis;
  name?: string;
}

const SYSTEM_BADGE_COLORS: Record<string, string> = {
  "紫微斗數": "bg-accent-soft text-accent border-accent/30",
  "八字":     "bg-accent-soft text-accent border-accent/30",
  "人類圖":   "bg-accent-soft text-accent border-accent/30",
  "星座":     "bg-accent-soft text-accent border-accent/30",
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
    <div className="bg-card border border-line rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-accent">
          {name ? `${name} 的人生使用說明書` : "人生使用說明書"}
        </h2>
        <p className="text-xs text-muted mt-1">
          AI 四系統交叉分析 — 紫微斗數 × 八字 × 人類圖 × 星座
        </p>
      </div>

      {/* Portrait */}
      <div className="bg-accent-soft border border-accent/20 rounded-xl p-5">
        <p className="text-xs text-accent/70 mb-2">核心人格畫像</p>
        {analysis.tagline && (
          <p className="text-accent font-semibold text-base mb-3">
            「{analysis.tagline}」
          </p>
        )}
        <p className="text-ink text-sm leading-relaxed">
          {analysis.portrait}
        </p>
      </div>

      {/* Resonances */}
      {analysis.resonances.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-3">共振信號 — 多系統交叉驗證</p>
          <div className="space-y-3">
            {analysis.resonances.map((r, i) => (
              <div key={i} className="bg-paper border border-line rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-ink font-medium text-sm">{r.theme}</span>
                  <div className="flex flex-wrap gap-1">
                    {r.systems.map((sys) => (
                      <span
                        key={sys}
                        className={`px-1.5 py-0.5 rounded text-[10px] border whitespace-nowrap ${
                          SYSTEM_BADGE_COLORS[sys] ?? "bg-line/20 text-ink/70 border-line"
                        }`}
                      >
                        {sys}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-ink/80 text-sm leading-relaxed">{r.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tensions */}
      {analysis.tensions.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-3">張力與互補 — 系統間的矛盾</p>
          <div className="space-y-3">
            {analysis.tensions.map((t, i) => (
              <div key={i} className="bg-gold/10 border border-gold/40 rounded-lg p-4">
                <p className="text-gold font-medium text-sm mb-1">{t.theme}</p>
                <p className="text-ink/80 text-sm leading-relaxed">{t.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Life Aspects — 6-grid */}
      <div>
        <p className="text-xs text-muted mb-3">人生各面向深度解讀</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LIFE_ASPECT_CONFIG.map(({ key, label, icon }) => (
            <div key={key} className="bg-paper border border-line rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{icon}</span>
                <span className="text-ink font-medium text-sm">{label}</span>
              </div>
              <p className="text-muted text-sm leading-relaxed">
                {analysis.lifeAspects[key]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Yearly Insight */}
      {analysis.yearlyInsight && (
        <div>
          <p className="text-xs text-muted mb-3">流年重點</p>
          <div className="bg-accent-soft border border-accent/20 rounded-xl p-5">
            <p className="text-ink text-sm leading-relaxed">
              {analysis.yearlyInsight}
            </p>
          </div>
        </div>
      )}

      {/* Guidance */}
      <div className="border-t border-line pt-4">
        <p className="text-xs text-muted mb-2">核心行動建議</p>
        <p className="text-accent text-sm font-medium italic">
          {analysis.guidance}
        </p>
      </div>
    </div>
  );
}
