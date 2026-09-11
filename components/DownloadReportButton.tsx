"use client";

import { useState } from "react";
import type { ReportData } from "@/components/report/ReportDocument";

interface Props {
  getData: () => ReportData;
  label?: string;
}

/** 把目前的分析結果存成一個離線可讀的 HTML 檔（不存圖片） */
export default function DownloadReportButton({ getData, label = "下載完整報告" }: Props) {
  const [state, setState] = useState<"idle" | "working" | "error">("idle");

  async function handleDownload() {
    setState("working");
    try {
      // 產生器（含 react-dom/server）只在按下時才載入，不拖慢首頁
      const { buildReportHtml, reportFileName } = await import("@/utils/report-html");
      const data = getData();
      const blob = new Blob([buildReportHtml(data)], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = reportFileName(data);
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState("idle");
    } catch (err) {
      console.error("報告產生失敗:", err);
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {state === "error" && <span className="text-xs text-red-400">產生失敗，請再試一次</span>}
      <button
        onClick={handleDownload}
        disabled={state === "working"}
        className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
      >
        {state === "working" ? (
          <>
            <span className="w-3 h-3 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
            產生中…
          </>
        ) : (
          <>⬇ {label}（HTML）</>
        )}
      </button>
    </div>
  );
}
