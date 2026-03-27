import { astro } from "iztro";

export interface BirthInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: "male" | "female";
}

export interface PalaceData {
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  majorStars: string[];
  minorStars: string[];
  isBodyPalace: boolean;
  isSoulPalace: boolean;
}

export interface ZiweiResult {
  solarDate: string;
  lunarDate: string;
  chineseDate: string;
  fiveElementsClass: string;
  soul: string;
  body: string;
  earthlyBranchOfSoulPalace: string;
  earthlyBranchOfBodyPalace: string;
  palaces: PalaceData[];
}

// ─── Yearly Fortune (流年) ────────────────────────────────────────────────────

export interface YearlyFortune {
  year: number;
  heavenlyStem: string;
  earthlyBranch: string;
  mutagen: string[];       // 四化 [祿, 權, 科, 忌] — star names
  palaceNames: string[];   // 流年 12 宮位名稱順序
  keyPalaces: {
    name: string;          // 宮位名稱 (e.g. "命宮")
    majorStars: string[];
    heavenlyStem: string;
    earthlyBranch: string;
  }[];
}

const KEY_PALACE_NAMES = ["命宮", "財帛", "官祿", "夫妻", "遷移", "福德"] as const;

export function getYearlyFortune(input: BirthInput, targetYear?: number): YearlyFortune {
  const year = targetYear ?? new Date().getFullYear();
  const dateStr = `${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")}`;

  const astrolabe = astro.bySolar(
    dateStr,
    input.hour,
    input.gender === "male" ? "男" : "女",
    false,
    "zh-TW"
  );

  const horoscope = astrolabe.horoscope(`${year}-1-1`);
  const yearly = horoscope.yearly;

  // Extract key palaces with details
  const keyPalaces = KEY_PALACE_NAMES.map((pName) => {
    const p = horoscope.palace(pName, "yearly");
    return {
      name: pName,
      majorStars: p ? p.majorStars.map((s) => String(s.name)) : [],
      heavenlyStem: p ? String(p.heavenlyStem) : "",
      earthlyBranch: p ? String(p.earthlyBranch) : "",
    };
  });

  return {
    year,
    heavenlyStem: String(yearly.heavenlyStem),
    earthlyBranch: String(yearly.earthlyBranch),
    mutagen: yearly.mutagen.map((s) => String(s)),
    palaceNames: yearly.palaceNames.map((n) => String(n)),
    keyPalaces,
  };
}

// ─── Ziwei Chart ──────────────────────────────────────────────────────────────

export function getZiweiChart(input: BirthInput): ZiweiResult {
  const dateStr = `${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")}`;

  const astrolabe = astro.bySolar(
    dateStr,
    input.hour,
    input.gender === "male" ? "男" : "女",
    false,
    "zh-TW"
  );

  const soulBranch = String(astrolabe.earthlyBranchOfSoulPalace);
  const bodyBranch = String(astrolabe.earthlyBranchOfBodyPalace);

  const palaces: PalaceData[] = astrolabe.palaces.map((p) => ({
    name: String(p.name),
    heavenlyStem: String(p.heavenlyStem),
    earthlyBranch: String(p.earthlyBranch),
    majorStars: p.majorStars.map((s) => String(s.name)),
    minorStars: p.minorStars.map((s) => String(s.name)),
    isBodyPalace: p.isBodyPalace,
    isSoulPalace: String(p.earthlyBranch) === soulBranch,
  }));

  return {
    solarDate: astrolabe.solarDate,
    lunarDate: astrolabe.lunarDate,
    chineseDate: astrolabe.chineseDate,
    fiveElementsClass: String(astrolabe.fiveElementsClass),
    soul: String(astrolabe.soul),
    body: String(astrolabe.body),
    earthlyBranchOfSoulPalace: soulBranch,
    earthlyBranchOfBodyPalace: bodyBranch,
    palaces,
  };
}
