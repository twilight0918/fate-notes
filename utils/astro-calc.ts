// ─── Astronomical calculations for Moon sign + Rising sign ────────────────────
// Uses circular-natal-horoscope-js (pure JS, no native deps)

import { Origin, Horoscope } from "circular-natal-horoscope-js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AstroInput {
  year: number;
  month: number;   // 1-12
  day: number;      // 1-31
  hour: number;     // 0-23 (clock hour, NOT iztro timeIndex)
  minute: number;   // 0-59
  latitude: number;
  longitude: number;
}

export interface AstroResult {
  moonSign: string;      // English key, e.g. "pisces"
  moonSignCN: string;    // Chinese, e.g. "雙魚座"
  risingSign: string;    // English key, e.g. "virgo"
  risingSignCN: string;  // Chinese, e.g. "處女座"
}

// ─── Sign key → Chinese name mapping ─────────────────────────────────────────

const SIGN_CN: Record<string, string> = {
  aries:       "牡羊座",
  taurus:      "金牛座",
  gemini:      "雙子座",
  cancer:      "巨蟹座",
  leo:         "獅子座",
  virgo:       "處女座",
  libra:       "天秤座",
  scorpio:     "天蠍座",
  sagittarius: "射手座",
  capricorn:   "魔羯座",
  aquarius:    "水瓶座",
  pisces:      "雙魚座",
};

// ─── iztro timeIndex → clock hour conversion ─────────────────────────────────

/**
 * Convert iztro timeIndex (0-11, each = 2 hours) to clock hour.
 * Takes the midpoint of each 時辰:
 *   0 (子時 23:00-01:00) → 0   (midnight)
 *   1 (丑時 01:00-03:00) → 2
 *   6 (午時 11:00-13:00) → 12
 *  12 (未知/unknown)     → 12  (noon default)
 */
export function timeIndexToClockHour(timeIndex: number): number {
  if (timeIndex >= 12 || timeIndex < 0) return 12; // Unknown → noon
  return (timeIndex * 2 + 1) % 24;
}

// ─── Main calculation ────────────────────────────────────────────────────────

export function calculateAstro(input: AstroInput): AstroResult {
  // circular-natal-horoscope-js uses 0-indexed month
  const origin = new Origin({
    year: input.year,
    month: input.month - 1, // Library uses 0-indexed months
    date: input.day,
    hour: input.hour,
    minute: input.minute,
    latitude: input.latitude,
    longitude: input.longitude,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: "whole-sign",
    zodiac: "tropical",
    aspectTypes: [], // We don't need aspects
  });

  // Extract Moon sign from CelestialBodies
  // The library returns celestial bodies as an object with keys like "moon", "sun", etc.
  const celestialBodies = horoscope.CelestialBodies;
  let moonKey = "aries"; // fallback

  if (celestialBodies) {
    // CelestialBodies is typically an object or array; find the moon entry
    if (Array.isArray(celestialBodies)) {
      const moonBody = celestialBodies.find(
        (b: { key?: string; label?: string }) =>
          b.key === "moon" || b.label === "Moon"
      );
      if (moonBody?.Sign?.key) {
        moonKey = moonBody.Sign.key.toLowerCase();
      }
    } else if (celestialBodies.moon?.Sign?.key) {
      moonKey = celestialBodies.moon.Sign.key.toLowerCase();
    } else if (celestialBodies.all) {
      const moonBody = celestialBodies.all.find(
        (b: { key?: string; label?: string }) =>
          b.key === "moon" || b.label === "Moon"
      );
      if (moonBody?.Sign?.key) {
        moonKey = moonBody.Sign.key.toLowerCase();
      }
    }
  }

  // Extract Rising sign (Ascendant)
  const ascendant = horoscope.Ascendant;
  let risingKey = "aries"; // fallback

  if (ascendant?.Sign?.key) {
    risingKey = ascendant.Sign.key.toLowerCase();
  }

  return {
    moonSign: moonKey,
    moonSignCN: SIGN_CN[moonKey] ?? moonKey,
    risingSign: risingKey,
    risingSignCN: SIGN_CN[risingKey] ?? risingKey,
  };
}
