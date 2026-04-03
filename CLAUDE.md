# 命運手記 Fate Notes — Claude Code 專案指引

建立日期：2026-03-18
最後更新：2026-03-27

## 專案概覽

**目標**：輸入生日時間，同時跑紫微斗數、八字、人類圖、星座，用 AI 交叉比對分析，產出去模糊化的綜合命理報告。
**核心用戶**：Edward 的朋友圈（懂命理、會檢驗排盤精準度）
**線上版**：https://fate-notes.vercel.app
**GitHub**：https://github.com/twilight0918/fate-notes
**Notion PRD**：https://www.notion.so/3275237d8fdf818eb807dac49b129337

---

## 工作規則

1. **Plan First**：任何實作前先產出計畫，等確認後才開始
2. **最小變更原則**：不做 PRD 範圍外的功能
3. **架構問題** → 呼叫太初 agent
4. **Sprint 完成後** → 更新 `.context/STATUS.md`

---

## 技術棧

- **框架**：Next.js 15（App Router, TypeScript）
- **UI**：TailwindCSS
- **紫微排盤**：iztro（npm，本地計算，零 API 費用）
- **八字**：iztro 四柱 → LLM structured output 解讀
- **人類圖**：humandesignhub.app API（free tier）
- **星座**：靜態查詢表 + 月亮/上升星座計算
- **LLM**：BYOK 多供應商（Gemini / OpenAI / Anthropic）
- **部署**：Vercel

---

## 資料夾結構

```
fate-notes/
├── CLAUDE.md               # 本檔案
├── .context/
│   ├── PRE_SPRINT.md       # 技術選型研究（2026-03-18）
│   ├── STATUS.md           # Sprint 進度（持續更新）
│   └── ADR.md              # 架構決策（Sprint 後補）
├── app/
│   ├── page.tsx            # 首頁（輸入表單）
│   ├── result/page.tsx     # 結果頁
│   └── api/
│       ├── analyze/route.ts      # Claude API 主分析
│       └── human-design/route.ts # 人類圖 API（Sprint 3）
├── components/
│   ├── BirthForm.tsx       # 生日輸入表單
│   ├── ZiweiCard.tsx       # 紫微結果展示
│   ├── BaziCard.tsx        # 八字結果展示
│   └── CrossAnalysis.tsx   # 交叉分析報告
└── utils/
    ├── zodiac.ts           # 星座靜態查詢表
    └── iztro-helpers.ts    # iztro 輸出格式化
```

---

## 當前 Sprint

見 `.context/STATUS.md`

---

## 驗證基準

| 系統 | 比對站點 |
|------|---------|
| 紫微斗數 | https://ziwei.pub |
| 八字 | https://www.bazi-lab.com/bazi-calculator |
| 人類圖 | https://www.mybodygraph.com |
| 星座 | 任意 |

---

## 環境變數（.env.local）

```
ANTHROPIC_API_KEY=...
HUMAN_DESIGN_API_KEY=...  # Sprint 3 才需要
```
