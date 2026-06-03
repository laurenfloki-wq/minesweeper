// All persistence is on-device via localStorage, guarded so the app still runs
// where storage is unavailable. No network, no accounts.

import { localDateKey } from './rng';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable; fail quietly
  }
}

// ---- Best times (classic) ----
const BEST_KEY = 'ms.bestTimes.v1';
type BestTimes = Record<string, number>;

export function getBestTime(difficultyId: string): number | null {
  const t = readJSON<BestTimes>(BEST_KEY, {})[difficultyId];
  return typeof t === 'number' ? t : null;
}

export function recordTime(difficultyId: string, seconds: number): boolean {
  const all = readJSON<BestTimes>(BEST_KEY, {});
  const prev = all[difficultyId];
  if (prev === undefined || seconds < prev) {
    all[difficultyId] = seconds;
    writeJSON(BEST_KEY, all);
    return true;
  }
  return false;
}

// ---- Streak + daily completion ----
const STREAK_KEY = 'ms.streak.v1';
interface StreakState {
  current: number;
  best: number;
  lastDate: string | null;
}

export function getStreak(): StreakState {
  return readJSON<StreakState>(STREAK_KEY, { current: 0, best: 0, lastDate: null });
}

function isYesterday(prev: string, today: string): boolean {
  const p = new Date(prev + 'T00:00:00');
  const t = new Date(today + 'T00:00:00');
  return (t.getTime() - p.getTime()) / 86400000 === 1;
}

export function recordDailyComplete(date: string): StreakState {
  const s = getStreak();
  if (s.lastDate === date) return s;
  if (s.lastDate && isYesterday(s.lastDate, date)) s.current += 1;
  else s.current = 1;
  s.best = Math.max(s.best, s.current);
  s.lastDate = date;
  writeJSON(STREAK_KEY, s);
  return s;
}

const DAILY_KEY = 'ms.daily.v1';
interface DailyRecord {
  date: string;
  seconds: number;
  sceneId: string;
}
type DailyMap = Record<string, DailyRecord>;

export function getDailyRecord(date: string): DailyRecord | null {
  return readJSON<DailyMap>(DAILY_KEY, {})[date] ?? null;
}

export function saveDailyRecord(rec: DailyRecord): void {
  const all = readJSON<DailyMap>(DAILY_KEY, {});
  all[rec.date] = rec;
  writeJSON(DAILY_KEY, all);
}

export function isDailyDone(date = localDateKey()): boolean {
  return getDailyRecord(date) !== null;
}

// ---- Gallery (collected scenes) ----
const GALLERY_KEY = 'ms.gallery.v1';
export interface GalleryEntry {
  date: string;
  sceneId: string;
  seconds: number;
}

export function getGallery(): GalleryEntry[] {
  return readJSON<GalleryEntry[]>(GALLERY_KEY, []);
}

export function addToGallery(entry: GalleryEntry): void {
  const all = getGallery();
  if (all.some((e) => e.date === entry.date)) return;
  all.unshift(entry);
  writeJSON(GALLERY_KEY, all);
}

// ---- Endless ----
const ENDLESS_KEY = 'ms.endless.v1';
interface EndlessState {
  bestLevel: number;
}
export function getEndlessBest(): number {
  return readJSON<EndlessState>(ENDLESS_KEY, { bestLevel: 0 }).bestLevel;
}
export function recordEndlessLevel(level: number): boolean {
  const s = readJSON<EndlessState>(ENDLESS_KEY, { bestLevel: 0 });
  if (level > s.bestLevel) {
    writeJSON(ENDLESS_KEY, { bestLevel: level });
    return true;
  }
  return false;
}

// ---- Coins (soft currency, cosmetic only) ----
const COINS_KEY = 'ms.coins.v1';
export function getCoins(): number {
  return readJSON<number>(COINS_KEY, 0);
}
export function addCoins(n: number): number {
  const total = getCoins() + n;
  writeJSON(COINS_KEY, total);
  return total;
}

// ---- Settings ----
const SETTINGS_KEY = 'ms.settings.v1';
export interface Settings {
  noGuess: boolean;
  flagModeDefault: boolean;
  haptics: boolean;
  adsRemoved: boolean;
  ownedThemes: string[];
}
const DEFAULT_SETTINGS: Settings = {
  noGuess: true,
  flagModeDefault: false,
  haptics: true,
  adsRemoved: false,
  ownedThemes: [],
};

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...readJSON<Partial<Settings>>(SETTINGS_KEY, {}) };
}
export function saveSettings(s: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...s };
  writeJSON(SETTINGS_KEY, next);
  return next;
}
