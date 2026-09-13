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
      document.addEventListener("pointerdown", handleClickOutside);
      return () => document.removeEventListener("pointerdown", handleClickOutside);
    }
  }, [show, handleClickOutside]);

  return (
    <span ref={wrapperRef} className="inline-flex items-center gap-1">
      {children}
      <span className="relative inline-block">
        {/* 滑鼠：移入就開、移出就關。觸控：只認點擊——手機的一次點擊也會送出「移入」，
            若兩個都處理，會一開一關互相抵銷（舊版手機上點不開的原因）。 */}
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          onPointerEnter={(e) => { if (e.pointerType === "mouse") setShow(true); }}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") setShow(false); }}
          className="-m-2 p-2 text-muted hover:text-accent transition-colors text-sm leading-none cursor-help flex-shrink-0"
          aria-label="說明"
          aria-expanded={show}
        >
          ⓘ
        </button>

        {/* 手機：從畫面底部浮出、左右留邊，不會被螢幕邊緣切掉；桌機：圖示上方的小浮層 */}
        {show && (
          <span
            role="tooltip"
            className="fixed inset-x-4 bottom-4 z-50
                        sm:absolute sm:inset-x-auto sm:bottom-full sm:left-1/2 sm:-translate-x-1/2 sm:mb-2
                        sm:w-max sm:max-w-sm bg-card border border-line
                        rounded-lg px-4 py-3 shadow-xl
                        animate-in fade-in duration-150"
            style={{ display: "block" }}
          >
            {fieldDesc && (
              <span className="block text-xs text-muted leading-snug mb-1.5">
                {fieldDesc}
              </span>
            )}
            {valueDesc && (
              <span className="block text-sm text-ink leading-relaxed">
                {valueDesc}
              </span>
            )}
            {/* Arrow */}
            <span className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-card" />
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
