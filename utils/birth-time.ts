// ─── Birth time helpers ──────────────────────────────────────────────────────
// The form collects clock time (HH:MM). iztro (紫微／八字) works in 時辰
// indices, so the clock time is converted here; the natal chart (上升／月亮)
// and Human Design use the clock time down to the minute.

/** iztro timeIndex 0–12：0＝早子時（00:00–01:00）… 11＝亥時，12＝晚子時（23:00–24:00） */
export const TIME_INDEX_LABELS = [
  "早子時（00:00–01:00）",
  "丑時（01:00–03:00）",
  "寅時（03:00–05:00）",
  "卯時（05:00–07:00）",
  "辰時（07:00–09:00）",
  "巳時（09:00–11:00）",
  "午時（11:00–13:00）",
  "未時（13:00–15:00）",
  "申時（15:00–17:00）",
  "酉時（17:00–19:00）",
  "戌時（19:00–21:00）",
  "亥時（21:00–23:00）",
  "晚子時（23:00–24:00）",
];

/** 時間不詳時的預設：紫微／八字排午時，星盤／人類圖用中午 12:00 */
export const UNKNOWN_TIME = { hour: 12, minute: 0, timeIndex: 6 } as const;

/** 時鐘小時（0–23）→ iztro timeIndex（0–12） */
export function clockToTimeIndex(hour: number): number {
  if (hour === 23) return 12; // 晚子時
  return Math.floor((hour + 1) / 2);
}

/** 時辰名稱（不含時間範圍），例：「寅時」 */
export function shichenName(timeIndex: number): string {
  return (TIME_INDEX_LABELS[timeIndex] ?? "").replace(/（.*$/, "");
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * 顯示用的出生時間。新紀錄有時與分；2026-09 以前的舊紀錄只存了時辰
 * （舊表單的 hour 12 代表「不知道」，0 代表整個子時）。
 */
export function formatBirthTime(bd: {
  hour: number;
  clockHour?: number;
  minute?: number;
  timeUnknown?: boolean;
}): string {
  if (bd.timeUnknown) return "出生時間不詳";
  if (bd.clockHour !== undefined && bd.minute !== undefined) {
    return `${pad2(bd.clockHour)}:${pad2(bd.minute)}（${shichenName(bd.hour)}）`;
  }
  if (bd.hour === 12) return "出生時辰不詳";
  if (bd.hour === 0) return "子時（23:00–01:00）";
  return TIME_INDEX_LABELS[bd.hour] ?? "—";
}
