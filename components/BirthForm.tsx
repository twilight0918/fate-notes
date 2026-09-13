"use client";

import { useState } from "react";
import { clockToTimeIndex, shichenName, UNKNOWN_TIME } from "@/utils/birth-time";

export interface BirthFormData {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number;          // iztro timeIndex 0–12（由出生時間換算，紫微／八字用）
  clockHour?: number;    // 0–23；2026-09 以前的舊紀錄沒有這欄
  minute?: number;       // 0–59
  timeUnknown?: boolean;
  gender: "male" | "female";
  city: string;
  // 進階選填（optional）
  mbti?: string;        // e.g. "INTJ" or undefined
  enneagram?: number;   // 1-9 or undefined
}

interface Props {
  onSubmit: (data: BirthFormData) => void;
  isLoading?: boolean;
  /** 還不能送出（例如沒填 API Key）：按鈕停用，但文字不顯示「分析中」 */
  disabled?: boolean;
}

const MBTI_OPTIONS = [
  "", "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const ENNEAGRAM_OPTIONS = [
  { value: 0, label: "不確定" },
  { value: 1, label: "Type 1 完美主義者" },
  { value: 2, label: "Type 2 助人者" },
  { value: 3, label: "Type 3 成就者" },
  { value: 4, label: "Type 4 個人主義者" },
  { value: 5, label: "Type 5 觀察者" },
  { value: 6, label: "Type 6 忠誠者" },
  { value: 7, label: "Type 7 享樂主義者" },
  { value: 8, label: "Type 8 挑戰者" },
  { value: 9, label: "Type 9 和平者" },
];

const currentYear = new Date().getFullYear();

export default function BirthForm({ onSubmit, isLoading = false, disabled = false }: Props) {
  const [form, setForm] = useState<BirthFormData>({
    name: "",
    year: 1990,
    month: 1,
    day: 1,
    hour: UNKNOWN_TIME.timeIndex,  // 送出時由出生時間換算
    gender: "male",
    city: "Taipei",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BirthFormData, string>>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mbti, setMbti] = useState("");
  const [enneagram, setEnneagram] = useState(0);
  const [clockHour, setClockHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [timeUnknown, setTimeUnknown] = useState(false);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (form.year < 1900 || form.year > currentYear)
      errs.year = `請輸入 1900–${currentYear} 之間的年份`;
    if (form.month < 1 || form.month > 12) errs.month = "月份 1–12";
    if (form.day < 1 || form.day > 31) errs.day = "日期 1–31";
    if (!form.city.trim()) errs.city = "請輸入出生城市";
    if (!timeUnknown) {
      if (!Number.isInteger(clockHour) || clockHour < 0 || clockHour > 23) errs.clockHour = "時 0–23";
      if (!Number.isInteger(minute) || minute < 0 || minute > 59) errs.minute = "分 0–59";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      const time = timeUnknown
        ? UNKNOWN_TIME
        : { hour: clockHour, minute, timeIndex: clockToTimeIndex(clockHour) };
      const data: BirthFormData = {
        ...form,
        hour: time.timeIndex,
        clockHour: time.hour,
        minute: time.minute,
        ...(timeUnknown && { timeUnknown: true }),
        ...(mbti && { mbti }),
        ...(enneagram > 0 && { enneagram }),
      };
      onSubmit(data);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 名字（選填） */}
      <div>
        <label className="block text-sm text-muted mb-1">名字</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="選填，會顯示在報告上"
          className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent placeholder:text-muted/60"
        />
      </div>

      {/* 出生年月日 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-muted mb-1">年</label>
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
            placeholder="1990"
          />
          {errors.year && <p className="text-fire text-xs mt-1">{errors.year}</p>}
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">月</label>
          <input
            type="number"
            min={1} max={12}
            value={form.month}
            onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
            className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
          />
          {errors.month && <p className="text-fire text-xs mt-1">{errors.month}</p>}
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">日</label>
          <input
            type="number"
            min={1} max={31}
            value={form.day}
            onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
            className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
          />
          {errors.day && <p className="text-fire text-xs mt-1">{errors.day}</p>}
        </div>
      </div>

      {/* 出生城市（用於人類圖時區計算） */}
      <div>
        <label className="block text-sm text-muted mb-1">出生城市</label>
        <input
          type="text"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          placeholder="例：Taipei、Tokyo、Hong Kong"
          className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent placeholder:text-muted/60"
        />
        {errors.city && <p className="text-fire text-xs mt-1">{errors.city}</p>}
        <p className="text-xs text-muted mt-1">
          用於人類圖計算時區（不確定可填 Taipei）
        </p>
      </div>

      {/* 出生時間（時＋分） */}
      <div>
        <label className="block text-sm text-muted mb-1">出生時間（24 小時制）</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0} max={23}
                value={clockHour}
                disabled={timeUnknown}
                onChange={(e) => setClockHour(Number(e.target.value))}
                className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent disabled:opacity-40"
              />
              <span className="text-sm text-muted flex-shrink-0">時</span>
            </div>
            {errors.clockHour && <p className="text-fire text-xs mt-1">{errors.clockHour}</p>}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0} max={59}
                value={minute}
                disabled={timeUnknown}
                onChange={(e) => setMinute(Number(e.target.value))}
                className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent disabled:opacity-40"
              />
              <span className="text-sm text-muted flex-shrink-0">分</span>
            </div>
            {errors.minute && <p className="text-fire text-xs mt-1">{errors.minute}</p>}
          </div>
        </div>
        <label className="flex items-center gap-2 mt-2 text-xs text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={timeUnknown}
            onChange={(e) => setTimeUnknown(e.target.checked)}
            className="accent-accent"
          />
          不知道出生時間
        </label>
        <p className="text-xs text-muted mt-1">
          {timeUnknown
            ? "紫微、八字以午時排盤，上升星座與人類圖以中午 12:00 計算，準確度會降低"
            : `對應時辰：${shichenName(clockToTimeIndex(clockHour))}。上升星座與人類圖會用到分鐘，越精確越好`}
        </p>
      </div>

      {/* 性別 */}
      <div>
        <label className="block text-sm text-muted mb-1">性別</label>
        <div className="flex gap-3">
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm({ ...form, gender: g })}
              className={`flex-1 py-2 rounded-lg border transition-colors ${
                form.gender === g
                  ? "bg-accent border-accent text-paper"
                  : "bg-paper border-line text-ink/80 hover:border-accent/40"
              }`}
            >
              {g === "male" ? "男" : "女"}
            </button>
          ))}
        </div>
      </div>

      {/* 進階選填（摺疊） */}
      <div className="border-t border-line pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors"
        >
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▶</span>
          進階選填（可增加分析深度）
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3">
            {/* MBTI */}
            <div>
              <label className="block text-sm text-muted mb-1">MBTI 類型</label>
              <select
                value={mbti}
                onChange={(e) => setMbti(e.target.value)}
                className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              >
                <option value="">不確定 / 未填</option>
                {MBTI_OPTIONS.filter(Boolean).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <p className="text-xs text-muted/70 mt-1">
                不知道可以到{" "}
                <a href="https://www.16personalities.com/ch" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                  16personalities.com
                </a>{" "}
                免費測驗
              </p>
            </div>

            {/* 九型人格 */}
            <div>
              <label className="block text-sm text-muted mb-1">九型人格</label>
              <select
                value={enneagram}
                onChange={(e) => setEnneagram(Number(e.target.value))}
                className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-accent"
              >
                {ENNEAGRAM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 送出 */}
      <button
        type="submit"
        disabled={isLoading || disabled}
        className="w-full py-3 bg-accent hover:bg-accent/90 disabled:bg-line disabled:text-muted disabled:cursor-not-allowed text-paper font-medium rounded-lg transition-colors"
      >
        {isLoading ? "分析中…" : "開始命理分析"}
      </button>
    </form>
  );
}
