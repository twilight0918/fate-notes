"use client";

import { useState } from "react";
import { toPng } from "html-to-image";

interface ShareButtonProps {
  targetId: string;
  fileName?: string;
  label?: string;
  className?: string;
  onBeforeCapture?: () => Promise<void>;
  onAfterCapture?: () => void;
}

export default function ShareButton({
  targetId,
  fileName = "fate-map-report",
  label = "下載報告圖片",
  className = "",
  onBeforeCapture,
  onAfterCapture,
}: ShareButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  async function handleCapture() {
    const element = document.getElementById(targetId);
    if (!element) return;

    setIsCapturing(true);
    try {
      // 1. Trigger capture mode (expand all sections)
      if (onBeforeCapture) {
        await onBeforeCapture();
        // Wait for React to re-render with expanded sections
        await new Promise<void>((resolve) => requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        }));
      }

      // 2. Capture the screenshot
      const dataUrl = await toPng(element, {
        backgroundColor: "#0f172a", // slate-900
        pixelRatio: 2,
      });

      // 3. Exit capture mode
      onAfterCapture?.();

      // 4. Trigger download
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("截圖失敗:", err);
      onAfterCapture?.(); // Ensure we exit capture mode even on error
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <button
      onClick={handleCapture}
      disabled={isCapturing}
      className={`inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 ${className}`}
    >
      {isCapturing ? (
        <>
          <span className="w-3 h-3 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
          擷取中…
        </>
      ) : (
        <>📷 {label}</>
      )}
    </button>
  );
}
