import type { Board, Cell, Difficulty } from './types';
import { solveNoGuess, type SolveGrid } from './solver';
import { hashSeed, mulberry32, randInt, systemRng, type Rng } from '../lib/rng';

export interface GeneratedBoard {
  board: Board;
  openR: number;
  openC: number;
}

function emptyCell(): Cell {
  return {
    isMine: false,
    isRevealed: false,
    isFlagged: false,
    adjacent: 0,
    exploded: false,
    wrongFlag: false,
  };
}

// Place mines on a flat grid, keeping the 3x3 around the opening mine-free so the
// opening always floods. Returns the SolveGrid (typed arrays).
function placeMinesFlat(d: Difficulty, open: number, rng: Rng): SolveGrid {
  const { rows, cols, mines } = d;
  const N = rows * cols;
  const mine = new Uint8Array(N);
  const adj = new Int8Array(N);

  const openR = (open / cols) | 0;
  const openC = open % cols;
  const safe = new Set<number>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = openR + dr;
      const nc = openC + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) safe.add(nr * cols + nc);
    }
  }

  const pool: number[] = [];
  for (let i = 0; i < N; i++) if (!safe.has(i)) pool.push(i);
  // Fisher-Yates with the supplied rng.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    const pi = pool[i];
    const pj = pool[j];
    if (pi !== undefined && pj !== undefined) {
      pool[i] = pj;
      pool[j] = pi;
    }
  }
  const count = Math.min(mines, pool.length);
  for (let i = 0; i < count; i++) {
    const p = pool[i];
    if (p !== undefined) mine[p] = 1;
  }

  for (let i = 0; i < N; i++) {
    if (mine[i]) continue;
    const r = (i / cols) | 0;
    const c = i % cols;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && mine[nr * cols + nc]) n++;
      }
    }
    adj[i] = n;
  }

  return { rows, cols, mines: count, mine, adj };
}

function gridToBoard(g: SolveGrid): Board {
  const board: Board = [];
  for (let r = 0; r < g.rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < g.cols; c++) {
      const i = r * g.cols + c;
      const cell = emptyCell();
      cell.isMine = g.mine[i] === 1;
      cell.adjacent = g.adj[i] ?? 0;
      row.push(cell);
    }
    board.push(row);
  }
  return board;
}

// Generate a board guaranteed solvable with no guessing. Returns null if the
// attempt budget is exhausted (caller may retry or fall back).
export function generateNoGuess(
  d: Difficulty,
  rng: Rng = systemRng,
  maxAttempts = 4000,
): GeneratedBoard | null {
  const N = d.rows * d.cols;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const open = randInt(rng, N);
    const g = placeMinesFlat(d, open, rng);
    if (solveNoGuess(g, open)) {
      return { board: gridToBoard(g), openR: (open / d.cols) | 0, openC: open % d.cols };
    }
  }
  return null;
}

// Deterministic daily board: same date + difficulty => identical board for
// every player. Seeded so generation is reproducible. Falls back to a plain
// first-click-safe board only in the (practically impossible) case the budget
// is exhausted, so a daily always exists.
export function generateDaily(d: Difficulty, dateKey: string): GeneratedBoard {
  const rng = mulberry32(hashSeed(`${dateKey}:${d.id}`));
  const result = generateNoGuess(d, rng, 20000);
  if (result) return result;
  const open = randInt(rng, d.rows * d.cols);
  const g = placeMinesFlat(d, open, rng);
  return { board: gridToBoard(g), openR: (open / d.cols) | 0, openC: open % d.cols };
}

// Diagnostics for tests/tuning: how many attempts and how long generation takes.
export function generateNoGuessWithStats(
  d: Difficulty,
  rng: Rng = systemRng,
  maxAttempts = 4000,
): { result: GeneratedBoard | null; attempts: number; ms: number } {
  const N = d.rows * d.cols;
  const t0 = Date.now();
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const open = randInt(rng, N);
    const g = placeMinesFlat(d, open, rng);
    if (solveNoGuess(g, open)) {
      return {
        result: { board: gridToBoard(g), openR: (open / d.cols) | 0, openC: open % d.cols },
        attempts: attempt,
        ms: Date.now() - t0,
      };
    }
  }
  return { result: null, attempts: maxAttempts, ms: Date.now() - t0 };
}
