"use client";

import { useState } from "react";

export interface BirthFormData {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: "male" | "female";
  city: string;
  // 進階選填（optional）
  mbti?: string;        // e.g. "INTJ" or undefined
  enneagram?: number;   // 1-9 or undefined
}

interface Props {
  onSubmit: (data: BirthFormData) => void;
  isLoading?: boolean;
}

// iztro timeIndex: 0-11 對應十二時辰，12 = 不知道
const HOUR_OPTIONS = [
  { value: 12, label: "不知道出生時辰" },
  { value: 0,  label: "子時（23:00–01:00）" },
  { value: 1,  label: "丑時（01:00–03:00）" },
  { value: 2,  label: "寅時（03:00–05:00）" },
  { value: 3,  label: "卯時（05:00–07:00）" },
  { value: 4,  label: "辰時（07:00–09:00）" },
  { value: 5,  label: "巳時（09:00–11:00）" },
  { value: 6,  label: "午時（11:00–13:00）" },
  { value: 7,  label: "未時（13:00–15:00）" },
  { value: 8,  label: "申時（15:00–17:00）" },
  { value: 9,  label: "酉時（17:00–19:00）" },
  { value: 10, label: "戌時（19:00–21:00）" },
  { value: 11, label: "亥時（21:00–23:00）" },
];

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

export default function BirthForm({ onSubmit, isLoading = false }: Props) {
  const [form, setForm] = useState<BirthFormData>({
    name: "",
    year: 1990,
    month: 1,
    day: 1,
    hour: 6,  // 午時（timeIndex 6）作為預設
    gender: "male",
    city: "Taipei",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BirthFormData, string>>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mbti, setMbti] = useState("");
  const [enneagram, setEnneagram] = useState(0);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (form.year < 1900 || form.year > currentYear)
      errs.year = `請輸入 1900–${currentYear} 之間的年份`;
    if (form.month < 1 || form.month > 12) errs.month = "月份 1–12";
    if (form.day < 1 || form.day > 31) errs.day = "日期 1–31";
    if (!form.city.trim()) errs.city = "請輸入出生城市";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      const data: BirthFormData = {
        ...form,
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
        <label className="block text-sm text-slate-400 mb-1">名字</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="選填，會顯示在報告上"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
        />
      </div>

      {/* 出生年月日 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-slate-400 mb-1">年</label>
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            placeholder="1990"
          />
          {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">月</label>
          <input
            type="number"
            min={1} max={12}
            value={form.month}
            onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
          />
          {errors.month && <p className="text-red-400 text-xs mt-1">{errors.month}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">日</label>
          <input
            type="number"
            min={1} max={31}
            value={form.day}
            onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
          />
          {errors.day && <p className="text-red-400 text-xs mt-1">{errors.day}</p>}
        </div>
      </div>

      {/* 出生城市（用於人類圖時區計算） */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">出生城市</label>
        <input
          type="text"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          placeholder="例：Taipei、Tokyo、Hong Kong"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
        />
        {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
        <p className="text-xs text-slate-500 mt-1">
          用於人類圖計算時區（不確定可填 Taipei）
        </p>
      </div>

      {/* 出生時辰 */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">出生時辰</label>
        <select
          value={form.hour}
          onChange={(e) => setForm({ ...form, hour: Number(e.target.value) })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
        >
          {HOUR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          不確定時辰可選「午時」，命盤仍可參考
        </p>
      </div>

      {/* 性別 */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">性別</label>
        <div className="flex gap-3">
          {(["male", "female"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm({ ...form, gender: g })}
              className={`flex-1 py-2 rounded-lg border transition-colors ${
                form.gender === g
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              {g === "male" ? "男" : "女"}
            </button>
          ))}
        </div>
      </div>

      {/* 進階選填（摺疊） */}
      <div className="border-t border-slate-800 pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▶</span>
          進階選填（可增加分析深度）
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3">
            {/* MBTI */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">MBTI 類型</label>
              <select
                value={mbti}
                onChange={(e) => setMbti(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">不確定 / 未填</option>
                {MBTI_OPTIONS.filter(Boolean).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <p className="text-xs text-slate-600 mt-1">
                不知道可以到{" "}
                <a href="https://www.16personalities.com/ch" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">
                  16personalities.com
                </a>{" "}
                免費測驗
              </p>
            </div>

            {/* 九型人格 */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">九型人格</label>
              <select
                value={enneagram}
                onChange={(e) => setEnneagram(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
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
        disabled={isLoading}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {isLoading ? "分析中…" : "開始命理分析"}
      </button>
    </form>
  );
}
