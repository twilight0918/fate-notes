// ─── 單檔 HTML 報告的內容（renderToStaticMarkup 用，不含任何互動元件） ──────
// 閱讀設計：封面放「一眼看完」的結論 → 分頁籤，一次只讀一個系統 →
// 每頁先給一句話結論，細節收在 <details> 裡要看再展開。

import type { BirthFormData } from "@/components/BirthForm";
import type { ZiweiResult, YearlyFortune, PalaceData } from "@/utils/iztro-helpers";
import type { ZodiacInfo } from "@/utils/zodiac";
import type { BaziAnalysis } from "@/app/api/analyze/route";
import type { HumanDesignResult } from "@/app/api/human-design/route";
import type { CrossAnalysis } from "@/app/api/cross-analysis/route";
import BodyGraphStandard from "@/components/BodyGraphStandard";
import { BRANCH_GRID } from "@/components/ZiweiChart";
import { TYPE_CN, CENTER_LABELS, CENTER_DISPLAY_ORDER } from "@/components/HumanDesignCard";
import { MUTAGEN_LABELS, MUTAGEN_YEARLY_EFFECT, MUTAGEN_PLAIN_DESC } from "@/components/YearlyFortuneCard";
import { MBTI_CN, ENNEAGRAM_CN } from "@/components/ProfileOverviewCard";
import { getFieldDesc, getValueDesc, normalizePalaceName } from "@/utils/glossary";
import { formatBirthTime } from "@/utils/birth-time";

export interface ReportData {
  birthData: BirthFormData;
  ziwei: ZiweiResult;
  zodiac: ZodiacInfo;
  yearlyFortune: YearlyFortune;
  baziAnalysis?: BaziAnalysis | null;
  humanDesign?: HumanDesignResult | null;
  crossAnalysis?: CrossAnalysis | null;
  generatedAt: string; // ISO
}

export interface ReportTab {
  id: string;
  label: string;
}

const MUTAGEN_CLASS = ["m-lu", "m-quan", "m-ke", "m-ji"];

const LIFE_ASPECTS: { key: keyof CrossAnalysis["lifeAspects"]; label: string }[] = [
  { key: "career", label: "事業" },
  { key: "wealth", label: "財富" },
  { key: "love", label: "感情" },
  { key: "family", label: "家庭" },
  { key: "health", label: "健康" },
  { key: "growth", label: "個人成長" },
];

const ELEMENT_OF: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
  寅: "木", 卯: "木", 巳: "火", 午: "火", 辰: "土", 戌: "土", 丑: "土", 未: "土", 申: "金", 酉: "金", 亥: "水", 子: "水",
};
const ELEMENT_CLASS: Record<string, string> = { 木: "e-wood", 火: "e-fire", 土: "e-earth", 金: "e-metal", 水: "e-water" };

function hasAspects(cross?: CrossAnalysis | null): boolean {
  return !!cross && LIFE_ASPECTS.some(({ key }) => (cross.lifeAspects?.[key] ?? "").trim());
}

export function getReportTabs(d: ReportData): ReportTab[] {
  const tabs: ReportTab[] = [{ id: "overview", label: "總覽" }];
  if (hasAspects(d.crossAnalysis)) tabs.push({ id: "aspects", label: "人生面向" });
  if (d.baziAnalysis) tabs.push({ id: "bazi", label: "八字" });
  tabs.push({ id: "ziwei", label: "紫微" });
  tabs.push({ id: "zodiac", label: "星座" });
  if (d.humanDesign) tabs.push({ id: "hd", label: "人類圖" });
  tabs.push({ id: "yearly", label: "流年" });
  return tabs;
}

// ─── Small pieces ────────────────────────────────────────────────────────────

function Note({ text }: { text?: string }) {
  return text ? <p className="note">{text}</p> : null;
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
      <Note text={note} />
    </div>
  );
}

function palaceStarDesc(palace: PalaceData): string | undefined {
  const normalized = normalizePalaceName(palace.name);
  if (palace.majorStars.length === 0) return getValueDesc("ziwei.value.無主星");
  return palace.majorStars
    .map((s) => {
      const desc = getValueDesc(`ziwei.value.${s}.in.${normalized}`) ?? getValueDesc(`ziwei.value.${s}`);
      return desc ? `${s}：${desc}` : null;
    })
    .filter(Boolean)
    .join("\n") || undefined;
}

// ─── Cover ───────────────────────────────────────────────────────────────────

function Cover({ d }: { d: ReportData }) {
  const bd = d.birthData;
  const name = bd.name?.trim();
  const soulPalace = d.ziwei.palaces.find((p) => p.isSoulPalace);
  const hd = d.humanDesign;
  const facts: [string, string | undefined][] = [
    ["紫微", `${soulPalace?.majorStars.length ? soulPalace.majorStars.join("、") + "坐命" : "命宮無主星"} · 命主${d.ziwei.soul} · 身主${d.ziwei.body}`],
    ["八字", d.baziAnalysis ? `${d.baziAnalysis.dayMaster} · ${d.baziAnalysis.dayMasterStrength}` : undefined],
    ["星座", [`太陽${d.zodiac.sign}`, d.zodiac.moonSign && `月亮${d.zodiac.moonSign}`, d.zodiac.risingSign && `上升${d.zodiac.risingSign}`].filter(Boolean).join(" · ")],
    ["人類圖", hd ? `${TYPE_CN[hd.type] ?? hd.type}${hd.profile ? ` · ${hd.profile} 人格線` : ""}` : undefined],
    ["MBTI", bd.mbti ? `${bd.mbti} ${MBTI_CN[bd.mbti] ?? ""}`.trim() : undefined],
    ["九型人格", bd.enneagram ? `第 ${bd.enneagram} 型 ${ENNEAGRAM_CN[bd.enneagram] ?? ""}`.trim() : undefined],
  ];

  return (
    <header className="cover">
      <p className="eyebrow">命運手記 · Fate Notes</p>
      <h1>{name ? `${name} 的人生使用說明書` : "人生使用說明書"}</h1>
      <p className="birth">
        {bd.year} 年 {bd.month} 月 {bd.day} 日　{formatBirthTime(bd)}　{bd.city}　{bd.gender === "male" ? "男" : "女"}
      </p>
      {d.crossAnalysis?.tagline && <p className="tagline">{d.crossAnalysis.tagline}</p>}
      <dl className="keyfacts">
        {facts.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

// ─── Panels ──────────────────────────────────────────────────────────────────

function OverviewPanel({ cross }: { cross?: CrossAnalysis | null }) {
  if (!cross) {
    return <p className="lead muted">這份紀錄的交叉分析沒有完成，其他分頁的排盤資料仍然完整。</p>;
  }
  return (
    <>
      <h2>人格畫像</h2>
      <p className="lead">{cross.portrait}</p>

      {cross.resonances.length > 0 && (
        <>
          <h3>共振：多個系統指向同一件事</h3>
          <ol className="items">
            {cross.resonances.map((r, i) => (
              <li key={i}>
                <p className="item-title">
                  {r.theme}
                  <span className="tags">{r.systems.map((s) => <span key={s} className="tag">{s}</span>)}</span>
                </p>
                <p>{r.insight}</p>
              </li>
            ))}
          </ol>
        </>
      )}

      {cross.tensions.length > 0 && (
        <>
          <h3>張力：系統之間的拉扯</h3>
          <ol className="items tension">
            {cross.tensions.map((t, i) => (
              <li key={i}>
                <p className="item-title">{t.theme}</p>
                <p>{t.insight}</p>
              </li>
            ))}
          </ol>
        </>
      )}

      {cross.guidance && (
        <aside className="callout">
          <p className="callout-label">核心行動建議</p>
          <p>{cross.guidance}</p>
        </aside>
      )}
    </>
  );
}

function AspectsPanel({ cross }: { cross: CrossAnalysis }) {
  return (
    <>
      <h2>人生各面向</h2>
      <div className="aspects">
        {LIFE_ASPECTS.filter(({ key }) => (cross.lifeAspects[key] ?? "").trim()).map(({ key, label }) => (
          <section key={key} className="aspect">
            <h3>{label}</h3>
            <p>{cross.lifeAspects[key]}</p>
          </section>
        ))}
      </div>
    </>
  );
}

function BaziPanel({ bazi, ziwei }: { bazi: BaziAnalysis; ziwei: ZiweiResult }) {
  const pillars = ziwei.chineseDate.split(/\s+/).filter(Boolean);
  const pillarNames = ["年柱", "月柱", "日柱", "時柱"];
  return (
    <>
      <h2>八字</h2>
      <p className="lead">{bazi.summary}</p>

      <div className="scroll-x">
        <table className="pillars">
          <thead>
            <tr>{pillars.map((_, i) => <th key={i}>{pillarNames[i] ?? ""}</th>)}</tr>
          </thead>
          <tbody>
            <tr>
              {pillars.map((p, i) => (
                <td key={i}>
                  {[...p].map((ch, j) => (
                    <span key={j} className={`gz ${ELEMENT_CLASS[ELEMENT_OF[ch]] ?? ""}`}>
                      {ch}<small>{ELEMENT_OF[ch] ?? ""}</small>
                    </span>
                  ))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <dl className="facts">
        <Fact label="日主" value={bazi.dayMaster} note={getFieldDesc("bazi.field.dayMaster")} />
        <Fact label="身強弱" value={bazi.dayMasterStrength} note={getValueDesc(`bazi.value.${bazi.dayMasterStrength}`) ?? getFieldDesc("bazi.field.dayMasterStrength")} />
        <Fact label="最旺五行" value={bazi.dominantElement} note={getValueDesc(`bazi.value.${bazi.dominantElement}`)} />
        <Fact label="最弱五行" value={bazi.lackingElement} note={getValueDesc(`bazi.value.${bazi.lackingElement}`)} />
      </dl>

      <h3>核心特質</h3>
      <p className="chips">{bazi.personalityTraits.map((t) => <span key={t} className="chip">{t}</span>)}</p>

      {bazi.crossSystemNote && (
        <aside className="callout soft">
          <p className="callout-label">跨系統觀察</p>
          <p>{bazi.crossSystemNote}</p>
        </aside>
      )}

      <details>
        <summary>名詞說明</summary>
        <dl className="glossary">
          <dt>四柱</dt><dd>{getFieldDesc("bazi.field.chineseDate")}</dd>
          <dt>五行局</dt><dd>{ziwei.fiveElementsClass}——{getFieldDesc("bazi.field.fiveElementsClass")}</dd>
          <dt>最弱五行</dt><dd>{getFieldDesc("bazi.field.lackingElement")}</dd>
        </dl>
      </details>
    </>
  );
}

function ZiweiPanel({ ziwei }: { ziwei: ZiweiResult }) {
  const soulPalace = ziwei.palaces.find((p) => p.isSoulPalace);
  const bodyPalace = ziwei.palaces.find((p) => p.isBodyPalace);
  return (
    <>
      <h2>紫微斗數</h2>
      <p className="lead">
        命宮在{ziwei.earthlyBranchOfSoulPalace}，{soulPalace?.majorStars.length ? `${soulPalace.majorStars.join("、")}坐命` : "沒有主星（彈性格局）"}；
        身宮落在{bodyPalace?.name ?? ziwei.earthlyBranchOfBodyPalace}。{ziwei.fiveElementsClass}，命主{ziwei.soul}、身主{ziwei.body}。
      </p>

      <div className="scroll-x">
        <div className="zw" role="img" aria-label="紫微命盤">
          {ziwei.palaces.map((p) => {
            const pos = BRANCH_GRID[p.earthlyBranch];
            if (!pos) return null;
            return (
              <div
                key={p.name}
                className={`zw-cell${p.isSoulPalace ? " is-soul" : ""}${p.isBodyPalace ? " is-body" : ""}`}
                style={{ gridRow: pos.row, gridColumn: pos.col }}
              >
                <p className="zw-head">
                  <b>{p.name}</b>
                  {p.isSoulPalace && <em>命</em>}
                  {p.isBodyPalace && <em className="body">身</em>}
                  <span>{p.heavenlyStem}{p.earthlyBranch}</span>
                </p>
                <p className="zw-major">{p.majorStars.length ? p.majorStars.join(" ") : <span className="muted">無主星</span>}</p>
                {p.minorStars.length > 0 && <p className="zw-minor">{p.minorStars.join(" ")}</p>}
              </div>
            );
          })}
          <div className="zw-center" style={{ gridRow: "2 / 4", gridColumn: "2 / 4" }}>
            <p className="zw-title">紫微命盤</p>
            <p>{ziwei.solarDate}</p>
            <p>{ziwei.lunarDate}</p>
            <p>{ziwei.chineseDate}</p>
            <p>{ziwei.fiveElementsClass}　命主 {ziwei.soul}　身主 {ziwei.body}</p>
          </div>
        </div>
      </div>

      <details>
        <summary>十二宮逐宮解讀</summary>
        <div className="palaces">
          {ziwei.palaces.map((p) => {
            const palaceDesc = getValueDesc(`ziwei.value.palace.${normalizePalaceName(p.name)}`);
            const starDesc = palaceStarDesc(p);
            return (
              <section key={p.name}>
                <h4>
                  {p.name}
                  {p.isSoulPalace && <em>命宮</em>}
                  {p.isBodyPalace && <em className="body">身宮</em>}
                  <span className="muted">{p.majorStars.length ? p.majorStars.join("、") : "無主星"}</span>
                </h4>
                {palaceDesc && <p className="note">{palaceDesc}</p>}
                {starDesc && <p className="pre">{starDesc}</p>}
              </section>
            );
          })}
        </div>
      </details>
    </>
  );
}

function ZodiacPanel({ zodiac }: { zodiac: ZodiacInfo }) {
  const parts = [`太陽${zodiac.sign}`, zodiac.moonSign && `月亮${zodiac.moonSign}`, zodiac.risingSign && `上升${zodiac.risingSign}`].filter(Boolean);
  return (
    <>
      <h2>西洋星座</h2>
      <p className="lead">{parts.join("、")}。太陽星座的關鍵字是{zodiac.traits.join("、")}。</p>
      <dl className="facts">
        <Fact label="太陽星座" value={`${zodiac.sign}（${zodiac.element}象）`} note={getFieldDesc("ziwei.field.zodiacSign")} />
        <Fact label="月亮星座" value={zodiac.moonSign ?? "未計算"} note={getFieldDesc("zodiac.field.moonSign")} />
        <Fact label="上升星座" value={zodiac.risingSign ?? "未計算"} note={getFieldDesc("zodiac.field.risingSign")} />
      </dl>
    </>
  );
}

function HumanDesignPanel({ hd }: { hd: HumanDesignResult }) {
  const centersMap = new Map(hd.centers.map((c) => [c.name, c.defined]));
  const rows: [string, string, string | undefined][] = [
    ["策略", hd.strategy, getValueDesc(`hd.value.${hd.strategy}`) ?? getFieldDesc("hd.field.strategy")],
    ["內在權威", hd.authority, getValueDesc(`hd.value.${hd.authority}`) ?? getFieldDesc("hd.field.authority")],
    ["人格線", hd.profile, getValueDesc(`hd.value.profile.${hd.profile}`) ?? getFieldDesc("hd.field.profile")],
    ["非自我主題", hd.notSelf, getValueDesc(`hd.value.notSelf.${hd.notSelf}`) ?? getFieldDesc("hd.field.notSelf")],
    ["活在設計中的感受", hd.signature, getValueDesc(`hd.value.signature.${hd.signature}`) ?? getFieldDesc("hd.field.signature")],
  ];
  const typeDesc = getValueDesc(`hd.value.${hd.type}`);
  return (
    <>
      <h2>人類圖</h2>
      <p className="lead">
        {TYPE_CN[hd.type] ?? hd.type}（{hd.type}）。{typeDesc ?? ""}
      </p>

      <div className="hd-layout">
        {hd.centers.length > 0 && hd.gates.length > 0 && (
          <figure className="hd-graph">
            <BodyGraphStandard centers={hd.centers} gates={hd.gates} channels={hd.channels} />
          </figure>
        )}
        <dl className="facts single">
          {rows.filter(([, v]) => v).map(([label, value, note]) => (
            <Fact key={label} label={label} value={value} note={note} />
          ))}
        </dl>
      </div>

      {hd.centers.length > 0 && (
        <details>
          <summary>九個能量中心</summary>
          <p className="note">{getFieldDesc("hd.field.centers")}</p>
          <ul className="centers">
            {CENTER_DISPLAY_ORDER.map((name) => {
              const defined = centersMap.get(name) ?? false;
              const desc = getValueDesc(`hd.value.center.${name}.${defined ? "defined" : "open"}`);
              return (
                <li key={name} className={defined ? "defined" : "open"}>
                  <b>{CENTER_LABELS[name] ?? name}</b>
                  <span className="muted">{defined ? "已定義" : "開放"}</span>
                  {desc && <p>{desc}</p>}
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </>
  );
}

function YearlyPanel({ fortune, insight }: { fortune: YearlyFortune; insight?: string }) {
  return (
    <>
      <h2>{fortune.year} 流年（{fortune.heavenlyStem}{fortune.earthlyBranch}年）</h2>
      {insight
        ? <p className="lead">{insight}</p>
        : <p className="lead">{getFieldDesc("ziwei.field.yearlyMutagen")}</p>}

      <h3>流年四化</h3>
      <dl className="mutagen">
        {fortune.mutagen.map((star, i) => (
          <div key={i} className={MUTAGEN_CLASS[i]}>
            <dt>{MUTAGEN_LABELS[i]}</dt>
            <dd>{star}</dd>
            <p className="note">{MUTAGEN_PLAIN_DESC[MUTAGEN_LABELS[i]]}</p>
          </div>
        ))}
      </dl>

      <h3>今年的重點宮位</h3>
      <div className="palaces grid">
        {fortune.keyPalaces.map((palace) => {
          const normalized = normalizePalaceName(palace.name);
          const hits = palace.majorStars
            .map((star) => ({ star, idx: fortune.mutagen.indexOf(star) }))
            .filter((h) => h.idx >= 0);
          return (
            <section key={palace.name}>
              <h4>
                {palace.name}
                <span className="muted">{palace.majorStars.length ? palace.majorStars.join("、") : "無主星"}</span>
              </h4>
              <p className="note">{getValueDesc(`ziwei.value.palace.${normalized}`)}</p>
              {hits.map(({ star, idx }) => (
                <p key={star} className={MUTAGEN_CLASS[idx]}>
                  <b>今年{MUTAGEN_LABELS[idx]}進入此宮（{star}）</b>——{MUTAGEN_YEARLY_EFFECT[MUTAGEN_LABELS[idx]]}
                </p>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}

// ─── Document ────────────────────────────────────────────────────────────────

export default function ReportDocument({ d }: { d: ReportData }) {
  const tabs = getReportTabs(d);
  const generated = new Date(d.generatedAt);
  const generatedLabel = `${generated.getFullYear()}-${String(generated.getMonth() + 1).padStart(2, "0")}-${String(generated.getDate()).padStart(2, "0")}`;

  const panels: Record<string, React.ReactNode> = {
    overview: <OverviewPanel cross={d.crossAnalysis} />,
    aspects: d.crossAnalysis ? <AspectsPanel cross={d.crossAnalysis} /> : null,
    bazi: d.baziAnalysis ? <BaziPanel bazi={d.baziAnalysis} ziwei={d.ziwei} /> : null,
    ziwei: <ZiweiPanel ziwei={d.ziwei} />,
    zodiac: <ZodiacPanel zodiac={d.zodiac} />,
    hd: d.humanDesign ? <HumanDesignPanel hd={d.humanDesign} /> : null,
    yearly: <YearlyPanel fortune={d.yearlyFortune} insight={d.crossAnalysis?.yearlyInsight} />,
  };

  return (
    <div className="page">
      <Cover d={d} />

      <nav className="tabs" role="tablist" aria-label="報告分頁">
        {tabs.map((t, i) => (
          <a key={t.id} href={`#${t.id}`} role="tab" id={`tab-${t.id}`} aria-controls={t.id} aria-selected={i === 0 ? "true" : "false"}>
            {t.label}
          </a>
        ))}
      </nav>

      <main>
        {tabs.map((t) => (
          <section key={t.id} id={t.id} className="panel" role="tabpanel" aria-labelledby={`tab-${t.id}`}>
            {panels[t.id]}
          </section>
        ))}
      </main>

      <footer className="colophon">
        <p>命運手記 Fate Notes · {generatedLabel} 產生 · 排盤：iztro（紫微、八字）、circular-natal-horoscope-js（星盤）、humandesignhub（人類圖）</p>
        <p>本報告採標準安星法，解讀以通用原則為主，各命理學派可能有不同詮釋。</p>
      </footer>
    </div>
  );
}
