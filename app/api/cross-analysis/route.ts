import { NextRequest, NextResponse } from "next/server";
import { generateContent, type Provider, type ModelTier } from "@/utils/ai-provider";
import type { BaziAnalysis } from "@/app/api/analyze/route";
import type { HumanDesignResult } from "@/app/api/human-design/route";

// Re-export for backward compat
export type { ModelTier } from "@/utils/ai-provider";

// ─── Request / Response types ────────────────────────────────────────────────

export interface CrossAnalysisRequest {
  provider: Provider;
  apiKey: string;
  modelTier: ModelTier;
  gender: "male" | "female";
  year: number;
  // 紫微斗數（always available）
  ziwei: {
    chineseDate: string;
    fiveElementsClass: string;
    soul: string;
    body: string;
    soulPalaceMajorStars: string[];
  };
  // 星座（always available）
  zodiac: {
    sign: string;
    element: string;
    traits: string[];
    moonSign?: string;     // 月亮星座
    risingSign?: string;   // 上升星座
  };
  // 八字（optional — may fail）
  bazi?: {
    dayMaster: string;
    dayMasterStrength: string;
    dominantElement: string;
    lackingElement: string;
    personalityTraits: string[];
    summary: string;
  };
  // 人類圖（optional — may fail）
  humanDesign?: {
    type: string;
    strategy: string;
    authority: string;
    profile: string;
    notSelf: string;
    signature: string;
    definedCenters: string[];
    openCenters: string[];
  };
  // MBTI（optional — 自填）
  mbti?: string;
  // 九型人格（optional — 自填）
  enneagram?: number;
  // 流年（optional）
  yearlyFortune?: {
    year: number;
    heavenlyStem: string;
    earthlyBranch: string;
    mutagen: string[];  // [祿, 權, 科, 忌]
  };
}

export interface CrossAnalysis {
  tagline: string;
  portrait: string;
  resonances: {
    theme: string;
    systems: string[];
    insight: string;
  }[];
  tensions: {
    theme: string;
    insight: string;
  }[];
  lifeAspects: {
    career: string;
    wealth: string;
    love: string;
    family: string;
    health: string;
    growth: string;
  };
  guidance: string;
  yearlyInsight?: string;
}

// ─── Prompt builder ──────────────────────────────────────────────────────────

function buildPrompt(data: CrossAnalysisRequest): string {
  const genderLabel = data.gender === "male" ? "男性" : "女性";

  // Ziwei section (always present)
  const ziweiSection = `## 紫微斗數
- 四柱干支：${data.ziwei.chineseDate}
- 五行局：${data.ziwei.fiveElementsClass}
- 命主星：${data.ziwei.soul}
- 身主星：${data.ziwei.body}
- 命宮主星：${data.ziwei.soulPalaceMajorStars.join("、") || "無主星"}`;

  // Zodiac section (always present)
  const moonLine = data.zodiac.moonSign ? `\n- 月亮星座：${data.zodiac.moonSign}（代表內在情緒和安全感來源）` : "";
  const risingLine = data.zodiac.risingSign ? `\n- 上升星座：${data.zodiac.risingSign}（代表外在形象和給人的第一印象）` : "";
  const zodiacSection = `## 西洋星座
- 太陽星座：${data.zodiac.sign}（${data.zodiac.element}象）${moonLine}${risingLine}
- 太陽星座特質：${data.zodiac.traits.join("、")}`;

  // Bazi section (conditional)
  const baziSection = data.bazi
    ? `## 八字命理
- 日主：${data.bazi.dayMaster}
- 身強弱：${data.bazi.dayMasterStrength}
- 最旺五行：${data.bazi.dominantElement}
- 最弱五行：${data.bazi.lackingElement}
- 核心特質：${data.bazi.personalityTraits.join("、")}
- 命局概述：${data.bazi.summary}`
    : "## 八字命理\n（資料不足，此系統不參與分析）";

  // Human Design section (conditional)
  const hdSection = data.humanDesign
    ? `## 人類圖
- 類型：${data.humanDesign.type}
- 策略：${data.humanDesign.strategy}
- 權威：${data.humanDesign.authority}
- 人格線：${data.humanDesign.profile}
- 非自我主題：${data.humanDesign.notSelf}
- 已定義能量中心：${data.humanDesign.definedCenters.join("、") || "無"}
- 開放能量中心：${data.humanDesign.openCenters.join("、") || "無"}`
    : "## 人類圖\n（資料不足，此系統不參與分析）";

  // Yearly fortune section (conditional)
  const yearlySection = data.yearlyFortune
    ? `## 紫微流年（${data.yearlyFortune.year} 年）
- 天干地支：${data.yearlyFortune.heavenlyStem}${data.yearlyFortune.earthlyBranch}年
- 流年四化：化祿→${data.yearlyFortune.mutagen[0] ?? "不明"}、化權→${data.yearlyFortune.mutagen[1] ?? "不明"}、化科→${data.yearlyFortune.mutagen[2] ?? "不明"}、化忌→${data.yearlyFortune.mutagen[3] ?? "不明"}`
    : "";

  // MBTI section (conditional — user self-reported)
  const mbtiSection = data.mbti
    ? `## MBTI 人格類型（自填）
- 類型：${data.mbti}
- 注意：此為命主自我認知的 MBTI 類型，請將此與其他系統結果交叉比對，找出一致性與差異`
    : "";

  // Enneagram section (conditional — user self-reported)
  const ENNEAGRAM_NAMES: Record<number, string> = {
    1: "完美主義者", 2: "助人者", 3: "成就者",
    4: "個人主義者", 5: "觀察者", 6: "忠誠者",
    7: "享樂主義者", 8: "挑戰者", 9: "和平者",
  };
  const enneagramSection = data.enneagram
    ? `## 九型人格（自填）
- 類型：第 ${data.enneagram} 型（${ENNEAGRAM_NAMES[data.enneagram] ?? "未知"}）
- 注意：此為命主自我認知的九型人格，請將此與其他系統結果交叉比對`
    : "";

  const availableSystems: string[] = ["紫微斗數", "星座"];
  if (data.bazi) availableSystems.push("八字");
  if (data.humanDesign) availableSystems.push("人類圖");
  if (data.mbti) availableSystems.push("MBTI");
  if (data.enneagram) availableSystems.push("九型人格");

  return `你是一位精通東西方多系統命理的資深分析師。你的任務是整合以下${availableSystems.length}個命理系統的資料，產出一份深度交叉分析報告——一份「人生使用說明書」。

## 命主基本資料
- 出生年份：${data.year} 年
- 性別：${genderLabel}
- 可用系統：${availableSystems.join("、")}

${ziweiSection}

${baziSection}

${hdSection}

${zodiacSection}

${mbtiSection}

${enneagramSection}

${yearlySection}

---

## 分析原則

1. **交叉驗證**：尋找多個系統中重複出現的信號。例如八字日主為「甲木」（向上生長）而人類圖是「投射者」（引導他人），這構成「天生導師」的交叉信號。
2. **張力辨識**：不迴避系統間的矛盾。例如八字身強（主動進取）但人類圖策略是「等待邀請」（被動接收），這個張力本身就是重要的人生課題。
3. **具體化**：每個洞察必須引用至少兩個系統的具體數據作為支撐，不要空泛地說「你很有領導力」。
4. **人生面向深度**：六個面向（事業/財富/感情/家庭/健康/成長）各 3-4 句，用一般人聽得懂的方式描述，要有具體可行的建議，不是泛泛的勉勵。
5. **語氣**：專業、溫暖、有洞察力。像一位智慧的人生教練，而不是神棍。使用繁體中文。
6. **白話化（最重要）**：讀者是完全不懂命理的一般人。
   - 盡量避免專業命理術語。如果必須使用，一定要在後面用括號或破折號加上白話解釋。
   - 不要假設讀者知道任何命理概念，所有提到的專有名詞都要解釋。
   - 範例：
   - ❌ 「策略為等待回應」
   - ✅ 「你適合的做事方式是等待回應——不主動出擊，而是等待生活中出現讓你有感覺的事再行動」
   - ❌ 「日主甲木身弱」
   - ✅ 「你的核心性格像一棵正在成長的樹（甲木），性格正直向上，但得到的外在支持較少，適合合作借力而非單打獨鬥」
   - ❌ 「薦骨型權威」
   - ✅ 「你做決定的最佳方式是信任身體的直覺反應——感覺想做就做，感覺不對就別勉強，不要用頭腦過度分析」

---

請直接輸出以下 JSON，不要有任何其他文字、說明或 markdown code block：

{
  "tagline": "一句話人格金句，8-15 字，用來快速定義這個人。格式如「XX型OO × YY型ZZ」或「像[比喻]一樣的[特質]」",
  "portrait": "核心人格畫像，5-7 句話，分三層描繪：(1) 本質能量——你天生是什麼樣的人 (2) 外在表現——別人眼中的你是什麼樣子 (3) 生命主題——這輩子要學會的核心功課。全程白話，不要使用未解釋的術語。",
  "resonances": [
    {
      "theme": "交叉主題名稱（如「直覺型領導力」）",
      "systems": ["支持此主題的系統名"],
      "insight": "具體洞察，引用各系統的數據如何共同指向這個主題"
    }
  ],
  "tensions": [
    {
      "theme": "張力主題名稱",
      "insight": "描述系統間的矛盾，以及這個張力如何轉化為成長機會"
    }
  ],
  "lifeAspects": {
    "career": "事業方向：適合的職業類型、工作模式、領導風格，引用具體命理數據",
    "wealth": "財富特質：理財傾向、財運節奏、適合的投資風格",
    "love": "感情模式：戀愛風格、理想伴侶特質、關係中需注意的課題",
    "family": "家庭關係：與父母/子女的互動模式、家族角色定位",
    "health": "身心健康：需注意的五行失衡或能量中心開放帶來的健康議題",
    "growth": "個人成長：修煉方向、突破關鍵、從非自我走向真我的路徑"
  },
  "guidance": "一句話的核心行動建議，整合所有系統的核心訊息"${data.yearlyFortune ? `,
  "yearlyInsight": "今年（${data.yearlyFortune.year}年）的流年綜合解讀，3-4 句話。結合紫微流年四化（化祿、化權、化科、化忌分別落在哪些星，對生活哪些面向有利或需注意）以及其他系統的年度能量，給出今年的重點方向、機會和需注意的課題。必須白話解釋四化的實際影響。"` : ""}
}

注意：
- resonances 陣列產出 2-4 個主題
- tensions 陣列產出 1-2 個主題
- lifeAspects 每個面向 3-4 句話，用白話描述，不要使用未解釋的術語${data.yearlyFortune ? "\n- yearlyInsight 結合流年四化與各系統，給出具體今年建議" : ""}
- 所有文字使用繁體中文`;
}

// ─── API handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body: CrossAnalysisRequest = await req.json();

  if (!body.apiKey || !body.provider) {
    return NextResponse.json(
      { error: "請填入 API Key 後再進行分析" },
      { status: 400 }
    );
  }

  console.log(`[cross-analysis] provider: ${body.provider}, tier: ${body.modelTier}`);

  const prompt = buildPrompt(body);

  try {
    const text = await generateContent(body.provider, body.apiKey, body.modelTier, prompt);

    // Strip markdown code blocks if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[cross-analysis] 無法找到 JSON，原始回應：", text.slice(0, 300));
      return NextResponse.json({ error: "回應格式異常，請稍後再試" }, { status: 500 });
    }

    const analysis: CrossAnalysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[cross-analysis] API 錯誤：", msg);
    return NextResponse.json({ error: "交叉分析失敗，請確認 API Key 是否正確" }, { status: 500 });
  }
}
