import type { BirthFormData } from "@/components/BirthForm";
import type { ZiweiResult, YearlyFortune } from "@/utils/iztro-helpers";
import type { ZodiacInfo } from "@/utils/zodiac";
import type { BaziAnalysis } from "@/app/api/analyze/route";
import type { HumanDesignResult } from "@/app/api/human-design/route";
import type { CrossAnalysis } from "@/app/api/cross-analysis/route";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HistoryRecord {
  id: string;
  createdAt: string; // ISO date
  birthData: BirthFormData;
  results: {
    ziwei: ZiweiResult;
    zodiac: ZodiacInfo;
    yearlyFortune: YearlyFortune;
    baziAnalysis?: BaziAnalysis;
    humanDesign?: HumanDesignResult;
    crossAnalysis?: CrossAnalysis;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "fate-map-history";
const MAX_RECORDS = 50;

// ─── CRUD ────────────────────────────────────────────────────────────────────

export function getHistory(): HistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryRecord[];
  } catch {
    return [];
  }
}

export function saveRecord(record: HistoryRecord): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();
    // Prepend new record, cap at MAX
    const updated = [record, ...history].slice(0, MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save history record:", e);
  }
}

export function deleteRecord(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();
    const updated = history.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete history record:", e);
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear history:", e);
  }
}
