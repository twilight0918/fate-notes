import { NextRequest, NextResponse } from "next/server";

// humandesignhub.app API
// Docs: https://humandesignhub.app/docs
// Free tier: 100 credits/month, simple-bodygraph = 0.5 credits
// Full bodygraph (1 cr) returns 403 on free tier — not available
// Apply for key: https://humandesignhub.app/en/developer

export interface HumanDesignRequest {
  datetime: string; // ISO 8601 with timezone e.g. "1990-01-01T12:00:00+08:00"
  city: string;     // e.g. "Taipei", "Hong Kong", "Shanghai"
}

export interface HumanDesignResult {
  type: string;        // e.g. "Generator", "Projector", "Manifestor", "Reflector", "Manifesting Generator"
  strategy: string;    // e.g. "To Respond"
  authority: string;   // e.g. "Sacral Authority"
  profile: string;     // e.g. "1/3"
  notSelf: string;     // not-self theme
  signature: string;   // signature / when aligned
  centers: {
    name: string;
    defined: boolean;
  }[];
  gates: number[];
  channels: string[];  // e.g. ["1-8", "3-60"]
}

const HD_API_BASE = "https://api.humandesignhub.app/v1";
// simple-bodygraph = 0.5 credits (free tier only endpoint available).
// Strategy / NotSelf / Signature are derived locally from Type (deterministic HD rules).
// Authority is derived locally from defined centers.
const HD_ENDPOINT = `${HD_API_BASE}/simple-bodygraph`;

// 9 standard Human Design centers (in body order)
const CENTER_NAMES = [
  "Head", "Ajna", "Throat", "G", "Heart",
  "Sacral", "Solar Plexus", "Spleen", "Root",
];

/**
 * Normalize the centers field from various API formats:
 *
 * Format A (simple-bodygraph): array of defined center names as strings
 *   e.g. ["Ajna","G","Sacral","Spleen","Throat"]
 *   → only lists DEFINED centers; we reconstruct all 9 with defined flag
 *
 * Format B (full bodygraph): array of {name, defined} objects
 *   e.g. [{name:"Head", defined:false}, ...]
 *
 * Format C: object map {head: true, sacral: false, ...}
 */
function normalizeCenters(raw: unknown): { name: string; defined: boolean }[] {
  if (!Array.isArray(raw) && (!raw || typeof raw !== "object")) return [];

  if (Array.isArray(raw)) {
    // Format A: string array of defined center names
    if (raw.length === 0 || typeof raw[0] === "string") {
      const definedSet = new Set((raw as string[]).map((s) => s.toLowerCase()));
      return CENTER_NAMES.map((name) => ({
        name,
        defined: definedSet.has(name.toLowerCase()),
      }));
    }
    // Format B: array of {name, defined} objects
    return (raw as { name: string; defined: boolean }[]).map((c) => ({
      name: c.name,
      defined: Boolean(c.defined),
    }));
  }

  // Format C: plain object
  const obj = raw as Record<string, boolean>;
  return CENTER_NAMES.map((name) => ({
    name,
    defined: Boolean(
      obj[name.toLowerCase()] ??
      obj[name.toLowerCase().replace(" ", "_")] ??
      obj[name.toLowerCase().replace(" ", "")] ??
      false
    ),
  }));
}

// ─── Local derivation tables (deterministic Human Design rules) ────────────

const TYPE_STRATEGY: Record<string, string> = {
  "Generator":             "等待回應（Wait to Respond）",
  "Manifesting Generator": "等待回應（Wait to Respond）",
  "Projector":             "等待邀請（Wait for Invitation）",
  "Manifestor":            "告知（To Inform）",
  "Reflector":             "等待月亮周期（Wait a Lunar Cycle）",
};

const TYPE_NOT_SELF: Record<string, string> = {
  "Generator":             "挫折（Frustration）",
  "Manifesting Generator": "挫折與憤怒（Frustration & Anger）",
  "Projector":             "苦澀（Bitterness）",
  "Manifestor":            "憤怒（Anger）",
  "Reflector":             "失望（Disappointment）",
};

const TYPE_SIGNATURE: Record<string, string> = {
  "Generator":             "滿足（Satisfaction）",
  "Manifesting Generator": "滿足與平靜（Satisfaction & Peace）",
  "Projector":             "成功（Success）",
  "Manifestor":            "平靜（Peace）",
  "Reflector":             "驚喜（Surprise）",
};

/**
 * Derive inner authority from defined centers.
 * Authority priority (HD standard): Solar Plexus > Sacral > Spleen > Heart > G > Mental > Lunar
 */
function deriveAuthority(definedCenters: string[]): string {
  const d = new Set(definedCenters.map((c) => c.toLowerCase()));
  if (d.has("solar plexus")) return "情緒型（Emotional Authority）";
  if (d.has("sacral"))       return "薦骨型（Sacral Authority）";
  if (d.has("spleen"))       return "脾臟型（Splenic Authority）";
  if (d.has("heart"))        return "意志力型（Ego / Heart Authority）";
  if (d.has("g"))            return "自我投射型（Self-Projected Authority）";
  if (d.has("ajna") || d.has("head") || d.has("throat"))
                             return "外在型（Mental / Outer Authority）";
  return "月亮型（Lunar Authority）";
}

// ───────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const apiKey = process.env.HUMAN_DESIGN_API_KEY;

  if (!apiKey) {
    console.error("[human-design] HUMAN_DESIGN_API_KEY 未設定");
    return NextResponse.json(
      { error: "人類圖服務暫時無法使用，請稍後再試" },
      { status: 503 }
    );
  }

  const body: HumanDesignRequest = await req.json();

  const hdRes = await fetch(HD_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ datetime: body.datetime }),
  });

  if (!hdRes.ok) {
    const errText = await hdRes.text();
    console.error(`[human-design] API error ${hdRes.status}:`, errText);
    return NextResponse.json(
      { error: "人類圖分析暫時失敗，請稍後再試" },
      { status: hdRes.status }
    );
  }

  const raw = await hdRes.json();

  console.log("[human-design] raw response:", JSON.stringify(raw).slice(0, 600));

  const hdType: string = raw.type ?? raw.human_design_type ?? "";
  const centers = normalizeCenters(raw.centers ?? raw.energy_centers ?? null);
  const definedCenterNames = centers.filter((c) => c.defined).map((c) => c.name);

  const result: HumanDesignResult = {
    type: hdType,
    strategy: raw.strategy ?? TYPE_STRATEGY[hdType] ?? "",
    authority: raw.authority ?? raw.inner_authority ?? deriveAuthority(definedCenterNames),
    profile: raw.profile ?? "",
    notSelf: raw.not_self_theme ?? raw.not_self ?? raw.notSelf ?? TYPE_NOT_SELF[hdType] ?? "",
    signature: raw.signature ?? raw.signature_theme ?? raw.life_theme ?? TYPE_SIGNATURE[hdType] ?? "",
    centers,
    gates: (raw.gates ?? []).map((g: string | number) => Number(g)),
    channels: raw.channels ?? raw.channels_short ?? [],
  };

  return NextResponse.json(result);
}
