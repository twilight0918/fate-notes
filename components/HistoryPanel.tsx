"use client";

import { useState } from "react";
import type { HistoryRecord } from "@/utils/history";

interface Props {
  records: HistoryRecord[];
  onLoad: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

/** Format ISO date to a readable string */
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Build a short summary line from the record */
function buildSummary(record: HistoryRecord): string {
  const parts: string[] = [];

  // Sun sign
  if (record.results.zodiac?.sign) {
    parts.push(record.results.zodiac.sign);
  }

  // Human Design type
  if (record.results.humanDesign?.type) {
    const TYPE_CN: Record<string, string> = {
      Generator: "生產者",
      "Manifesting Generator": "顯示生產者",
      Projector: "投射者",
      Manifestor: "顯示者",
      Reflector: "反映者",
    };
    parts.push(TYPE_CN[record.results.humanDesign.type] ?? record.results.humanDesign.type);
  }

  // MBTI (added in Feature 3, may not exist in older records)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bd = record.birthData as any;
  if (bd.mbti) {
    parts.push(bd.mbti as string);
  }

  // Bazi day master
  if (record.results.baziAnalysis?.dayMaster) {
    parts.push(record.results.baziAnalysis.dayMaster);
  }

  return parts.join(" · ") || "未完成分析";
}

export default function HistoryPanel({ records, onLoad, onDelete, onClearAll }: Props) {
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (records.length === 0) return null;

  return (
    <div className="bg-card border border-line rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted">📋 歷史紀錄</h3>
        {confirmClearAll ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-fire">確定清除全部？</span>
            <button
              onClick={() => { onClearAll(); setConfirmClearAll(false); }}
              className="text-xs text-fire hover:text-fire/80 px-2 py-0.5 border border-fire/40 rounded"
            >
              確定
            </button>
            <button
              onClick={() => setConfirmClearAll(false)}
              className="text-xs text-muted hover:text-ink px-2 py-0.5 border border-line rounded"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClearAll(true)}
            className="text-xs text-muted/70 hover:text-ink transition-colors"
          >
            清除全部
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-center gap-3 bg-paper border border-line hover:bg-accent-soft rounded-lg px-3 py-2.5 cursor-pointer transition-colors group"
            onClick={() => onLoad(record)}
          >
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-ink font-medium truncate">
                  {record.birthData.name?.trim() || "未命名"}
                </span>
                <span className="text-[10px] text-muted/70 flex-shrink-0">
                  {formatDate(record.createdAt)}
                </span>
              </div>
              <p className="text-xs text-muted truncate mt-0.5">
                {buildSummary(record)}
              </p>
            </div>

            {/* Delete button */}
            {confirmDeleteId === record.id ? (
              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { onDelete(record.id); setConfirmDeleteId(null); }}
                  className="text-[10px] text-fire hover:text-fire/80 px-1.5 py-0.5 border border-fire/40 rounded"
                >
                  刪除
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-[10px] text-muted hover:text-ink px-1.5 py-0.5 border border-line rounded"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(record.id); }}
                className="text-muted hover:text-fire opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 p-1"
                title="刪除此紀錄"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
