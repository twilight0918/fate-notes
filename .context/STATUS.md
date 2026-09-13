# 命運手記 Fate Notes — 專案狀態
最後更新：2026-09-11

---

## 當前狀態

**已上線** 🟢 https://fate-notes.vercel.app
**GitHub** https://github.com/twilight0918/fate-notes（public）

---

## 當前 Phase

**Sprint 8**：出生時間改時分＋紙本手帳改版＋單檔 HTML 報告＋標準人體圖 🟡 分支 `feat/birthtime-redesign` 完成、待 Edward 手機實測後合併

詳見下方「Sprint 8（2026-09-11）」段。

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
| 2026-09-08 | API Key 改存 sessionStorage（per provider） | 每次重整都要重貼是實際使用時最大的摩擦；sessionStorage 分頁關掉就沒，不落硬碟，維持 2026-03-27「不進 localStorage」的原意 |
| 2026-09-08 | Gemini 改用 `-latest` 別名而非釘版本 | 停工五個月後回來，釘的 preview 版隨時可能下架；別名讓這張表不會再過期 |
| 2026-03-27 | BYOK：用戶自帶 API Key，不存 localStorage | 部署後不想用自己的 key 付費；不存避免誤會 |
| 2026-03-27 | 多供應商：Gemini/OpenAI/Anthropic 三選一 | 用戶可能有不同供應商的 key |
| 2026-03-27 | Human Design 維持 server-side key | 該 API 註冊門檻高，一般用戶不會有 |
| 2026-03-27 | 品牌命名「命運手記 Fate Notes」 | Edward 選定 |
| 2026-03-20 | 人類圖用 simple-bodygraph（0.5 cr）+ 本地推導 | `/v1/bodygraph` 是付費端點 |
| 2026-03-20 | `Promise.allSettled` 並行呼叫 | 兩個 API 獨立，partial failure 不互相影響 |
| 2026-03-18 | 八字用 LLM structured output，不用 Python 庫 | npm 替代方案品質不足 |
| 2026-03-18 | iztro 四柱直接供八字解讀使用 | iztro 計算精確（含節氣） |

---

## 模型對應表（2026-09-08 更新）

| 層級 | Gemini | OpenAI | Anthropic |
|------|--------|--------|-----------|
| 快速 | gemini-flash-lite-latest | gpt-4.1-mini ⚠️ | claude-haiku-4-5 |
| 標準 | gemini-flash-latest | gpt-4.1 ⚠️ | claude-sonnet-5 |
| 深入 | gemini-pro-latest | o4-mini ⚠️ | claude-opus-5 |

- Gemini 改用 `-latest` 別名，不再釘 preview 版（`gemini-3-flash-preview` /
  `gemini-3.1-pro-preview` 這類 preview build 會無預警下架）。三個別名
  2026-09-08 實測可生成。
- ⚠️ OpenAI 三個 ID 是 2026-03 的，2026-09-08 沒有 key 可驗，可能已下架。

---

## 已知問題 / 注意事項

- **HD API**：free tier 100 credits/月（0.5 cr/request）= 200 次/月
- **城市欄位**：60+ 城市 mapping，找不到的 fallback 到 `+08:00`
- **首頁 JS 460 kB**：主要是 iztro 套件，可觀察但暫不優化

---

## Sprint 8（2026-09-11）🟡 分支完成、未合併

分支 `feat/birthtime-redesign`。

- [x] 出生時間改填「時＋分」，時辰由時間換算（`utils/birth-time.ts`）；修兩個舊 bug：「不知道時辰」被 iztro 當晚子時、23 點出生被排成早子時（日柱差一天）
- [x] 星盤／人類圖改用實際時分計算（原本用時辰中點，上升星座會錯）
- [x] 下載報告改成單一 HTML（`utils/report-html.ts`＋`components/report/ReportDocument.tsx`）：樣式內嵌、離線可開、可列印、原始資料以 JSON 附在檔內；移除截圖版 `ShareButton`（`html-to-image` 依賴尚未從 package.json 移除）
- [x] 標準人體圖 `BodyGraphStandard`（hdkit／natalengine MIT 幾何），取代舊 `BodyGraph`
- [x] 紙本手帳配色：語意色 token（`tailwind.config.ts`＋`app/globals.css`），淺深色跟系統；金＝金黃、土＝棕
- [x] 結果區改分頁籤（總覽／八字／紫微／星座／人類圖／流年），輸入區有結果後收成一行
- [x] 手機：說明浮層改底部彈出、點擊範圍放大（舊版手機一點會開了又關）；紫微命盤框內橫滑；下載鈕移到摘要列
- [ ] Edward 手機實測（L2 驗收閘）→ 合併 main → Vercel 部署

## Sprint 7（2026-09-08）✅ 完成

停工五個多月後的復工。目標是「能直接拿來用」，不是加功能。

- [x] 模型對應表全面更新（見上表）；Gemini 改別名、Anthropic 換 5 系
- [x] API Key 存 sessionStorage，分頁生命週期內免重貼（不落 localStorage/硬碟）
- [x] 更名 commit `d68e06a` 補推（2026-04-03 卡在本機五個月，線上跑的是更名前那版）

**復工時實測（2026-09-08）**：Gemini 三檔位可生成、人類圖 API key 有效且有額度、
線上 `/api/analyze` 端到端 HTTP 200、`npm run build` 通過。

### Edward 明確裁決不做

- **流年年份切換** — 不做。「通常流年也只看今年」。
  （`getYearlyFortune(input, targetYear?)` 本來就吃年份參數，`page.tsx` 不傳＝取今年，維持現狀）
- **HD API rate limiting** — 不做。自己用，不散連結。
- **紀錄匯出／匯入** — 不做。

### 仍未做

1. **命盤圖 tooltip** — 查驗後發現 Sprint 5 就做了（ZiweiChart / YearlyFortuneCard 皆已接 Tooltip），原紀錄漏更新
2. **分享連結** — URL params 帶入出生資料，未做
3. **錯誤訊息過於通用** — 部署前一律改成同一句，實際使用時 401（key 錯）跟 429（額度滿）看起來一樣
4. **首頁 460 kB** — iztro 佔大宗，可 dynamic import，純潔癖

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
