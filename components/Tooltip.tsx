"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface TooltipProps {
  /** 欄位定義（淡色第一行） */
  fieldDesc?: string;
  /** 值的說明（主文第二行） */
  valueDesc?: string;
  children: React.ReactNode;
}

/**
 * 通用 Tooltip 元件：ⓘ 圖示 + hover/click 顯示命理術語解釋
 *
 * 兩層內容：
 * 1. fieldDesc — 這個欄位在命理系統中代表什麼（淡色小字）
 * 2. valueDesc — 這個特定值是什麼意思（主文）
 */
export default function Tooltip({ fieldDesc, valueDesc, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  // No tooltip content → render children only
  if (!fieldDesc && !valueDesc) {
    return <>{children}</>;
  }

  // Close on outside click (mobile)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setShow(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [show, handleClickOutside]);

  return (
    <span ref={wrapperRef} className="inline-flex items-center gap-1">
      {children}
      <span className="relative inline-block">
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          className="text-slate-400 hover:text-indigo-400 transition-colors text-sm leading-none cursor-help flex-shrink-0"
          aria-label="說明"
        >
          ⓘ
        </button>

        {show && (
          <span
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                        w-max max-w-sm bg-slate-900 border border-slate-600
                        rounded-lg px-4 py-3 shadow-xl
                        animate-in fade-in duration-150"
            style={{ display: "block" }}
          >
            {fieldDesc && (
              <span className="block text-xs text-slate-400 leading-snug mb-1.5">
                {fieldDesc}
              </span>
            )}
            {valueDesc && (
              <span className="block text-sm text-slate-200 leading-relaxed">
                {valueDesc}
              </span>
            )}
            {/* Arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * Helper: 從 glossary 查詢後組成 Tooltip props
 */
export function lookupTooltip(
  glossary: Record<string, { label?: string; content?: string }>,
  fieldKey: string,
  valueKey?: string,
): { fieldDesc?: string; valueDesc?: string } {
  const field = glossary[fieldKey];
  const value = valueKey ? glossary[valueKey] : undefined;
  return {
    fieldDesc: field?.label,
    valueDesc: value?.content,
  };
}
