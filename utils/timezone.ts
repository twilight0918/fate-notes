/**
 * City → UTC timezone offset mapping.
 * Lookup is case-insensitive and trims whitespace.
 * Fallback: +08:00 (Taiwan / HK / SG timezone)
 */
const CITY_TZ_MAP: Record<string, string> = {
  // Taiwan (+08:00)
  "taipei":           "+08:00",
  "kaohsiung":        "+08:00",
  "taichung":         "+08:00",
  "tainan":           "+08:00",
  "hsinchu":          "+08:00",
  "keelung":          "+08:00",
  // China (+08:00)
  "beijing":          "+08:00",
  "shanghai":         "+08:00",
  "guangzhou":        "+08:00",
  "shenzhen":         "+08:00",
  "chengdu":          "+08:00",
  "hangzhou":         "+08:00",
  "wuhan":            "+08:00",
  "xian":             "+08:00",
  "chongqing":        "+08:00",
  "nanjing":          "+08:00",
  "tianjin":          "+08:00",
  "xi'an":            "+08:00",
  // Hong Kong & Macau (+08:00)
  "hong kong":        "+08:00",
  "hongkong":         "+08:00",
  "hk":               "+08:00",
  "macau":            "+08:00",
  "macao":            "+08:00",
  // Singapore (+08:00)
  "singapore":        "+08:00",
  "sg":               "+08:00",
  // Malaysia (+08:00)
  "kuala lumpur":     "+08:00",
  "kl":               "+08:00",
  "penang":           "+08:00",
  "johor bahru":      "+08:00",
  // Japan (+09:00)
  "tokyo":            "+09:00",
  "osaka":            "+09:00",
  "sapporo":          "+09:00",
  "nagoya":           "+09:00",
  "fukuoka":          "+09:00",
  "kyoto":            "+09:00",
  "yokohama":         "+09:00",
  // Korea (+09:00)
  "seoul":            "+09:00",
  "busan":            "+09:00",
  "incheon":          "+09:00",
  // Thailand (+07:00)
  "bangkok":          "+07:00",
  "chiang mai":       "+07:00",
  "phuket":           "+07:00",
  // Vietnam (+07:00)
  "hanoi":            "+07:00",
  "ho chi minh city": "+07:00",
  "ho chi minh":      "+07:00",
  "hcmc":             "+07:00",
  "saigon":           "+07:00",
  // Philippines (+08:00)
  "manila":           "+08:00",
  "cebu":             "+08:00",
  // Indonesia (+07:00 WIB for Java/Sumatra)
  "jakarta":          "+07:00",
  "bandung":          "+07:00",
  "surabaya":         "+07:00",
  // India (+05:30)
  "mumbai":           "+05:30",
  "delhi":            "+05:30",
  "new delhi":        "+05:30",
  "bangalore":        "+05:30",
  "bengaluru":        "+05:30",
  "kolkata":          "+05:30",
  "chennai":          "+05:30",
  "hyderabad":        "+05:30",
  "pune":             "+05:30",
  "ahmedabad":        "+05:30",
  // USA East (-05:00 EST)
  "new york":         "-05:00",
  "nyc":              "-05:00",
  "boston":           "-05:00",
  "washington":       "-05:00",
  "miami":            "-05:00",
  "atlanta":          "-05:00",
  "chicago":          "-06:00",
  // USA West (-08:00 PST)
  "los angeles":      "-08:00",
  "la":               "-08:00",
  "san francisco":    "-08:00",
  "sf":               "-08:00",
  "seattle":          "-08:00",
  "portland":         "-08:00",
  "las vegas":        "-08:00",
  // USA Mountain (-07:00 MST)
  "denver":           "-07:00",
  "phoenix":          "-07:00",
  // UK (+00:00 GMT)
  "london":           "+00:00",
  // Europe (+01:00 CET)
  "paris":            "+01:00",
  "berlin":           "+01:00",
  "amsterdam":        "+01:00",
  "rome":             "+01:00",
  "madrid":           "+01:00",
  "zurich":           "+01:00",
  "vienna":           "+01:00",
  // Australia (+10:00 AEST)
  "sydney":           "+10:00",
  "melbourne":        "+10:00",
  "brisbane":         "+10:00",
  // Australia (+08:00 AWST)
  "perth":            "+08:00",
  // New Zealand (+12:00 NZST)
  "auckland":         "+12:00",
  "wellington":       "+12:00",
  // UAE (+04:00)
  "dubai":            "+04:00",
  "abu dhabi":        "+04:00",
  // Canada (-05:00 EST / -08:00 PST)
  "toronto":          "-05:00",
  "montreal":         "-05:00",
  "vancouver":        "-08:00",
};

/**
 * Returns the UTC offset string for a given city name.
 * Case-insensitive. Falls back to +08:00 if city not found.
 */
export function getCityTimezoneOffset(city: string): string {
  const key = city.trim().toLowerCase();
  return CITY_TZ_MAP[key] ?? "+08:00";
}

/**
 * Converts iztro timeIndex + date + city into an ISO 8601 datetime string.
 *
 * iztro timeIndex mapping to clock hours (middle of each 2-hour 時辰 block):
 *   0 (子) → 00:00  1 (丑) → 02:00  2 (寅) → 04:00  3 (卯) → 06:00
 *   4 (辰) → 08:00  5 (巳) → 10:00  6 (午) → 12:00  7 (未) → 14:00
 *   8 (申) → 16:00  9 (酉) → 18:00  10 (戌) → 20:00  11 (亥) → 22:00
 *   12 (unknown) → 12:00 (noon default)
 *
 * @example
 * buildISODatetime(1990, 1, 1, 6, "Taipei") → "1990-01-01T12:00:00+08:00"
 */
export function buildISODatetime(
  year: number,
  month: number,
  day: number,
  timeIndex: number,
  city: string
): string {
  const hour = timeIndex === 12 ? 12 : timeIndex * 2;
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const tzOffset = getCityTimezoneOffset(city);
  return `${year}-${mm}-${dd}T${hh}:00:00${tzOffset}`;
}
