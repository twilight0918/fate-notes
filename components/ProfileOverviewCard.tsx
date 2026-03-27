"use client";

// ─── MBTI Chinese name mapping ────────────────────────────────────────────────
const MBTI_CN: Record<string, string> = {
  INTJ: "建築師", INTP: "邏輯學家", ENTJ: "指揮官", ENTP: "辯論家",
  INFJ: "提倡者", INFP: "調停者", ENFJ: "主人公", ENFP: "競選者",
  ISTJ: "物流師", ISFJ: "守衛者", ESTJ: "總經理", ESFJ: "執政官",
  ISTP: "鑑賞家", ISFP: "探險家", ESTP: "企業家", ESFP: "表演者",
};

// ─── Enneagram Chinese name mapping ──────────────────────────────────────────
const ENNEAGRAM_CN: Record<number, string> = {
  1: "完美主義者", 2: "助人者", 3: "成就者",
  4: "個人主義者", 5: "觀察者", 6: "忠誠者",
  7: "享樂主義者", 8: "挑戰者", 9: "和平者",
};

// ─── Human Design type Chinese mapping ───────────────────────────────────────
const HD_TYPE_CN: Record<string, string> = {
  Generator: "生產者",
  "Manifesting Generator": "顯示生產者",
  Projector: "投射者",
  Manifestor: "顯示者",
  Reflector: "反映者",
};

// ─── Props ───────────────────────────────────────────────────────────────────
export interface ProfileOverviewProps {
  name?: string;
  ziwei: {
    soulPalaceMajorStars: string[];
    soul: string;
    body: string;
  };
  bazi?: {
    dayMaster: string;
    dayMasterStrength: string;
    dominantElement: string;
  };
  humanDesign?: {
    type: string;
    profile: string;
  };
  zodiac: {
    sun: string;
    moon?: string;
    rising?: string;
  };
  mbti?: string;
  enneagram?: number;
  tagline?: string;
}

// ─── Row component ──────────────────────────────────────────────────────────
function OverviewRow({
  icon,
  label,
  value,
  color = "text-slate-300",
}: {
  icon: string;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-baseline gap-3 py-1.5">
      <span className="text-sm w-5 text-center flex-shrink-0">{icon}</span>
      <span className="text-xs text-slate-500 w-16 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function ProfileOverviewCard({
  name,
  ziwei,
  bazi,
  humanDesign,
  zodiac,
  mbti,
  enneagram,
  tagline,
}: ProfileOverviewProps) {
  // Build zodiac display: ☀️太陽 · 🌙月亮 · ⬆️上升
  const zodiacParts: string[] = [`☀️${zodiac.sun}`];
  if (zodiac.moon) zodiacParts.push(`🌙${zodiac.moon}`);
  if (zodiac.rising) zodiacParts.push(`⬆️${zodiac.rising}`);
  const zodiacDisplay = zodiacParts.join(" · ");

  // Build ziwei display: major stars or soul/body
  const majorStarsDisplay = ziwei.soulPalaceMajorStars.length > 0
    ? ziwei.soulPalaceMajorStars.join("、") + "坐命"
    : "無主星坐命";
  const ziweiDisplay = `${majorStarsDisplay} · ${ziwei.soul}/${ziwei.body}`;

  // Build bazi display
  const baziDisplay = bazi
    ? `${bazi.dayMaster}日主 · ${bazi.dayMasterStrength} · ${bazi.dominantElement}旺`
    : null;

  // Build HD display
  const hdDisplay = humanDesign
    ? `${HD_TYPE_CN[humanDesign.type] ?? humanDesign.type} · ${humanDesign.profile} 人格線`
    : null;

  // Build MBTI display
  const mbtiDisplay = mbti
    ? `${mbti} · ${MBTI_CN[mbti] ?? ""}`
    : null;

  // Build enneagram display
  const enneagramDisplay = enneagram
    ? `Type ${enneagram} · ${ENNEAGRAM_CN[enneagram] ?? ""}`
    : null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-indigo-500/20 rounded-2xl p-6">
      {/* Header */}
      <h2 className="text-base font-semibold text-indigo-400 mb-4">
        {name ? `${name} 的人格總覽` : "人格總覽"}
      </h2>

      {/* System rows */}
      <div className="divide-y divide-slate-800/50">
        <OverviewRow icon="🟣" label="紫微" value={ziweiDisplay} color="text-violet-300" />
        {baziDisplay && (
          <OverviewRow icon="🔴" label="八字" value={baziDisplay} color="text-amber-300" />
        )}
        {hdDisplay && (
          <OverviewRow icon="🔵" label="人類圖" value={hdDisplay} color="text-cyan-300" />
        )}
        <OverviewRow icon="⭐" label="星座" value={zodiacDisplay} color="text-yellow-300" />
        {mbtiDisplay && (
          <OverviewRow icon="🟢" label="MBTI" value={mbtiDisplay} color="text-emerald-300" />
        )}
        {enneagramDisplay && (
          <OverviewRow icon="🟠" label="九型" value={enneagramDisplay} color="text-orange-300" />
        )}
      </div>

      {/* Tagline */}
      {tagline && (
        <div className="mt-4 pt-4 border-t border-slate-800/50">
          <p className="text-sm text-slate-300 italic text-center leading-relaxed">
            「{tagline}」
          </p>
        </div>
      )}
    </div>
  );
}
