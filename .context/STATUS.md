# fate-map — 專案狀態
最後更新：2026-03-20

---

## 當前 Phase

**Sprint 5**：命盤圖 + 截圖分享 + 紫微流年 🚧 實作完成，待驗收
目標：紫微四方盤視覺化、流年運勢、截圖下載分享

**驗收條件：**
- [x] `components/ZiweiChart.tsx` — 傳統四方盤 4×4 grid
- [x] `components/YearlyFortuneCard.tsx` — 流年四化 + 重點宮位
- [x] `components/ShareButton.tsx` — html-to-image 截圖下載
- [x] `utils/iztro-helpers.ts` — 新增 `getYearlyFortune()`
- [x] `app/page.tsx` — 整合三元件 + `id="fate-result"`
- [x] TypeScript 0 errors + build 成功
- [ ] **待驗收**：命盤圖 12 宮位正確排列，命宮/身宮有標記
- [ ] **待驗收**：流年四化（祿權科忌）與 iztro 一致
- [ ] **待驗收**：截圖下載按鈕產出 PNG 含完整卡片

---

## Sprint 歷史

### Sprint 5（2026-03-20）🚧 待驗收
- [x] `ZiweiChart.tsx`（傳統四方盤，地支→grid 位置 mapping，命/身宮標記）
- [x] `YearlyFortuneCard.tsx`（流年四化 + 命宮/財帛/官祿/夫妻/遷移/福德）
- [x] `ShareButton.tsx`（html-to-image `toPng`，2x pixel ratio，深色背景）
- [x] `iztro-helpers.ts` 擴展（`getYearlyFortune()` 用 `astrolabe.horoscope()`）
- [x] `page.tsx` 整合（ZiweiChart 取代十二宮位列表 + YearlyFortuneCard + ShareButton）
- [x] TypeScript 0 errors + build 成功
- [ ] 端到端驗收

### Sprint 4（2026-03-20）🚧 待驗收
- [x] `/api/cross-analysis/route.ts`（Gemini 三層模型：test/normal/premium）
- [x] `CrossAnalysisCard.tsx`（人格畫像 + 共振信號 + 張力點 + 六面向人生說明書 + 總結）
- [x] `page.tsx` 更新（介面模型選擇器 + 接續式 API call + progressive rendering）
- [x] TypeScript 0 errors
- [ ] 端到端驗收

### Sprint 3（2026-03-20）✅ 完成
- [x] 人類圖 API 整合（humandesignhub.app `/v1/simple-bodygraph`）
- [x] 城市→時區 mapping（60+ 城市）
- [x] Strategy/NotSelf/Signature 本地查表（from Type）
- [x] Authority 本地推導（from defined centers 優先順序）
- [x] 四系統並排（紫微 + 八字 + 人類圖 + 星座）

### Sprint 2（2026-03-18/20）✅ 完成（含驗收）
- [x] `/api/analyze` route（Gemini API gemini-2.5-flash + JSON prompt）
- [x] `BaziCard` 元件（日主、身強弱、五行、特質、摘要、交叉觀察）
- [x] `page.tsx` 更新（async API call，iztro 計算 → Gemini 解讀流程）
- [x] TypeScript 0 errors
- [x] bazi-lab.com 比對四柱干支 ✓

### Sprint 1（2026-03-18）✅ 完成（含驗收）
- [x] Next.js + TypeScript + Tailwind 可啟動
- [x] iztro v2.5.8 安裝，`bySolar()` 正常呼叫
- [x] 輸入表單（生日/時辰/性別/城市）
- [x] 12 宮位主星 + 命/身宮標示 + 星座
- [x] ziwei.pub 人工比對 ✓

### Pre-Sprint（2026-03-18）
- iztro v2.5.8 確認可用（本地 npm，無 API 費用）
- 八字改採 Gemini API（@google/genai v1.46.0，gemini-2.5-flash）
- 人類圖：humandesignhub.app 免費 100 credits/月（0.5 cr/request）
- 驗證基準：紫微→ziwei.pub，八字→bazi-lab.com，人類圖→mybodygraph.com

---

## 技術決策記錄

| 日期 | 決策 | 理由 |
|------|------|------|
| 2026-03-18 | 八字用 Gemini API（gemini-2.5-flash），不用 Python 庫 | npm 替代方案品質不足；Gemini free tier 夠用 |
| 2026-03-18 | iztro 四柱直接供八字解讀使用 | iztro 計算精確（含節氣），不讓 LLM 重算曆法 |
| 2026-03-18 | 學派聲明：標準安星法 + 通用解讀原則 | iztro v2.3.0+ 支援多派配置 |
| 2026-03-20 | 人類圖用 simple-bodygraph（0.5 cr）+ 本地推導 | `/v1/bodygraph` 是付費端點（403）；Strategy/Authority 是確定性規則，可本地計算 |
| 2026-03-20 | Strategy/NotSelf/Signature 本地查表，Authority 從 defined centers 推導 | 無額外 API 費用；結果與付費端點一致 |
| 2026-03-20 | `Promise.allSettled` 並行呼叫 Gemini + HD API | 兩個 API 獨立，並行省 ~3 秒；partial failure 各自處理不互相影響 |
| 2026-03-20 | 交叉分析用 Gemini 三層模型（test/normal/premium），介面切換 | 使用者可選擇分析品質 vs 速度/費用；預設 test（gemini-2.5-flash 免費） |
| 2026-03-20 | 交叉分析在八字/人類圖完成後接續呼叫（不並行） | 需要兩系統的結果作為 prompt 輸入；progressive rendering 讓使用者先看到個別結果 |
| 2026-03-20 | 紫微命盤改為 CSS grid 四方盤（取代 2-col 列表） | 傳統排列更直覺；地支→grid 位置 mapping |
| 2026-03-20 | 流年用 iztro `.horoscope()` 純前端計算 | 零 API 費用；iztro 已支援大限/流年/流月/流日 |
| 2026-03-20 | 截圖用 html-to-image（toPng） | 比 html2canvas 更輕量、SVG 支援更好 |

---

## 已知問題 / 注意事項

- **Gemini API**：需要 Google AI Studio Tier 1（已設定計費）；model = `gemini-2.5-flash`
- **HD API**：free tier 100 credits/月（0.5 cr/request）= 200 次/月
- **城市欄位**：60+ 城市 mapping，找不到的 fallback 到 `+08:00`
- **布局排序**：交叉分析 → 八字 → 人類圖 → 紫微基本資訊 → 命盤圖 → 流年
- **Grammarly 警告**：`suppressHydrationWarning` 已加在 `<body>`，無功能影響
- **BodyGraph 人形 SVG**：P3 延後，目前為純能量中心圖表，未來可加回冥想人形

---

## Sprint 6 候選（待規劃）

優先序：
1. **Vercel 部署** — 讓朋友可以用
2. **UI 精緻化** — 命盤圖 tooltip、流年年份切換
3. **分享連結** — URL params 帶入出生資料

---

## 檔案結構（當前）

```
fate-map/
├── CLAUDE.md
├── .env.local               ← GEMINI_API_KEY + HUMAN_DESIGN_API_KEY
├── .env.local.example
├── .context/
│   ├── PRE_SPRINT.md
│   └── STATUS.md            ← 本檔案
├── app/
│   ├── page.tsx             ← 主頁（表單 + 模型選擇器 + 結果 + 截圖按鈕）
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── analyze/
│       │   └── route.ts     ← Gemini 八字分析
│       ├── cross-analysis/
│       │   └── route.ts     ← Gemini 交叉分析
│       ├── human-design/
│       │   └── route.ts     ← humandesignhub.app + 本地推導
│       └── models/
│           └── route.ts     ← Gemini 模型列表
├── components/
│   ├── BirthForm.tsx        ← 含城市欄位
│   ├── BaziCard.tsx
│   ├── BodyGraph.tsx        ← 人類圖能量中心 SVG
│   ├── CrossAnalysisCard.tsx
│   ├── HumanDesignCard.tsx
│   ├── ShareButton.tsx      ← Sprint 5 新增（截圖下載）
│   ├── Tooltip.tsx
│   ├── YearlyFortuneCard.tsx ← Sprint 5 新增（流年運勢）
│   └── ZiweiChart.tsx       ← Sprint 5 新增（命盤四方盤）
└── utils/
    ├── glossary.ts
    ├── hd-gates.ts
    ├── iztro-helpers.ts     ← Sprint 5 擴展（getYearlyFortune）
    ├── timezone.ts
    └── zodiac.ts
```
