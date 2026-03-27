import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// ─── Types ──────────────────────────────────────────────────────────────────

export type Provider = "gemini" | "openai" | "anthropic";
export type ModelTier = "fast" | "standard" | "deep";

// ─── Model Map (verified 2026-03) ───────────────────────────────────────────

const MODEL_MAP: Record<Provider, Record<ModelTier, string>> = {
  gemini: {
    fast: "gemini-2.5-flash",
    standard: "gemini-3-flash-preview",
    deep: "gemini-3.1-pro-preview",
  },
  openai: {
    fast: "gpt-4.1-mini",
    standard: "gpt-4.1",
    deep: "o4-mini",
  },
  anthropic: {
    fast: "claude-haiku-4-5-20251001",
    standard: "claude-sonnet-4-6",
    deep: "claude-opus-4-6",
  },
};

export function getModelId(provider: Provider, tier: ModelTier): string {
  return MODEL_MAP[provider][tier];
}

// ─── Provider display info ──────────────────────────────────────────────────

export const PROVIDER_OPTIONS: { value: Provider; label: string }[] = [
  { value: "gemini", label: "Google Gemini" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic Claude" },
];

export const TIER_OPTIONS: { value: ModelTier; label: string }[] = [
  { value: "fast", label: "快速分析" },
  { value: "standard", label: "標準分析" },
  { value: "deep", label: "深入分析" },
];

// Human-readable model name for display
export function getModelDisplayName(provider: Provider, tier: ModelTier): string {
  return MODEL_MAP[provider][tier];
}

// ─── Unified generation ─────────────────────────────────────────────────────

export async function generateContent(
  provider: Provider,
  apiKey: string,
  tier: ModelTier,
  prompt: string,
): Promise<string> {
  const model = getModelId(provider, tier);

  switch (provider) {
    case "gemini":
      return generateGemini(apiKey, model, prompt);
    case "openai":
      return generateOpenAI(apiKey, model, prompt);
    case "anthropic":
      return generateAnthropic(apiKey, model, prompt);
    default:
      throw new Error(`不支援的供應商: ${provider}`);
  }
}

// ─── Gemini ─────────────────────────────────────────────────────────────────

async function generateGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  const text = (response.text ?? "").trim();
  if (!text) throw new Error("AI 回傳空結果");
  return text;
}

// ─── OpenAI ─────────────────────────────────────────────────────────────────

async function generateOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  const text = response.choices[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("AI 回傳空結果");
  return text;
}

// ─── Anthropic ──────────────────────────────────────────────────────────────

async function generateAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  const text = block.type === "text" ? block.text.trim() : "";
  if (!text) throw new Error("AI 回傳空結果");
  return text;
}
