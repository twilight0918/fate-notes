export interface ZodiacInfo {
  sign: string;       // ☀️ 太陽星座
  signEn: string;
  dateRange: string;
  element: string;
  traits: string[];
  // Moon & Rising (populated by astro-calc, optional for backward compat)
  moonSign?: string;      // 🌙 月亮星座中文
  moonSignEn?: string;
  risingSign?: string;    // ⬆️ 上升星座中文
  risingSignEn?: string;
}

const ZODIAC_MAP: Array<ZodiacInfo & { startMD: string; endMD: string }> = [
  { sign: "魔羯座", signEn: "Capricorn",  dateRange: "12/22–01/19", element: "土", traits: ["務實", "有抱負", "自律"], startMD: "12-22", endMD: "01-19" },
  { sign: "水瓶座", signEn: "Aquarius",   dateRange: "01/20–02/18", element: "風", traits: ["獨立", "創新", "人道"], startMD: "01-20", endMD: "02-18" },
  { sign: "雙魚座", signEn: "Pisces",     dateRange: "02/19–03/20", element: "水", traits: ["直覺", "藝術", "同理心"], startMD: "02-19", endMD: "03-20" },
  { sign: "牡羊座", signEn: "Aries",      dateRange: "03/21–04/19", element: "火", traits: ["勇敢", "衝勁", "直接"], startMD: "03-21", endMD: "04-19" },
  { sign: "金牛座", signEn: "Taurus",     dateRange: "04/20–05/20", element: "土", traits: ["穩重", "耐心", "享受"], startMD: "04-20", endMD: "05-20" },
  { sign: "雙子座", signEn: "Gemini",     dateRange: "05/21–06/21", element: "風", traits: ["好奇", "靈活", "社交"], startMD: "05-21", endMD: "06-21" },
  { sign: "巨蟹座", signEn: "Cancer",     dateRange: "06/22–07/22", element: "水", traits: ["感性", "保護", "家庭"], startMD: "06-22", endMD: "07-22" },
  { sign: "獅子座", signEn: "Leo",        dateRange: "07/23–08/22", element: "火", traits: ["自信", "慷慨", "領袖"], startMD: "07-23", endMD: "08-22" },
  { sign: "處女座", signEn: "Virgo",      dateRange: "08/23–09/22", element: "土", traits: ["分析", "完美", "服務"], startMD: "08-23", endMD: "09-22" },
  { sign: "天秤座", signEn: "Libra",      dateRange: "09/23–10/23", element: "風", traits: ["公正", "和諧", "優雅"], startMD: "09-23", endMD: "10-23" },
  { sign: "天蠍座", signEn: "Scorpio",    dateRange: "10/24–11/21", element: "水", traits: ["深刻", "執著", "洞察"], startMD: "10-24", endMD: "11-21" },
  { sign: "射手座", signEn: "Sagittarius",dateRange: "11/22–12/21", element: "火", traits: ["自由", "樂觀", "哲學"], startMD: "11-22", endMD: "12-21" },
];

export function getZodiacSign(month: number, day: number): ZodiacInfo {
  const md = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  for (const z of ZODIAC_MAP) {
    const { startMD, endMD } = z;
    // Handle year wrap (Capricorn: 12-22 to 01-19)
    if (startMD > endMD) {
      if (md >= startMD || md <= endMD) return z;
    } else {
      if (md >= startMD && md <= endMD) return z;
    }
  }
  // fallback (should never reach)
  return ZODIAC_MAP[0];
}
