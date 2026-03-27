import { NextRequest, NextResponse } from "next/server";
import { generateContent, type Provider, type ModelTier } from "@/utils/ai-provider";

export interface AnalyzeRequest {
  chineseDate: string;
  fiveElementsClass: string;
  soul: string;
  body: string;
  gender: "male" | "female";
  year: number;
  isTimeUnknown: boolean;
  zodiacSign: string;
  zodiacElement: string;
  // BYOK fields
  provider: Provider;
  apiKey: string;
  modelTier: ModelTier;
}

export interface BaziAnalysis {
  dayMaster: string;
  dayMasterStrength: string;
  dominantElement: string;
  lackingElement: string;
  personalityTraits: string[];
  summary: string;
  crossSystemNote: string;
}

export async function POST(req: NextRequest) {
  const body: AnalyzeRequest = await req.json();

  if (!body.apiKey || !body.provider) {
    return NextResponse.json(
      { error: "請填入 API Key 後再進行分析" },
      { status: 400 }
    );
  }

  const genderLabel = body.gender === "male" ? "男性" : "女性";
  const timeNote = body.isTimeUnknown
    ? "出生時辰未知（時柱不計入分析）"
    : "出生時辰已知（四柱齊全）";

  const prompt = `你是一位專業八字命理師，請根據以下資料進行八字分析，輸出繁體中文結果。

## 命主基本資料
- 出生年份：${body.year} 年
- 性別：${genderLabel}
- ${timeNote}

## iztro 計算的四柱干支
${body.chineseDate}

## 五行局（紫微斗數）
${body.fiveElementsClass}

## 紫微斗數
- 命主星：${body.soul}
- 身主星：${body.body}

## 西洋星座
- 星座：${body.zodiacSign}（${body.zodiacElement}象）

---

請直接輸出以下 JSON，不要有任何其他文字、說明或 markdown code block：

{
  "dayMaster": "日主，如「甲木（陽木）」",
  "dayMasterStrength": "身強 或 身弱 或 中和",
  "dominantElement": "最旺五行（木火土金水其中一個）",
  "lackingElement": "最弱五行（木火土金水其中一個）",
  "personalityTraits": ["特質1", "特質2", "特質3", "特質4", "特質5"],
  "summary": "2-3句八字命局核心描述",
  "crossSystemNote": "一句話跨系統呼應觀察"
}`;

  try {
    const text = await generateContent(body.provider, body.apiKey, body.modelTier, prompt);

    // Strip markdown code blocks if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[analyze] 無法找到 JSON，原始回應：", text.slice(0, 200));
      return NextResponse.json({ error: "回應格式異常，請稍後再試" }, { status: 500 });
    }

    const analysis: BaziAnalysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[analyze] API 錯誤：", msg);
    return NextResponse.json({ error: "八字分析失敗，請確認 API Key 是否正確" }, { status: 500 });
  }
}
