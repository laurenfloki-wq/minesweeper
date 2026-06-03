import { hashSeed } from '../lib/rng';

export interface Scene {
  id: string;
  name: string;
}

// Cozy scenes that assemble as the board is cleared. Start small; add packs later
// (this list is also the cosmetic IAP surface).
export const SCENES: Scene[] = [
  { id: 'meadow', name: 'Wildflower Meadow' },
  { id: 'windowsill', name: 'Rainy Windowsill' },
  { id: 'campsite', name: 'Campsite at Dusk' },
];

export function sceneById(id: string): Scene {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}

// Deterministic scene for a given date so everyone uncovers the same picture.
export function sceneForDate(dateKey: string): Scene {
  const idx = hashSeed('scene:' + dateKey) % SCENES.length;
  return SCENES[idx];
}

// A scene for non-daily play (varies run to run).
export function randomScene(): Scene {
  return SCENES[Math.floor(Math.random() * SCENES.length)];
}
