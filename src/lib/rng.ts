// Small, fast, deterministic PRNG (mulberry32). Used so the Daily puzzle is
// identical for every player on a given date, and so generation is reproducible.

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash a string (e.g. an ISO date) to a 32-bit seed.
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function randInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}

// The system PRNG wrapped to the Rng type, for non-deterministic modes.
export const systemRng: Rng = Math.random;

// Local date (not UTC) as YYYY-MM-DD, so the daily resets at the player's midnight.
export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
