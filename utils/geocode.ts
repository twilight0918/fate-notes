// ─── Nominatim (OpenStreetMap) Geocoding ──────────────────────────────────────
// Free, no API key required. Low-volume personal use only.
// Usage policy: https://operations.osmfoundation.org/policies/nominatim/

export interface GeoCoords {
  lat: number;
  lon: number;
}

// In-memory cache for the session (avoids re-fetching same city)
const cache = new Map<string, GeoCoords>();

/**
 * Convert a city name to latitude/longitude using Nominatim.
 * Returns cached result if available.
 */
export async function geocodeCity(city: string): Promise<GeoCoords> {
  const key = city.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city)}`;

  const res = await fetch(url, {
    headers: {
      // Nominatim requires a User-Agent identifying the app
      "User-Agent": "fate-map/1.0 (personal tool)",
    },
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`找不到城市：${city}`);
  }

  const coords: GeoCoords = {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
  };

  cache.set(key, coords);
  return coords;
}
