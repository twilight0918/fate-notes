/**
 * Human Design 門-中心映射表
 *
 * 64 個 Gate 分佈在 9 個 Center 上，這是確定性知識（不需 API）。
 * 36 條 Channel 連接兩個中心的兩個門。
 */

// ─── Gate → Center 映射 ─────────────────────────────────────────────────────

export const GATE_TO_CENTER: Record<number, string> = {
  // Head (3 gates)
  64: "Head", 61: "Head", 63: "Head",
  // Ajna (6 gates)
  47: "Ajna", 24: "Ajna", 4: "Ajna", 17: "Ajna", 43: "Ajna", 11: "Ajna",
  // Throat (11 gates)
  62: "Throat", 23: "Throat", 56: "Throat", 35: "Throat", 12: "Throat",
  45: "Throat", 33: "Throat", 8: "Throat", 31: "Throat", 20: "Throat", 16: "Throat",
  // G Center (8 gates)
  7: "G", 1: "G", 13: "G", 25: "G", 46: "G", 2: "G", 15: "G", 10: "G",
  // Heart / Ego (4 gates)
  21: "Heart", 51: "Heart", 26: "Heart", 40: "Heart",
  // Sacral (9 gates)
  5: "Sacral", 14: "Sacral", 29: "Sacral", 59: "Sacral",
  9: "Sacral", 3: "Sacral", 42: "Sacral", 27: "Sacral", 34: "Sacral",
  // Solar Plexus (7 gates)
  36: "Solar Plexus", 22: "Solar Plexus", 37: "Solar Plexus", 6: "Solar Plexus",
  49: "Solar Plexus", 55: "Solar Plexus", 30: "Solar Plexus",
  // Spleen (7 gates)
  48: "Spleen", 57: "Spleen", 44: "Spleen", 50: "Spleen",
  32: "Spleen", 28: "Spleen", 18: "Spleen",
  // Root (9 gates)
  58: "Root", 38: "Root", 54: "Root", 53: "Root",
  60: "Root", 52: "Root", 19: "Root", 39: "Root", 41: "Root",
};

// ─── Center → Gates（反向映射）───────────────────────────────────────────────

export const CENTER_GATES: Record<string, number[]> = {
  Head:           [64, 61, 63],
  Ajna:           [47, 24, 4, 17, 43, 11],
  Throat:         [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  G:              [7, 1, 13, 25, 46, 2, 15, 10],
  Heart:          [21, 51, 26, 40],
  Sacral:         [5, 14, 29, 59, 9, 3, 42, 27, 34],
  "Solar Plexus": [36, 22, 37, 6, 49, 55, 30],
  Spleen:         [48, 57, 44, 50, 32, 28, 18],
  Root:           [58, 38, 54, 53, 60, 52, 19, 39, 41],
};

// ─── 36 Channels（canonical list, [gateA, gateB]）────────────────────────────

export const CHANNELS: [number, number][] = [
  // Head ↔ Ajna (3)
  [64, 47],   // Abstraction
  [61, 24],   // Awareness
  [63, 4],    // Logic
  // Ajna ↔ Throat (3)
  [17, 62],   // Acceptance
  [43, 23],   // Structuring
  [11, 56],   // Curiosity
  // Throat ↔ G (4)
  [31, 7],    // The Alpha
  [8, 1],     // Inspiration
  [33, 13],   // The Prodigal
  // Throat ↔ Heart (1)
  [45, 21],   // Money
  // Throat ↔ Sacral (1)
  [20, 34],   // Charisma
  // Throat ↔ Solar Plexus (2)
  [12, 22],   // Openness
  [35, 36],   // Transitoriness
  // Throat ↔ Spleen (2)
  [16, 48],   // The Wavelength
  [20, 57],   // The Brainwave
  // G ↔ Heart (1)
  [25, 51],   // Initiation
  // G ↔ Sacral (3)
  [15, 5],    // Rhythm
  [46, 29],   // Discovery
  [2, 14],    // The Beat
  // G ↔ Throat (1 additional)
  [10, 20],   // Awakening
  // G ↔ Sacral (1 additional)
  [10, 34],   // Exploration
  // G ↔ Spleen (1)
  [10, 57],   // Perfected Form
  // Heart ↔ Solar Plexus (1)
  [40, 37],   // Community
  // Heart ↔ Spleen (1)
  [26, 44],   // Surrender
  // Sacral ↔ Spleen (1)
  [27, 50],   // Preservation
  // Sacral ↔ Spleen (1 additional)
  [34, 57],   // Power
  // Sacral ↔ Solar Plexus (1)
  [59, 6],    // Intimacy
  // Sacral ↔ Root (3)
  [3, 60],    // Mutation
  [42, 53],   // Maturation
  [9, 52],    // Concentration
  // Solar Plexus ↔ Root (3)
  [49, 19],   // Synthesis
  [55, 39],   // Emoting
  [30, 41],   // Recognition
  // Spleen ↔ Root (3)
  [32, 54],   // Transformation
  [28, 38],   // Struggle
  [18, 58],   // Judgment
];

// ─── Helper functions ────────────────────────────────────────────────────────

/** Parse channel string "1-8" → [1, 8] */
export function parseChannel(ch: string): [number, number] | null {
  const parts = ch.split("-").map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return null;
}

/** Given a user's active gates, compute which gates belong to each center. */
export function gatesByCenter(activeGates: number[]): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  for (const [center, gates] of Object.entries(CENTER_GATES)) {
    const active = gates.filter((g) => activeGates.includes(g));
    if (active.length > 0) {
      result[center] = active;
    }
  }
  return result;
}

/** Check if a channel is active (both gates present in the user's gate list). */
export function isChannelActive(
  channel: [number, number],
  activeGates: number[],
): boolean {
  return activeGates.includes(channel[0]) && activeGates.includes(channel[1]);
}
