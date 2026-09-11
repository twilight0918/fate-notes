"use client";

import { useState, useEffect, useRef } from "react";
import BirthForm, { type BirthFormData } from "@/components/BirthForm";
import BaziCard from "@/components/BaziCard";
import HumanDesignCard from "@/components/HumanDesignCard";
import CrossAnalysisCard from "@/components/CrossAnalysisCard";
import ZiweiChart from "@/components/ZiweiChart";
import YearlyFortuneCard from "@/components/YearlyFortuneCard";
import DownloadReportButton from "@/components/DownloadReportButton";
import ProfileOverviewCard from "@/components/ProfileOverviewCard";
import HistoryPanel from "@/components/HistoryPanel";
import { getZiweiChart, getYearlyFortune, type ZiweiResult, type YearlyFortune } from "@/utils/iztro-helpers";
import { getZodiacSign, type ZodiacInfo } from "@/utils/zodiac";
import { buildISODatetime } from "@/utils/timezone";
import { geocodeCity } from "@/utils/geocode";
import { calculateAstro } from "@/utils/astro-calc";
import { UNKNOWN_TIME, formatBirthTime } from "@/utils/birth-time";
import { getHistory, saveRecord, deleteRecord, clearHistory, type HistoryRecord } from "@/utils/history";
import type { AnalyzeRequest, BaziAnalysis } from "@/app/api/analyze/route";
import type { HumanDesignResult } from "@/app/api/human-design/route";
import type { CrossAnalysis, CrossAnalysisRequest } from "@/app/api/cross-analysis/route";
import { PROVIDER_OPTIONS, TIER_OPTIONS, getModelDisplayName, apiKeyStorageKey, type Provider, type ModelTier } from "@/utils/ai-provider";
import Tooltip from "@/components/Tooltip";
import { getTooltipProps } from "@/utils/glossary";

const PROGRESS_STEPS = [
  { text: "連接八字分析引擎…",     phase: "initial" as const },
  { text: "連接人類圖 API…",       phase: "initial" as const },
  { text: "解析命盤資料…",          phase: "initial" as const },
  { text: "收集四系統資料…",        phase: "cross" as const },
  { text: "交叉比對命理信號…",      phase: "cross" as const },
  { text: "辨識共振與張力…",        phase: "cross" as const },
  { text: "產出人生使用說明書…",    phase: "cross" as const },
];

function AnalysisProgress({ phase }: { phase: "initial" | "cross" }) {
  const [stepIdx, setStepIdx] = useState(0);

  // Calculate starting index based on phase
  const startIdx = phase === "cross"
    ? PROGRESS_STEPS.findIndex((s) => s.phase === "cross")
    : 0;

  useEffect(() => {
    setStepIdx(startIdx);
    const timer = setInterval(() => {
      setStepIdx((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
    }, 5000);
    return () => clearInterval(timer);
  }, [startIdx]);

  const currentStep = PROGRESS_STEPS[stepIdx] ?? PROGRESS_STEPS[0];
  const isCrossPhase = currentStep.phase === "cross";
  const dotColor = isCrossPhase ? "bg-accent" : "bg-gold";
  const textColor = isCrossPhase ? "text-accent" : "text-gold";
  const barGradient = "from-gold via-earth to-accent";
  const title = isCrossPhase ? "AI 交叉分析中" : "AI 分析中（八字 + 人類圖）";

  return (
    <div className="bg-card border border-line rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-4 h-4 rounded-full ${dotColor} animate-pulse flex-shrink-0 transition-colors duration-500`} />
        <p className={`${textColor} text-sm font-medium transition-colors duration-500`}>{title}</p>
      </div>
      {/* Single continuous progress bar */}
      <div className="w-full bg-line rounded-full h-1.5 mb-3 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${barGradient} rounded-full progress-bar-fill`} />
      </div>
      {/* Step text */}
      <p className="text-muted text-xs transition-all duration-300">
        {currentStep.text}
      </p>
    </div>
  );
}

type TabId = "overview" | "bazi" | "ziwei" | "zodiac" | "hd" | "yearly";

interface PageResult {
  ziwei: ZiweiResult;
  zodiac: ZodiacInfo;
  yearlyFortune: YearlyFortune;
}

export default function HomePage() {
  const [result, setResult] = useState<PageResult | null>(null);
  const [baziAnalysis, setBaziAnalysis] = useState<BaziAnalysis | null>(null);
  const [humanDesign, setHumanDesign] = useState<HumanDesignResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hdError, setHdError] = useState<string | null>(null);
  const [crossAnalysis, setCrossAnalysis] = useState<CrossAnalysis | null>(null);
  const [crossError, setCrossError] = useState<string | null>(null);
  const [isCrossLoading, setIsCrossLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>("gemini");
  const [userApiKey, setUserApiKey] = useState("");
  const [modelTier, setModelTier] = useState<ModelTier>("standard");
  const [userName, setUserName] = useState("");
  const [birthData, setBirthData] = useState<BirthFormData | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [userMbti, setUserMbti] = useState<string | undefined>();
  const [userEnneagram, setUserEnneagram] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showInput, setShowInput] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // Restore the API key for the selected provider. sessionStorage, not
  // localStorage: the key survives a reload but is dropped when the tab
  // closes, so it never sits on disk between browser sessions.
  useEffect(() => {
    try {
      setUserApiKey(sessionStorage.getItem(apiKeyStorageKey(provider)) ?? "");
    } catch {
      // sessionStorage blocked (private mode, site data disabled) — start empty.
    }
  }, [provider]);

  async function handleSubmit(data: BirthFormData) {
    setBirthData(data);
    setActiveTab("overview");
    setShowInput(false);
    setUserName(data.name.trim());
    setUserMbti(data.mbti || undefined);
    setUserEnneagram(data.enneagram || undefined);
    setIsLoading(true);
    setError(null);
    setHdError(null);
    setCrossError(null);
    setBaziAnalysis(null);
    setHumanDesign(null);
    setCrossAnalysis(null);

    let ziwei: ZiweiResult;
    let zodiac: ZodiacInfo;
    let yearlyFortune: YearlyFortune;
    const clockHour = data.clockHour ?? UNKNOWN_TIME.hour;
    const minute = data.minute ?? UNKNOWN_TIME.minute;

    try {
      ziwei = getZiweiChart(data);
      zodiac = getZodiacSign(data.month, data.day);
      yearlyFortune = getYearlyFortune(data);

      // Calculate Moon sign + Rising sign (async: needs geocoding)
      try {
        const coords = await geocodeCity(data.city);
        const astro = calculateAstro({
          year: data.year,
          month: data.month,
          day: data.day,
          hour: clockHour,
          minute,
          latitude: coords.lat,
          longitude: coords.lon,
        });
        zodiac = {
          ...zodiac,
          moonSign: astro.moonSignCN,
          moonSignEn: astro.moonSign,
          risingSign: astro.risingSignCN,
          risingSignEn: astro.risingSign,
        };
      } catch (astroErr) {
        console.warn("月亮/上升星座計算失敗，使用基本太陽星座：", astroErr);
        // Non-blocking: zodiac remains with sun sign only
      }

      setResult({ ziwei, zodiac, yearlyFortune });
    } catch (e) {
      setError("排盤計算失敗，請確認輸入資料正確。");
      console.error(e);
      setIsLoading(false);
      return;
    }

    // Build payloads
    const baziPayload: AnalyzeRequest = {
      chineseDate: ziwei.chineseDate,
      fiveElementsClass: ziwei.fiveElementsClass,
      soul: ziwei.soul,
      body: ziwei.body,
      gender: data.gender,
      year: data.year,
      isTimeUnknown: data.timeUnknown === true,
      zodiacSign: zodiac.sign,
      zodiacElement: zodiac.element,
      provider,
      apiKey: userApiKey,
      modelTier,
    };

    const isoDatetime = buildISODatetime(data.year, data.month, data.day, clockHour, minute, data.city);

    // Run both API calls in parallel — partial failure handled independently
    const [baziSettled, hdSettled] = await Promise.allSettled([
      // 八字 AI 分析
      fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(baziPayload),
      }).then(async (res) => {
        if (!res.ok) {
          let errMsg = `HTTP ${res.status}`;
          try { const e2 = await res.json(); errMsg = e2.error ?? errMsg; } catch {}
          throw new Error(errMsg);
        }
        return res.json() as Promise<BaziAnalysis>;
      }),

      // 人類圖分析
      fetch("/api/human-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datetime: isoDatetime, city: data.city }),
      }).then(async (res) => {
        if (!res.ok) {
          let errMsg = `HTTP ${res.status}`;
          try { const e2 = await res.json(); errMsg = e2.error ?? errMsg; } catch {}
          throw new Error(errMsg);
        }
        return res.json() as Promise<HumanDesignResult>;
      }),
    ]);

    let baziResult: BaziAnalysis | null = null;
    let hdResult: HumanDesignResult | null = null;

    if (baziSettled.status === "fulfilled") {
      baziResult = baziSettled.value;
      setBaziAnalysis(baziResult);
    } else {
      const msg = baziSettled.reason?.message ?? "未知錯誤";
      setError(`八字 AI 分析失敗：${msg}`);
    }

    if (hdSettled.status === "fulfilled") {
      hdResult = hdSettled.value;
      setHumanDesign(hdResult);
    } else {
      const msg = hdSettled.reason?.message ?? "未知錯誤";
      setHdError(`人類圖分析失敗：${msg}`);
    }

    setIsLoading(false);

    // Cross-analysis: require at least bazi or HD (ziwei + zodiac always available)
    if (!baziResult && !hdResult) {
      setCrossError("八字與人類圖均失敗，無法進行交叉分析");
      return;
    }

    // Build cross-analysis payload
    const soulPalace = ziwei.palaces.find((p) => p.isSoulPalace);
    const crossPayload: CrossAnalysisRequest = {
      provider,
      apiKey: userApiKey,
      modelTier,
      gender: data.gender,
      year: data.year,
      ziwei: {
        chineseDate: ziwei.chineseDate,
        fiveElementsClass: ziwei.fiveElementsClass,
        soul: ziwei.soul,
        body: ziwei.body,
        soulPalaceMajorStars: soulPalace?.majorStars ?? [],
      },
      zodiac: {
        sign: zodiac.sign,
        element: zodiac.element,
        traits: zodiac.traits,
        ...(zodiac.moonSign && { moonSign: zodiac.moonSign }),
        ...(zodiac.risingSign && { risingSign: zodiac.risingSign }),
      },
      ...(baziResult && {
        bazi: {
          dayMaster: baziResult.dayMaster,
          dayMasterStrength: baziResult.dayMasterStrength,
          dominantElement: baziResult.dominantElement,
          lackingElement: baziResult.lackingElement,
          personalityTraits: baziResult.personalityTraits,
          summary: baziResult.summary,
        },
      }),
      ...(hdResult && {
        humanDesign: {
          type: hdResult.type,
          strategy: hdResult.strategy,
          authority: hdResult.authority,
          profile: hdResult.profile,
          notSelf: hdResult.notSelf,
          signature: hdResult.signature,
          definedCenters: hdResult.centers.filter((c) => c.defined).map((c) => c.name),
          openCenters: hdResult.centers.filter((c) => !c.defined).map((c) => c.name),
        },
      }),
      yearlyFortune: {
        year: yearlyFortune.year,
        heavenlyStem: yearlyFortune.heavenlyStem,
        earthlyBranch: yearlyFortune.earthlyBranch,
        mutagen: yearlyFortune.mutagen,
      },
      ...(data.mbti && { mbti: data.mbti }),
      ...(data.enneagram && { enneagram: data.enneagram }),
    };

    setIsCrossLoading(true);
    try {
      const crossRes = await fetch("/api/cross-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crossPayload),
      });
      if (!crossRes.ok) {
        let errMsg = `HTTP ${crossRes.status}`;
        try { const e2 = await crossRes.json(); errMsg = e2.error ?? errMsg; } catch {}
        throw new Error(errMsg);
      }
      const crossResult: CrossAnalysis = await crossRes.json();
      setCrossAnalysis(crossResult);

      // Auto-save to history
      const record: HistoryRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        birthData: data,
        results: {
          ziwei,
          zodiac,
          yearlyFortune,
          baziAnalysis: baziResult ?? undefined,
          humanDesign: hdResult ?? undefined,
          crossAnalysis: crossResult,
        },
      };
      saveRecord(record);
      setHistory(getHistory());
    } catch (e) {
      const msg = (e as Error)?.message ?? "未知錯誤";
      setCrossError(`交叉分析失敗：${msg}`);

      // Save even if cross-analysis fails (partial results)
      const record: HistoryRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        birthData: data,
        results: {
          ziwei,
          zodiac,
          yearlyFortune,
          baziAnalysis: baziResult ?? undefined,
          humanDesign: hdResult ?? undefined,
        },
      };
      saveRecord(record);
      setHistory(getHistory());
    } finally {
      setIsCrossLoading(false);
    }
  }

  function handleLoadHistory(record: HistoryRecord) {
    // Restore all state from history
    setBirthData(record.birthData);
    setActiveTab("overview");
    setShowInput(false);
    window.scrollTo({ top: 0 });
    setUserName(record.birthData.name?.trim() || "");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bd = record.birthData as any;
    setUserMbti(bd.mbti || undefined);
    setUserEnneagram(bd.enneagram || undefined);
    setResult({
      ziwei: record.results.ziwei,
      zodiac: record.results.zodiac,
      yearlyFortune: record.results.yearlyFortune,
    });
    setBaziAnalysis(record.results.baziAnalysis ?? null);
    setHumanDesign(record.results.humanDesign ?? null);
    setCrossAnalysis(record.results.crossAnalysis ?? null);
    setError(null);
    setHdError(null);
    setCrossError(null);
    setIsLoading(false);
    setIsCrossLoading(false);
  }

  function handleDeleteRecord(id: string) {
    deleteRecord(id);
    setHistory(getHistory());
  }

  function handleClearHistory() {
    clearHistory();
    setHistory([]);
  }

  const tabs: { id: TabId; label: string }[] = result
    ? [
        { id: "overview", label: "總覽" },
        ...(baziAnalysis ? [{ id: "bazi" as const, label: "八字" }] : []),
        { id: "ziwei", label: "紫微" },
        { id: "zodiac", label: "星座" },
        ...(humanDesign ? [{ id: "hd" as const, label: "人類圖" }] : []),
        { id: "yearly", label: "流年" },
      ]
    : [];
  const currentTab: TabId = tabs.some((t) => t.id === activeTab) ? activeTab : "overview";
  const isBusy = isLoading || isCrossLoading;

  function selectTab(id: TabId) {
    setActiveTab(id);
    // 分頁籤黏在上方時，換頁要回到內容開頭，不然會停在上一頁的捲動位置
    const top = resultsRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) resultsRef.current?.scrollIntoView({ block: "start" });
  }

  function handleTabKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.findIndex((t) => t.id === currentTab);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    selectTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pt-6 sm:pt-10 pb-16">
      {/* Header */}
      <header className="text-center mb-5 sm:mb-8">
        <p className="text-accent text-xs tracking-[0.3em] mb-2">FATE NOTES</p>
        <h1 className="font-serif text-3xl font-bold text-ink mb-2">命運手記</h1>
        <p className="text-muted text-sm">
          紫微斗數 × 八字 × 人類圖 × 星座 — AI 多系統交叉比對
        </p>
        <p className="text-muted text-xs mt-2">
          本平台採標準安星法，解讀以通用原則為主，各命理學派可能有不同詮釋
        </p>
      </header>

      {/* 有結果時，輸入區收成一行；按「重新輸入」再展開 */}
      {result && birthData && !showInput && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-3 mb-6 text-sm">
          <p className="text-muted mr-auto">
            <span className="text-ink font-medium">{birthData.name?.trim() || "未命名"}</span>
            {"　"}
            {birthData.year}/{birthData.month}/{birthData.day} {formatBirthTime(birthData)}
          </p>
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="text-accent hover:underline underline-offset-4"
          >
            重新輸入／歷史紀錄
          </button>
          {!isBusy && (
            <DownloadReportButton
              getData={() => ({
                birthData,
                ziwei: result.ziwei,
                zodiac: result.zodiac,
                yearlyFortune: result.yearlyFortune,
                baziAnalysis,
                humanDesign,
                crossAnalysis,
                generatedAt: new Date().toISOString(),
              })}
            />
          )}
        </div>
      )}

      <div hidden={Boolean(result) && !showInput}>
        {/* BYOK API Key 設定 */}
        <section className="bg-card border border-line rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-ink mb-4">AI 分析設定</h2>
          <div className="space-y-3">
            {/* 供應商選擇 */}
            <div>
              <label className="block text-sm text-muted mb-1">AI 供應商</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
                className="w-full bg-paper border border-line text-ink rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
              >
                {PROVIDER_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {/* API Key 輸入 */}
            <div>
              <label className="block text-sm text-muted mb-1">API Key</label>
              <input
                type="password"
                value={userApiKey}
                onChange={(e) => {
                  setUserApiKey(e.target.value);
                  try {
                    sessionStorage.setItem(apiKeyStorageKey(provider), e.target.value);
                  } catch {
                    // sessionStorage blocked — the key stays in memory only.
                  }
                }}
                placeholder={`填入你的 ${PROVIDER_OPTIONS.find(p => p.value === provider)?.label ?? ""} API Key`}
                className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent placeholder:text-muted/60"
              />
              <p className="text-muted text-xs mt-1">
                這個分頁關掉前都會記住，不會寫進硬碟
              </p>
            </div>
            {/* 分析模式 */}
            <div>
              <label className="block text-sm text-muted mb-1">分析模式</label>
              <select
                value={modelTier}
                onChange={(e) => setModelTier(e.target.value as ModelTier)}
                className="w-full bg-paper border border-line text-ink rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
              >
                {TIER_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}（{getModelDisplayName(provider, value)}）
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Form card */}
        <section className="bg-card border border-line rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-ink mb-4">輸入出生資料</h2>
          <BirthForm onSubmit={handleSubmit} isLoading={isLoading} disabled={!userApiKey.trim()} />
          {!userApiKey.trim() && (
            <p className="text-fire text-xs mt-3">請先在上方填入 API Key 才能開始分析</p>
          )}
        </section>

        {/* History panel */}
        <HistoryPanel
          records={history}
          onLoad={handleLoadHistory}
          onDelete={handleDeleteRecord}
          onClearAll={handleClearHistory}
        />

        {result && (
          <div className="text-center mb-6">
            <button
              type="button"
              onClick={() => setShowInput(false)}
              className="text-sm text-accent hover:underline underline-offset-4"
            >
              收起，回到結果
            </button>
          </div>
        )}
      </div>

      {/* Error — 八字 */}
      {error && (
        <div className="bg-fire/10 border border-fire/40 rounded-xl p-4 mb-6 text-fire text-sm">
          {error}
        </div>
      )}

      {/* Error — 人類圖（non-blocking） */}
      {hdError && (
        <div className="bg-gold/10 border border-gold/40 rounded-xl p-4 mb-6 text-gold text-sm">
          {hdError}
        </div>
      )}

      {/* Error — 交叉分析 */}
      {crossError && (
        <div className="bg-fire/10 border border-fire/40 rounded-xl p-4 mb-6 text-fire text-sm">
          {crossError}
        </div>
      )}

      {/* Results：封面結論 → 分頁籤 → 一次讀一個系統 */}
      {result && (
        <div ref={resultsRef} className="scroll-mt-0">
          {/* Unified loading indicator — one continuous bar across both phases */}
          {isBusy && (
            <div className="mb-4">
              <AnalysisProgress phase={isCrossLoading ? "cross" : "initial"} />
            </div>
          )}

          {/* 分頁籤（黏在上方） */}
          <div className="sticky top-0 z-20 -mx-4 px-4 bg-paper/95 backdrop-blur border-b border-line mb-6">
            <div role="tablist" aria-label="報告分頁" className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
              {tabs.map((t) => {
                const selected = t.id === currentTab;
                return (
                  <button
                    key={t.id}
                    id={`tab-${t.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`panel-${t.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => selectTab(t.id)}
                    onKeyDown={handleTabKey}
                    className={`shrink-0 px-2 sm:px-3 pt-3 pb-2.5 text-[0.95rem] border-b-2 transition-colors ${
                      selected
                        ? "border-accent text-ink font-semibold"
                        : "border-transparent text-muted hover:text-ink"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div id={`panel-${currentTab}`} role="tabpanel" aria-labelledby={`tab-${currentTab}`} className="space-y-4">
            {/* 總覽：人格總覽＋交叉分析 */}
            {currentTab === "overview" && (
              <>
                {!isBusy ? (
                  <ProfileOverviewCard
                    name={userName || undefined}
                    ziwei={{
                      soulPalaceMajorStars: result.ziwei.palaces.find((p) => p.isSoulPalace)?.majorStars ?? [],
                      soul: result.ziwei.soul,
                      body: result.ziwei.body,
                    }}
                    bazi={baziAnalysis ? {
                      dayMaster: baziAnalysis.dayMaster,
                      dayMasterStrength: baziAnalysis.dayMasterStrength,
                      dominantElement: baziAnalysis.dominantElement,
                    } : undefined}
                    humanDesign={humanDesign ? {
                      type: humanDesign.type,
                      profile: humanDesign.profile,
                    } : undefined}
                    zodiac={{
                      sun: result.zodiac.sign,
                      moon: result.zodiac.moonSign,
                      rising: result.zodiac.risingSign,
                    }}
                    mbti={userMbti}
                    enneagram={userEnneagram}
                    tagline={crossAnalysis?.tagline}
                  />
                ) : (
                  <p className="text-muted text-sm text-center py-8">
                    分析完成後，這裡會出現總覽；紫微、星座、流年已經可以先看。
                  </p>
                )}
                {crossAnalysis && <CrossAnalysisCard analysis={crossAnalysis} name={userName || undefined} />}
              </>
            )}

            {/* 八字 AI 分析 */}
            {currentTab === "bazi" && baziAnalysis && (
              <BaziCard
                analysis={baziAnalysis}
                chineseDate={result.ziwei.chineseDate}
                fiveElementsClass={result.ziwei.fiveElementsClass}
              />
            )}

            {/* 紫微：基本資料＋命盤 */}
            {currentTab === "ziwei" && (
              <>
                <section className="bg-card border border-line rounded-2xl p-6">
                  <h2 className="text-base font-semibold text-accent mb-4">紫微斗數基本資料</h2>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <Fact label="陽曆" tip={getTooltipProps("ziwei.field.solarDate")} value={result.ziwei.solarDate} />
                    <Fact label="農曆" tip={getTooltipProps("ziwei.field.lunarDate")} value={result.ziwei.lunarDate} />
                    <Fact label="四柱（干支）" tip={getTooltipProps("ziwei.field.chineseDate")} value={result.ziwei.chineseDate} />
                    <Fact label="五行局" tip={getTooltipProps("ziwei.field.fiveElementsClass")} value={result.ziwei.fiveElementsClass} />
                    <Fact label="命主星" tip={getTooltipProps("ziwei.field.soul", `ziwei.value.${result.ziwei.soul}`)} value={result.ziwei.soul} />
                    <Fact label="身主星" tip={getTooltipProps("ziwei.field.body", `ziwei.value.${result.ziwei.body}`)} value={result.ziwei.body} />
                  </dl>
                </section>
                <ZiweiChart
                  palaces={result.ziwei.palaces}
                  fiveElementsClass={result.ziwei.fiveElementsClass}
                  soul={result.ziwei.soul}
                  body={result.ziwei.body}
                  lunarDate={result.ziwei.lunarDate}
                />
              </>
            )}

            {/* 星座 */}
            {currentTab === "zodiac" && (
              <section className="bg-card border border-line rounded-2xl p-6">
                <h2 className="text-base font-semibold text-accent mb-4">星座</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Fact
                    label="☀️ 太陽星座"
                    tip={getTooltipProps("ziwei.field.zodiacSign", `zodiac.value.${result.zodiac.element}`)}
                    value={`${result.zodiac.sign}（${result.zodiac.element}象）`}
                  />
                  <Fact label="🌙 月亮星座" tip={getTooltipProps("zodiac.field.moonSign")} value={result.zodiac.moonSign} />
                  <Fact label="⬆️ 上升星座" tip={getTooltipProps("zodiac.field.risingSign")} value={result.zodiac.risingSign} />
                  <Fact label="太陽星座特質" tip={getTooltipProps("ziwei.field.zodiacTraits")} value={result.zodiac.traits.join("、")} />
                </dl>
              </section>
            )}

            {/* 人類圖分析 */}
            {currentTab === "hd" && humanDesign && <HumanDesignCard result={humanDesign} />}

            {/* 流年運勢 */}
            {currentTab === "yearly" && <YearlyFortuneCard fortune={result.yearlyFortune} />}
          </div>

          {/* Footer credit */}
          <div className="text-center text-xs text-muted/70 pt-8">
            <p>命運手記 Fate Notes — Powered by iztro · humandesignhub · Gemini</p>
          </div>
        </div>
      )}
    </main>
  );
}

function Fact({
  label,
  value,
  tip,
}: {
  label: string;
  value?: string;
  tip: ReturnType<typeof getTooltipProps>;
}) {
  return (
    <div className="bg-paper border border-line rounded-lg p-3">
      <dt className="text-muted text-xs mb-1">
        <Tooltip {...tip}><span>{label}</span></Tooltip>
      </dt>
      {/* keep-all：「辛酉 丁酉 己亥 丙寅」只在空格換行，不會把「丙寅」拆成兩行 */}
      <dd className={`font-medium [word-break:keep-all] ${value ? "text-ink" : "text-muted italic"}`}>{value ?? "計算中…"}</dd>
    </div>
  );
}
