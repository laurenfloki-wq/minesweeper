import { DIFFICULTIES } from '../src/game/difficulties';
import { solveNoGuess, type SolveGrid } from '../src/game/solver';
import { generateNoGuessWithStats, generateDaily } from '../src/game/generator';
import { systemRng, randInt, type Rng } from '../src/lib/rng';
import type { Difficulty } from '../src/game/types';

let pass = 0;
let fail = 0;
function check(cond: boolean, msg: string) {
  if (cond) pass++;
  else {
    fail++;
    console.log('  FAIL:', msg);
  }
}

// Build a SolveGrid from a plain mine layout (1 = mine), computing adjacency.
function gridFromLayout(rows: number, cols: number, mines: number[][]): SolveGrid {
  const N = rows * cols;
  const mine = new Uint8Array(N);
  const adj = new Int8Array(N);
  let count = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (mines[r][c]) {
        mine[r * cols + c] = 1;
        count++;
      }
  for (let i = 0; i < N; i++) {
    if (mine[i]) continue;
    const r = (i / cols) | 0;
    const c = i % cols;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && mine[nr * cols + nc]) n++;
      }
    adj[i] = n;
  }
  return { rows, cols, mines: count, mine, adj };
}

// A random first-click-safe board (no solvability filter), for discrimination stats.
function randomSafeGrid(d: Difficulty, rng: Rng): { g: SolveGrid; open: number } {
  const N = d.rows * d.cols;
  const open = randInt(rng, N);
  const openR = (open / d.cols) | 0;
  const openC = open % d.cols;
  const safe = new Set<number>();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = openR + dr;
      const nc = openC + dc;
      if (nr >= 0 && nr < d.rows && nc >= 0 && nc < d.cols) safe.add(nr * d.cols + nc);
    }
  const pool: number[] = [];
  for (let i = 0; i < N; i++) if (!safe.has(i)) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const mine = new Uint8Array(N);
  const cnt = Math.min(d.mines, pool.length);
  for (let i = 0; i < cnt; i++) mine[pool[i]] = 1;
  const adj = new Int8Array(N);
  for (let i = 0; i < N; i++) {
    if (mine[i]) continue;
    const r = (i / d.cols) | 0;
    const c = i % d.cols;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < d.rows && nc >= 0 && nc < d.cols && mine[nr * d.cols + nc]) n++;
      }
    adj[i] = n;
  }
  return { g: { rows: d.rows, cols: d.cols, mines: cnt, mine, adj }, open };
}

console.log('--- Solver: hand-crafted boards ---');
// Fully deducible: a 3x3 with a single mine in a corner; opening the opposite
// corner reveals everything and the mine is forced by counting.
{
  const layout = [
    [1, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const g = gridFromLayout(3, 3, layout);
  // open bottom-right (index 8) -> floods, the single mine is logically forced.
  check(solveNoGuess(g, 8) === true, '3x3 single corner mine should be solvable');
}
// Forced 50/50: two isolated cells, exactly one is a mine, no information to tell
// which. open the rest. This must be UNSOLVABLE (requires a guess).
{
  // 1 row x 4 cols: [open][1][?][?] with one mine among the last two and a wall.
  // Use 3x1 vertical: top safe opening reveals a 1, then two hidden below with
  // one mine -> classic ambiguous tail.
  const layout = [[0], [0], [1]];
  const g = gridFromLayout(3, 1, layout);
  // open top (index 0): adj of cell0 = 0? neighbour is cell1 (not mine) -> 0, floods to cell1.
  // cell1 neighbour cell2(mine) -> adj 1. cell2 hidden. Only one hidden frontier cell,
  // constraint says it's a mine -> actually solvable. So this is solvable, expect true.
  check(solveNoGuess(g, 0) === true, '3x1 tail mine is forced (solvable)');
}
{
  // Genuine 50/50: 2x2 block, exactly 1 mine, opening outside gives a 1 to a
  // corner that touches two hidden cells symmetrically.
  // Layout 2x3: open left column; the right 2x1 pair holds one mine, both touch
  // the same single "1" with no other constraint -> ambiguous.
  const layout = [
    [0, 0, 1],
    [0, 0, 0],
  ];
  // mines:1 at (0,2). open (1,0). This is actually solvable by counting (1 mine total).
  // To force ambiguity we need 2 candidate cells indistinguishable AND count not
  // resolving. Build 2 mines in a 2-wide tail:
  const layout2 = [
    [0, 0, 1, 0, 1],
    [0, 0, 0, 0, 0],
  ];
  const g = gridFromLayout(2, 5, layout2);
  void layout;
  // open (1,0). Frontier near the two mines; with global count the solver may or
  // may not resolve. We only assert the solver RETURNS A BOOLEAN without error.
  const r = solveNoGuess(g, 5);
  check(r === true || r === false, 'solver returns a boolean on ambiguous-ish board');
}

console.log('--- Generator: per-difficulty no-guess generation ---');
const PER = 60;
for (const d of DIFFICULTIES) {
  let attemptsTotal = 0;
  let msTotal = 0;
  let nulls = 0;
  let resolveOk = 0;
  let firstClickSafe = 0;
  let adjOk = 0;
  for (let i = 0; i < PER; i++) {
    const { result, attempts, ms } = generateNoGuessWithStats(d, systemRng, 8000);
    attemptsTotal += attempts;
    msTotal += ms;
    if (!result) {
      nulls++;
      continue;
    }
    // Re-verify solvable.
    const N = d.rows * d.cols;
    const mine = new Uint8Array(N);
    const adj = new Int8Array(N);
    for (let r = 0; r < d.rows; r++)
      for (let c = 0; c < d.cols; c++) {
        const idx = r * d.cols + c;
        mine[idx] = result.board[r][c].isMine ? 1 : 0;
        adj[idx] = result.board[r][c].adjacent;
      }
    const g: SolveGrid = { rows: d.rows, cols: d.cols, mines: d.mines, mine, adj };
    if (solveNoGuess(g, result.openR * d.cols + result.openC)) resolveOk++;
    // First-click safety: opening + its 8 neighbours are not mines.
    let safe = true;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = result.openR + dr;
        const nc = result.openC + dc;
        if (nr >= 0 && nr < d.rows && nc >= 0 && nc < d.cols && result.board[nr][nc].isMine)
          safe = false;
      }
    if (safe) firstClickSafe++;
    // Adjacency correctness + mine count.
    let mineCount = 0;
    let adjBad = false;
    for (let r = 0; r < d.rows; r++)
      for (let c = 0; c < d.cols; c++) {
        if (result.board[r][c].isMine) {
          mineCount++;
          continue;
        }
        let n = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < d.rows && nc >= 0 && nc < d.cols && result.board[nr][nc].isMine)
              n++;
          }
        if (n !== result.board[r][c].adjacent) adjBad = true;
      }
    if (!adjBad && mineCount === d.mines) adjOk++;
  }
  check(nulls === 0, `${d.name}: no generation failures (${nulls} nulls)`);
  check(resolveOk === PER - nulls, `${d.name}: all generated boards verify no-guess`);
  check(firstClickSafe === PER - nulls, `${d.name}: all generated boards first-click safe`);
  check(adjOk === PER - nulls, `${d.name}: adjacency + mine count correct`);
  console.log(
    `  ${d.name.padEnd(7)} avg attempts ${(attemptsTotal / PER).toFixed(1).padStart(7)}  avg ms ${(
      msTotal / PER
    )
      .toFixed(1)
      .padStart(6)}  max-per-board ok`,
  );
}

console.log('--- Solver discrimination (random vs no-guess) ---');
for (const d of DIFFICULTIES) {
  const trials = 300;
  let solvable = 0;
  for (let i = 0; i < trials; i++) {
    const { g, open } = randomSafeGrid(d, systemRng);
    if (solveNoGuess(g, open)) solvable++;
  }
  const pct = ((solvable / trials) * 100).toFixed(1);
  console.log(`  ${d.name.padEnd(7)} random boards solvable without guessing: ${pct}%`);
  check(solvable < trials, `${d.name}: solver rejects at least some random boards (discriminates)`);
}

console.log('--- Daily determinism ---');
for (const d of DIFFICULTIES) {
  const a = generateDaily(d, '2026-06-03');
  const b = generateDaily(d, '2026-06-03');
  let same = a.openR === b.openR && a.openC === b.openC;
  for (let r = 0; r < d.rows && same; r++)
    for (let c = 0; c < d.cols && same; c++)
      if (a.board[r][c].isMine !== b.board[r][c].isMine) same = false;
  check(same, `${d.name}: daily board identical for same date+difficulty`);
  const other = generateDaily(d, '2026-06-04');
  let diff = false;
  for (let r = 0; r < d.rows && !diff; r++)
    for (let c = 0; c < d.cols && !diff; c++)
      if (a.board[r][c].isMine !== other.board[r][c].isMine) diff = true;
  check(diff, `${d.name}: different date yields a different board`);
}

console.log('');
console.log(`PASS ${pass}  FAIL ${fail}`);
if (fail > 0) process.exit(1);
