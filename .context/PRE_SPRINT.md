# fate-notes — Sprint 1 就緒包
研究完成：2026-03-18
作者：Claude Code 主腦（研究 sprint）

> **用途**：本文件解決 PRD 中四個 open questions，確認所有技術選型後即可直接開工 Sprint 1。

---

## 🔑 最重要結論：架構簡化

**原 PRD 說需要 Python 做八字** → **改為：純 Next.js，不需要 Python**

原因：找不到可靠的 Python/npm 八字庫（主要候選都有致命問題），但 Claude API 可以 structured output 輸出四柱，PRD 本身也允許「LLM 結構化輸出」作為備選方案。

---

## 1. 紫微斗數：iztro ✅ 確認可用

**狀態**：v2.5.8（2026-03-05 釋出），積極維護中
**Author**：SylarLong（有完整文件社群 iztro.com）

### API 使用方式
```typescript
import { astro } from 'iztro';

// 陽曆輸入（推薦）
const astrolabe = astro.astrolabeBySolarDate("2000-08-16", 2, "female", false, "zh-TW");

// 農曆輸入
const astrolabe = astro.astrolabeBySolarDate("2000-07-17", 2, "female", false, "zh-TW");
```

**參數說明**：
- 第1參數：日期字串 "YYYY-MM-DD"
- 第2參數：出生時辰（整數 0-23，注意不是傳入時辰名稱）
- 第3參數：性別 "male" / "female"（英文 API）或 "男" / "女"（中文 API）
- 第4參數：日光節約時間 boolean
- 第5參數：語言 `"zh-TW"` | `"zh-CN"` | `"en-US"` 等

### 輸出結構
```typescript
astrolabe.solarDate        // 陽曆
astrolabe.lunarDate        // 農曆
astrolabe.chineseDate      // 干支紀年法（四柱）
astrolabe.fiveElementsClass // 五行局
astrolabe.soul             // 命宮天干
astrolabe.body             // 身宮天干
astrolabe.palaces          // 陣列，12 個宮位
astrolabe.palaces[0].name  // 宮位名稱（如「命宮」「財帛」）
astrolabe.palaces[0].majorStars  // 主星陣列
astrolabe.palaces[0].minorStars  // 副星陣列
astrolabe.horoscope(new Date())  // 流年流月資料
```

### ⚠️ 重要：ziwei.pub 是 iztro 自家 demo 站
ziwei.pub / demo.iztro.com / iztro.com 全都是同一個作者 SylarLong 的相關網站。
「與 ziwei.pub 比對」= 「確認我們的 iztro 程式碼正確呼叫了 API」，不是獨立第三方驗證。
→ **驗證方式**：用 ziwei.pub 確認 API 呼叫正確，已足夠。

---

## 2. 八字：改用 LLM 結構化輸出 🔄

### 原方案淘汰原因
| 候選 | 問題 |
|------|------|
| `china-testing/bazi`（Python）| 輸出是 print text，非 JSON；無法 pip install；實為 CLI 工具 |
| `bazi-calculator-by-alvamind`（npm）| 僅 20 stars、4 commits；社群極小；準確度無法驗證 |

### 推薦方案：Claude API Structured Output
PRD 原文允許「LLM 結構化輸出」作為備選，現升為主方案。

**優點**：
- 無需額外 library 或語言（已有 Claude API）
- 四柱計算是規則性的，Claude 能夠正確計算
- 解讀層（十神、五行強弱）由 LLM 直接輸出，流程一致
- 不引入 Python subprocess 的架構複雜性

**Prompt 設計方向**（Sprint 2 時細化）：
```
輸入：陽曆生日 + 出生時間 + 性別
第一步：輸出四柱 JSON（年柱/月柱/日柱/時柱，各含天干+地支）
第二步：計算五行強弱比例
第三步：輸出日主 + 十神關係
格式：結構化 JSON，每個欄位明確命名
```

**驗證方式**：用 [bazi-lab.com](https://www.bazi-lab.com/bazi-calculator)（有真太陽時校正，業界最準）對比四柱輸出。

---

## 3. 人類圖：humandesignhub.app ✅ 推薦

**官網**：https://humandesignhub.app/docs
**費用**：Free tier 100 credits/月

### Credit 消耗
| 端點 | Credits |
|------|---------|
| simple-bodygraph | 0.5 |
| **bodygraph（完整）** | **1** |
| transit-overlay | 1.5 |
| composite | 2 |

→ **100 credits = 每月 100 次完整 bodygraph 請求**，Portfolio demo 完全夠用

### API 規格
```bash
POST https://api.humandesignhub.app/v1/bodygraph
Header: X-API-KEY: <your_key>
Body: {
  "datetime": "1990-01-01T12:00+08:00",  # ISO 8601 含時區
  "city": "Taipei"                         # 城市名稱
}
```

**輸出包含**：Type、Strategy、Authority、Profile、Centers、Gates、Channels

### 取得 API Key
前往 https://humandesignhub.app/en/developer 註冊

### 驗證方式
用 [mybodygraph.com](https://www.mybodygraph.com/) 比對 Type + Profile + Authority 三個核心欄位。

### 備選方案（若 humandesignhub 不夠用）
- bodygraph.com API（有 free trial，需詢問詳細方案）
- humandesignapi.nl（€229 一次性，lifetime，Q2 2026 將改訂閱制）

---

## 4. 星座：靜態查詢表

**無需任何 library**，直接在 `utils/zodiac.ts` 實作：
```typescript
const ZODIAC_MAP = [
  { sign: "魔羯座", start: "01-01", end: "01-19" },
  { sign: "水瓶座", start: "01-20", end: "02-18" },
  // ...
];
```

**驗證方式**：任何星座網站均可（如 astro.com）

---

## 5. 驗證基準總覽

| 系統 | 驗證站點 | 驗證欄位 |
|------|---------|---------|
| 紫微斗數 | [ziwei.pub](https://ziwei.pub) | 12 宮主星、命宮天干 |
| 八字 | [bazi-lab.com](https://www.bazi-lab.com/bazi-calculator) | 四柱（年月日時）天干地支 |
| 人類圖 | [mybodygraph.com](https://www.mybodygraph.com) | Type + Profile + Authority |
| 星座 | 任意 | 太陽星座 |

---

## 6. 最終架構（更新後）

```
前端（Next.js）
  ├─ 輸入表單（生日/時間/性別）
  ├─ iztro（npm，client-side）→ 紫微排盤 JSON
  ├─ 星座查詢表（utils/zodiac.ts，本地）
  └─ UI 呈現 + 互動問答

後端（Next.js API Routes）
  ├─ /api/human-design → 呼叫 humandesignhub.app API
  └─ /api/analyze → 呼叫 Claude API
       ├─ 八字：structured output（四柱 + 五行 + 十神）
       ├─ 各系統獨立解讀
       ├─ 交叉分析 + 信心度
       └─ 互動問答上下文

外部服務
  ├─ humandesignhub.app（人類圖 API，free tier）
  └─ Claude API（八字計算 + 所有 LLM 解讀）
```

**與原 PRD 差異**：
- 移除 Python 後端（無 subprocess）
- 八字從 Python 庫 → Claude API structured output
- 架構更簡潔：純 Next.js + 兩個外部 API

---

## 7. Sprint 1 開工清單

確認以下後即可執行 `npx create-next-app@latest fate-notes`：

- [ ] **Edward 確認**：八字改用 LLM 方案，不用 Python 庫
- [ ] **Edward 確認**：humandesignhub.app 免費額度夠用（100 calls/月）
- [ ] **Sprint 1 執行**：
  - Next.js 初始化（App Router, TypeScript, TailwindCSS）
  - 安裝 iztro（`npm install iztro`）
  - 建立輸入表單 UI
  - 整合 iztro 驗證（對比 ziwei.pub）
  - 建立 `/api/human-design` 路由（humandesignhub.app 連線測試）

---

## 附：套件清單（Sprint 1 需安裝）

```bash
npm install iztro                    # 紫微排盤
npm install @anthropic-ai/sdk        # Claude API（八字 + 解讀）
# humandesignhub.app 直接 fetch，無需 SDK
```

---

*文件由 Claude Code 主腦研究產出，2026-03-18*
*下一步：Edward 確認兩個決策後 → Sprint 1 開工*
