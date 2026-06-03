// Bundled into the standalone HTML demo so it runs the REAL verified solver,
// generator and engine (not a reimplementation). Exposed on window.MS.
import { generateNoGuess } from '../src/game/generator';
import { difficultyById, DIFFICULTIES } from '../src/game/difficulties';
import {
  reveal,
  toggleFlag,
  chord,
  hasWon,
  revealAllMines,
  flagAllMines,
  countFlags,
} from '../src/game/engine';
import { findDeductions, type SolveGrid } from '../src/game/solver';
import type { Board, Difficulty } from '../src/game/types';

function gridFrom(board: Board, d: Difficulty): SolveGrid {
  const N = d.rows * d.cols;
  const mine = new Uint8Array(N);
  const adj = new Int8Array(N);
  for (let r = 0; r < d.rows; r++)
    for (let c = 0; c < d.cols; c++) {
      const i = r * d.cols + c;
      mine[i] = board[r][c].isMine ? 1 : 0;
      adj[i] = board[r][c].adjacent;
    }
  return { rows: d.rows, cols: d.cols, mines: d.mines, mine, adj };
}

function fade(p: number, at: number, span = 0.12): number {
  if (p >= at) return 1;
  const start = at - span;
  if (p <= start) return 0;
  return (p - start) / span;
}

// Vanilla port of the Meadow scene for the demo.
function meadowSVG(p: number): string {
  const flowers = [40, 92, 150, 210, 268]
    .map((x, i) => {
      const col = ['#f06a8a', '#f6b73c', '#c98bd6', '#ef7d63', '#f4d04a'][i];
      const o = fade(p, 0.6 + i * 0.06);
      const y = 168 - (i % 2) * 6;
      return `<g opacity="${o}" transform="translate(${x},${y})"><line x1="0" y1="0" x2="0" y2="16" stroke="#3f6f2e" stroke-width="2"/><circle cx="0" cy="-2" r="5" fill="${col}"/><circle cx="0" cy="-2" r="2" fill="#fff7e0"/></g>`;
    })
    .join('');
  return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block">
    <rect x="0" y="0" width="320" height="200" fill="#bfe3ef"/>
    <rect x="0" y="0" width="320" height="120" fill="#d7eef4" opacity="${fade(p, 0.05)}"/>
    <circle cx="262" cy="48" r="26" fill="#f7c873" opacity="${fade(p, 0.2)}"/>
    <ellipse cx="70" cy="46" rx="34" ry="14" fill="#fff" opacity="${fade(p, 0.45) * 0.9}"/>
    <ellipse cx="98" cy="40" rx="26" ry="12" fill="#fff" opacity="${fade(p, 0.55) * 0.9}"/>
    <path d="M0 140 Q80 118 160 134 T320 128 V200 H0 Z" fill="#8fc06a" opacity="${fade(p, 0.15)}"/>
    <path d="M0 162 Q90 146 180 160 T320 156 V200 H0 Z" fill="#6fa84f" opacity="${fade(p, 0.3)}"/>
    <rect x="0" y="180" width="320" height="20" fill="#5b9142" opacity="${fade(p, 0.3)}"/>
    ${flowers}
  </svg>`;
}

export {
  generateNoGuess,
  difficultyById,
  DIFFICULTIES,
  reveal,
  toggleFlag,
  chord,
  hasWon,
  revealAllMines,
  flagAllMines,
  countFlags,
  findDeductions,
  gridFrom,
  meadowSVG,
};
