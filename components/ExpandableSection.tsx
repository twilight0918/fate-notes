"use client";

import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}

export default function ExpandableSection({
  title,
  children,
  defaultOpen = false,
  forceOpen = false,
}: Props) {
  const [manualOpen, setManualOpen] = useState(defaultOpen);
  const isOpen = manualOpen || forceOpen;

  return (
    <div className="mt-3 border-t border-slate-700/50 pt-3">
      <button
        type="button"
        onClick={() => setManualOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {title}
      </button>

      {/* Always render children for screenshot capture; toggle visibility via CSS */}
      <div className={`mt-2 space-y-3 text-sm leading-relaxed ${isOpen ? "" : "hidden"}`}>
        {children}
      </div>
    </div>
  );
}
