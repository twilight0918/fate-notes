# 命運手記 Fate Notes — 專案狀態
最後更新：2026-03-27

---

## 當前狀態

**已上線** 🟢 https://fate-notes.vercel.app
**GitHub** https://github.com/twilight0918/fate-notes（public）

---

## 當前 Phase

**Sprint 6**：部署上線 + BYOK 多供應商 ✅ 完成

**完成項目：**
- [x] BYOK 多供應商支援（Gemini / OpenAI / Anthropic）
- [x] 三種分析模式（快速/標準/深入）+ 各供應商最新模型
- [x] 品牌更名：命運手記 Fate Notes
- [x] 部署前清理（移除 debug route、錯誤訊息通用化、OG metadata、favicon）
- [x] GitHub repo 建立 + Vercel 部署
- [x] Human Design API Key 維持 server-side

---

## Sprint 歷史

### Sprint 6（2026-03-27）✅ 完成
- [x] BYOK：`utils/ai-provider.ts` Provider 抽象層（Gemini/OpenAI/Anthropic）
- [x] 安裝 `openai` SDK；`@anthropic-ai/sdk` 已有
- [x] `/api/analyze` + `/api/cross-analysis` 改為接收前端傳入的 provider + apiKey
- [x] 前端 UI：供應商下拉 → Key 輸入 → 動態模型選擇器
- [x] 品牌更名：標題、metadata、OG tags 更新為「命運手記 Fate Notes」
- [x] 移除 `/api/models` debug route
- [x] 驗收指引改為 footer credit
- [x] 錯誤訊息通用化（不洩漏內部資訊）
- [x] favicon（📖 SVG）+ Open Graph metadata
- [x] Git init + GitHub push + Vercel 部署

### Sprint 5（2026-03-20）✅ 完成
- [x] `ZiweiChart.tsx`（傳統四方盤 CSS grid）
- [x] `YearlyFortuneCard.tsx`（流年四化 + 重點宮位）
- [x] `ShareButton.tsx`（html-to-image 截圖下載）
- [x] `iztro-helpers.ts` 擴展（`getYearlyFortune()`）

### Sprint 4（2026-03-20）✅ 完成
- [x] `/api/cross-analysis/route.ts`（AI 交叉分析）
- [x] `CrossAnalysisCard.tsx`（人格畫像 + 共振 + 張力 + 六面向）
- [x] 模型選擇器（三層級）

### Sprint 3（2026-03-20）✅ 完成
- [x] 人類圖 API 整合（humandesignhub.app）
- [x] 城市→時區 mapping + Strategy/Authority 本地推導

### Sprint 2（2026-03-18/20）✅ 完成
- [x] 八字 AI 分析（Gemini API）+ BaziCard

### Sprint 1（2026-03-18）✅ 完成
- [x] Next.js + iztro 整合 + 紫微排盤 + 星座

### Pre-Sprint（2026-03-18）
- 技術選型研究完成（見 `PRE_SPRINT.md`）

---

## 技術決策記錄

| 日期 | 決策 | 理由 |
|------|------|------|
| 2026-03-27 | BYOK：用戶自帶 API Key，不存 localStorage | 部署後不想用自己的 key 付費；不存避免誤會 |
| 2026-03-27 | 多供應商：Gemini/OpenAI/Anthropic 三選一 | 用戶可能有不同供應商的 key |
| 2026-03-27 | Human Design 維持 server-side key | 該 API 註冊門檻高，一般用戶不會有 |
| 2026-03-27 | 品牌命名「命運手記 Fate Notes」 | Edward 選定 |
| 2026-03-20 | 人類圖用 simple-bodygraph（0.5 cr）+ 本地推導 | `/v1/bodygraph` 是付費端點 |
| 2026-03-20 | `Promise.allSettled` 並行呼叫 | 兩個 API 獨立，partial failure 不互相影響 |
| 2026-03-18 | 八字用 LLM structured output，不用 Python 庫 | npm 替代方案品質不足 |
| 2026-03-18 | iztro 四柱直接供八字解讀使用 | iztro 計算精確（含節氣） |

---

## 模型對應表（2026-03 最新）

| 層級 | Gemini | OpenAI | Anthropic |
|------|--------|--------|-----------|
| 快速 | gemini-2.5-flash | gpt-4.1-mini | claude-haiku-4-5-20251001 |
| 標準 | gemini-3-flash-preview | gpt-4.1 | claude-sonnet-4-6 |
| 深入 | gemini-3.1-pro-preview | o4-mini | claude-opus-4-6 |

---

## 已知問題 / 注意事項

- **HD API**：free tier 100 credits/月（0.5 cr/request）= 200 次/月
- **城市欄位**：60+ 城市 mapping，找不到的 fallback 到 `+08:00`
- **首頁 JS 460 kB**：主要是 iztro 套件，可觀察但暫不優化

---

## Sprint 7 候選（待規劃）

1. **UI 精緻化** — 命盤圖 tooltip、流年年份切換
2. **分享連結** — URL params 帶入出生資料
3. **Rate limiting** — HD API 每 IP 每天限次，防濫用

---

## 檔案結構（當前）

```
fate-notes/
├── CLAUDE.md
├── .env.local               ← HUMAN_DESIGN_API_KEY（server-side only）
├── .context/
│   ├── PRE_SPRINT.md
│   └── STATUS.md            ← 本檔案
├── app/
│   ├── page.tsx             ← 主頁（BYOK 設定 + 表單 + 結果）
│   ├── layout.tsx           ← metadata + OG tags
│   └── api/
│       ├── analyze/route.ts         ← 八字分析（多供應商）
│       ├── cross-analysis/route.ts  ← 交叉分析（多供應商）
│       └── human-design/route.ts    ← humandesignhub.app（server-side key）
├── components/
│   ├── BirthForm.tsx
│   ├── BaziCard.tsx
│   ├── BodyGraph.tsx
│   ├── CrossAnalysisCard.tsx
│   ├── ExpandableSection.tsx
│   ├── HistoryPanel.tsx
│   ├── HumanDesignCard.tsx
│   ├── ProfileOverviewCard.tsx
│   ├── ShareButton.tsx
│   ├── Tooltip.tsx
│   ├── YearlyFortuneCard.tsx
│   └── ZiweiChart.tsx
├── utils/
│   ├── ai-provider.ts      ← Sprint 6 新增（Provider 抽象層）
│   ├── astro-calc.ts
│   ├── geocode.ts
│   ├── glossary.ts
│   ├── hd-gates.ts
│   ├── history.ts
│   ├── iztro-helpers.ts
│   ├── timezone.ts
│   └── zodiac.ts
└── public/
    └── favicon.svg          ← Sprint 6 新增
```
