"use client";

import { useState, useEffect } from "react";
import BirthForm, { type BirthFormData } from "@/components/BirthForm";
import BaziCard from "@/components/BaziCard";
import HumanDesignCard from "@/components/HumanDesignCard";
import CrossAnalysisCard from "@/components/CrossAnalysisCard";
import ZiweiChart from "@/components/ZiweiChart";
import YearlyFortuneCard from "@/components/YearlyFortuneCard";
import ShareButton from "@/components/ShareButton";
import ProfileOverviewCard from "@/components/ProfileOverviewCard";
import HistoryPanel from "@/components/HistoryPanel";
import { getZiweiChart, getYearlyFortune, type ZiweiResult, type YearlyFortune } from "@/utils/iztro-helpers";
import { getZodiacSign, type ZodiacInfo } from "@/utils/zodiac";
import { buildISODatetime } from "@/utils/timezone";
import { geocodeCity } from "@/utils/geocode";
import { calculateAstro } from "@/utils/astro-calc";
import { UNKNOWN_TIME } from "@/utils/birth-time";
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
  const dotColor = isCrossPhase ? "bg-violet-500" : "bg-cyan-500";
  const textColor = isCrossPhase ? "text-violet-400" : "text-cyan-400";
  const barGradient = "from-cyan-500 via-indigo-500 to-violet-500";
  const title = isCrossPhase ? "AI 交叉分析中" : "AI 分析中（八字 + 人類圖）";

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-4 h-4 rounded-full ${dotColor} animate-pulse flex-shrink-0 transition-colors duration-500`} />
        <p className={`${textColor} text-sm font-medium transition-colors duration-500`}>{title}</p>
      </div>
      {/* Single continuous progress bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${barGradient} rounded-full progress-bar-fill`} />
      </div>
      {/* Step text */}
      <p className="text-slate-400 text-xs transition-all duration-300">
        {currentStep.text}
      </p>
    </div>
  );
}

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
  const [captureMode, setCaptureMode] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [userMbti, setUserMbti] = useState<string | undefined>();
  const [userEnneagram, setUserEnneagram] = useState<number | undefined>();

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

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">命運手記</h1>
        <p className="text-slate-400 text-sm">
          紫微斗數 × 八字 × 人類圖 × 星座 — AI 多系統交叉比對
        </p>
        <p className="text-slate-600 text-xs mt-2">
          本平台採標準安星法，解讀以通用原則為主，各命理學派可能有不同詮釋
        </p>
      </div>

      {/* BYOK API Key 設定 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">AI 分析設定</h2>
        <div className="space-y-3">
          {/* 供應商選擇 */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">AI 供應商</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              {PROVIDER_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          {/* API Key 輸入 */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">API Key</label>
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />
            <p className="text-slate-500 text-xs mt-1">
              這個分頁關掉前都會記住，不會寫進硬碟
            </p>
          </div>
          {/* 分析模式 */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">分析模式</label>
            <select
              value={modelTier}
              onChange={(e) => setModelTier(e.target.value as ModelTier)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              {TIER_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}（{getModelDisplayName(provider, value)}）
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">輸入出生資料</h2>
        <BirthForm onSubmit={handleSubmit} isLoading={isLoading || !userApiKey.trim()} />
        {!userApiKey.trim() && (
          <p className="text-amber-500 text-xs mt-3">請先在上方填入 API Key 才能開始分析</p>
        )}
      </div>

      {/* History panel */}
      <HistoryPanel
        records={history}
        onLoad={handleLoadHistory}
        onDelete={handleDeleteRecord}
        onClearAll={handleClearHistory}
      />

      {/* Error — 八字 */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Error — 人類圖（non-blocking, amber） */}
      {hdError && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4 mb-6 text-amber-300 text-sm">
          {hdError}
        </div>
      )}

      {/* Error — 交叉分析 */}
      {crossError && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6 text-red-300 text-sm">
          {crossError}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Share button */}
          {!isLoading && !isCrossLoading && (
            <div className="flex justify-end">
              <ShareButton
                targetId="fate-result"
                fileName={userName ? `${userName}-fate-notes` : "fate-notes-report"}
                label="下載完整報告"
                onBeforeCapture={async () => setCaptureMode(true)}
                onAfterCapture={() => setCaptureMode(false)}
              />
            </div>
          )}

          {/* Unified loading indicator — one continuous bar across both phases */}
          {(isLoading || isCrossLoading) && (
            <AnalysisProgress phase={isCrossLoading ? "cross" : "initial"} />
          )}

          {/* Capturable area for screenshot */}
          <div id="fate-result" className="space-y-4">

          {/* 人格總覽卡 */}
          {!isLoading && !isCrossLoading && (
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
          )}

          {/* 交叉分析 */}
          {crossAnalysis && <CrossAnalysisCard analysis={crossAnalysis} name={userName || undefined} />}

          {/* 八字 AI 分析 */}
          {baziAnalysis && (
            <BaziCard
              analysis={baziAnalysis}
              chineseDate={result.ziwei.chineseDate}
              fiveElementsClass={result.ziwei.fiveElementsClass}
            />
          )}

          {/* 人類圖分析 */}
          {humanDesign && (
            <HumanDesignCard result={humanDesign} captureMode={captureMode} />
          )}

          {/* 紫微 + 星座基本資訊 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-indigo-400 mb-4">
              紫微斗數 × 星座
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {/* 陽曆 */}
              <div className="bg-slate-800 rounded-lg p-3">
                <dt className="text-slate-500 text-xs mb-1">
                  <Tooltip {...getTooltipProps("ziwei.field.solarDate")}><span>陽曆</span></Tooltip>
                </dt>
                <dd className="text-white font-medium">{result.ziwei.solarDate}</dd>
              </div>
              {/* 農曆 */}
              <div className="bg-slate-800 rounded-lg p-3">
                <dt className="text-slate-500 text-xs mb-1">
                  <Tooltip {...getTooltipProps("ziwei.field.lunarDate")}><span>農曆</span></Tooltip>
                </dt>
                <dd className="text-white font-medium">{result.ziwei.lunarDate}</dd>
              </div>
              {/* 四柱 */}
              <div className="bg-slate-800 rounded-lg p-3">
                <dt className="text-slate-500 text-xs mb-1">
                  <Tooltip {...getTooltipProps("ziwei.field.chineseDate")}><span>四柱（干支）</span></Tooltip>
                </dt>
                <dd className="text-white font-medium">{result.ziwei.chineseDate}</dd>
              </div>
              {/* 五行局 */}
              <div className="bg-slate-800 rounded-lg p-3">
                <dt className="text-slate-500 text-xs mb-1">
                  <Tooltip {...getTooltipProps("ziwei.field.fiveElementsClass")}><span>五行局</span></Tooltip>
                </dt>
                <dd className="text-white font-medium">{result.ziwei.fiveElementsClass}</dd>
              </div>
              {/* 命主星 */}
              <div className="bg-slate-800 rounded-lg p-3">
                <dt className="text-slate-500 text-xs mb-1">
                  <Tooltip {...getTooltipProps("ziwei.field.soul", `ziwei.value.${result.ziwei.soul}`)}><span>命主星</span></Tooltip>
                </dt>
                <dd className="text-white font-medium">{result.ziwei.soul}</dd>
              </div>
              {/* 身主星 */}
              <div className="bg-slate-800 rounded-lg p-3">
                <dt className="text-slate-500 text-xs mb-1">
                  <Tooltip {...getTooltipProps("ziwei.field.body", `ziwei.value.${result.ziwei.body}`)}><span>身主星</span></Tooltip>
                </dt>
                <dd className="text-white font-medium">{result.ziwei.body}</dd>
              </div>
              {/* 太陽星座 */}
              <div className="bg-slate-800 rounded-lg p-3">
                <dt className="text-slate-500 text-xs mb-1">
                  <Tooltip {...getTooltipProps("ziwei.field.zodiacSign", `zodiac.value.${result.zodiac.element}`)}><span>☀️ 太陽星座</span></Tooltip>
                </dt>
                <dd className="text-white font-medium">{`${result.zodiac.sign}（${result.zodiac.element}象）`}</dd>
              </div>
              {/* 月亮星座 */}
              <div className="bg-slate-800 rounded-lg p-3">
                <dt className="text-slate-500 text-xs mb-1">
                  <Tooltip {...getTooltipProps("zodiac.field.moonSign")}><span>🌙 月亮星座</span></Tooltip>
                </dt>
                <dd className={`font-medium ${result.zodiac.moonSign ? "text-white" : "text-slate-600 italic"}`}>
                  {result.zodiac.moonSign ?? "計算中…"}
                </dd>
              </div>
              {/* 上升星座 */}
              <div className="bg-slate-800 rounded-lg p-3">
                <dt className="text-slate-500 text-xs mb-1">
                  <Tooltip {...getTooltipProps("zodiac.field.risingSign")}><span>⬆️ 上升星座</span></Tooltip>
                </dt>
                <dd className={`font-medium ${result.zodiac.risingSign ? "text-white" : "text-slate-600 italic"}`}>
                  {result.zodiac.risingSign ?? "計算中…"}
                </dd>
              </div>
              {/* 星座特質 */}
              <div className="bg-slate-800 rounded-lg p-3">
                <dt className="text-slate-500 text-xs mb-1">
                  <Tooltip {...getTooltipProps("ziwei.field.zodiacTraits")}><span>太陽星座特質</span></Tooltip>
                </dt>
                <dd className="text-white font-medium">{result.zodiac.traits.join("、")}</dd>
              </div>
            </dl>
          </div>

          {/* 紫微命盤（四方盤） */}
          <ZiweiChart
            palaces={result.ziwei.palaces}
            fiveElementsClass={result.ziwei.fiveElementsClass}
            soul={result.ziwei.soul}
            body={result.ziwei.body}
            lunarDate={result.ziwei.lunarDate}
            captureMode={captureMode}
          />

          {/* 流年運勢 */}
          <YearlyFortuneCard fortune={result.yearlyFortune} captureMode={captureMode} />

          </div>{/* end #fate-result */}

          {/* Footer credit */}
          <div className="text-center text-xs text-slate-600 pt-4">
            <p>命運手記 Fate Notes — Powered by iztro · humandesignhub · Gemini</p>
          </div>
        </div>
      )}
    </main>
  );
}
