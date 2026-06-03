import type { Board, Cell, Difficulty } from './types';

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

export function createEmptyBoard(d: Difficulty): Board {
  return Array.from({ length: d.rows }, () => Array.from({ length: d.cols }, emptyCell));
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

// Accessor that encodes the rectangular-grid invariant: every caller indexes
// with in-bounds coordinates, so a miss is a programming error, not a runtime
// case to handle. Returns the live Cell object — mutation through it is intended.
function cellAt(board: Board, r: number, c: number): Cell {
  const cell = board[r]?.[c];
  if (cell === undefined) throw new RangeError(`cell out of range: ${r},${c}`);
  return cell;
}

function neighbours(r: number, c: number, rows: number, cols: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc]);
    }
  }
  return out;
}

// Place mines after the first reveal so the first click is always safe and
// (where space allows) opens an area. The clicked cell and its neighbours are
// excluded from mine placement.
export function placeMines(board: Board, d: Difficulty, safeR: number, safeC: number): Board {
  const next = cloneBoard(board);
  const safe = new Set<string>([`${safeR},${safeC}`]);
  for (const [nr, nc] of neighbours(safeR, safeC, d.rows, d.cols)) {
    safe.add(`${nr},${nc}`);
  }

  const candidates: [number, number][] = [];
  for (let r = 0; r < d.rows; r++) {
    for (let c = 0; c < d.cols; c++) {
      if (!safe.has(`${r},${c}`)) candidates.push([r, c]);
    }
  }

  // If the safe zone leaves too few candidates (tiny boards), fall back to
  // excluding only the clicked cell.
  let pool = candidates;
  if (candidates.length < d.mines) {
    pool = [];
    for (let r = 0; r < d.rows; r++) {
      for (let c = 0; c < d.cols; c++) {
        if (!(r === safeR && c === safeC)) pool.push([r, c]);
      }
    }
  }

  // Fisher-Yates shuffle, then take the first `mines`.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const pi = pool[i];
    const pj = pool[j];
    if (pi !== undefined && pj !== undefined) {
      pool[i] = pj;
      pool[j] = pi;
    }
  }
  for (let i = 0; i < d.mines; i++) {
    const rc = pool[i];
    if (rc === undefined) continue;
    cellAt(next, rc[0], rc[1]).isMine = true;
  }

  // Compute adjacency counts.
  for (let r = 0; r < d.rows; r++) {
    for (let c = 0; c < d.cols; c++) {
      const target = cellAt(next, r, c);
      if (target.isMine) continue;
      let count = 0;
      for (const [nr, nc] of neighbours(r, c, d.rows, d.cols)) {
        if (cellAt(next, nr, nc).isMine) count++;
      }
      target.adjacent = count;
    }
  }

  return next;
}

// Reveal a cell. Flood-fills through zero-adjacent regions. Returns the new
// board and whether a mine was hit.
export function reveal(board: Board, r: number, c: number): { board: Board; hitMine: boolean } {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const cell = cellAt(board, r, c);
  if (cell.isRevealed || cell.isFlagged) return { board, hitMine: false };

  const next = cloneBoard(board);

  const start = cellAt(next, r, c);
  if (start.isMine) {
    start.isRevealed = true;
    start.exploded = true;
    return { board: next, hitMine: true };
  }

  const stack: [number, number][] = [[r, c]];
  while (stack.length) {
    const top = stack.pop();
    if (top === undefined) break;
    const [cr, cc] = top;
    const cur = cellAt(next, cr, cc);
    if (cur.isRevealed || cur.isFlagged || cur.isMine) continue;
    cur.isRevealed = true;
    if (cur.adjacent === 0) {
      for (const [nr, nc] of neighbours(cr, cc, rows, cols)) {
        const n = cellAt(next, nr, nc);
        if (!n.isRevealed && !n.isFlagged && !n.isMine) stack.push([nr, nc]);
      }
    }
  }

  return { board: next, hitMine: false };
}

export function toggleFlag(board: Board, r: number, c: number): Board {
  const cell = cellAt(board, r, c);
  if (cell.isRevealed) return board;
  const next = cloneBoard(board);
  const t = cellAt(next, r, c);
  t.isFlagged = !t.isFlagged;
  return next;
}

// Chord: tapping a satisfied revealed number reveals its un-flagged
// neighbours. Returns the new board and whether a mine was hit (wrong flags).
export function chord(board: Board, r: number, c: number): { board: Board; hitMine: boolean } {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const cell = cellAt(board, r, c);
  if (!cell.isRevealed || cell.adjacent === 0) return { board, hitMine: false };

  const ns = neighbours(r, c, rows, cols);
  const flagged = ns.filter(([nr, nc]) => cellAt(board, nr, nc).isFlagged).length;
  if (flagged !== cell.adjacent) return { board, hitMine: false };

  let working = board;
  let hitMine = false;
  for (const [nr, nc] of ns) {
    const n = cellAt(working, nr, nc);
    if (!n.isFlagged && !n.isRevealed) {
      const res = reveal(working, nr, nc);
      working = res.board;
      if (res.hitMine) hitMine = true;
    }
  }
  return { board: working, hitMine };
}

export function hasWon(board: Board, d: Difficulty): boolean {
  let revealed = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.isRevealed && !cell.isMine) revealed++;
    }
  }
  return revealed === d.rows * d.cols - d.mines;
}

// On loss, reveal every mine and mark any incorrect flags.
export function revealAllMines(board: Board): Board {
  const next = cloneBoard(board);
  for (const row of next) {
    for (const cell of row) {
      if (cell.isMine && !cell.isFlagged) cell.isRevealed = true;
      if (!cell.isMine && cell.isFlagged) cell.wrongFlag = true;
    }
  }
  return next;
}

// On win, flag every remaining mine for a tidy finished board.
export function flagAllMines(board: Board): Board {
  const next = cloneBoard(board);
  for (const row of next) {
    for (const cell of row) {
      if (cell.isMine) cell.isFlagged = true;
    }
  }
  return next;
}

export function countFlags(board: Board): number {
  let n = 0;
  for (const row of board) for (const cell of row) if (cell.isFlagged) n++;
  return n;
}
