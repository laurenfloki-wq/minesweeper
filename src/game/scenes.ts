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

// The catalogue is a non-empty constant; an explicitly-typed first scene gives
// the accessors below a guaranteed Scene fallback under noUncheckedIndexedAccess
// (a module-level guard would not narrow into these function bodies).
const FIRST_SCENE: Scene = SCENES[0] ?? { id: 'meadow', name: 'Wildflower Meadow' };

export function sceneById(id: string): Scene {
  return SCENES.find((s) => s.id === id) ?? FIRST_SCENE;
}

// Deterministic scene for a given date so everyone uncovers the same picture.
export function sceneForDate(dateKey: string): Scene {
  const idx = hashSeed('scene:' + dateKey) % SCENES.length;
  return SCENES[idx] ?? FIRST_SCENE;
}

// A scene for non-daily play (varies run to run).
export function randomScene(): Scene {
  return SCENES[Math.floor(Math.random() * SCENES.length)] ?? FIRST_SCENE;
}

// Scene at a wrapped index (e.g. Endless level cycling). Handles negatives.
export function sceneForIndex(i: number): Scene {
  const idx = ((i % SCENES.length) + SCENES.length) % SCENES.length;
  return SCENES[idx] ?? FIRST_SCENE;
}
