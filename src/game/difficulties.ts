import type { Difficulty } from './types';

// Widths kept modest so the board stays legible in portrait on a phone.
// Density (mines / cells): Easy ~12%, Medium ~17%, Hard ~20%.
export const DIFFICULTIES: Difficulty[] = [
  { id: 'easy', name: 'Easy', cols: 9, rows: 9, mines: 10 },
  { id: 'medium', name: 'Medium', cols: 12, rows: 14, mines: 28 },
  { id: 'hard', name: 'Hard', cols: 13, rows: 18, mines: 48 },
];

export const DEFAULT_DIFFICULTY = DIFFICULTIES[0];

export function difficultyById(id: string): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id) ?? DEFAULT_DIFFICULTY;
}
