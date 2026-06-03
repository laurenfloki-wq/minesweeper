// No-guess solver.
//
// Given a fully-known board (mine layout + adjacency) and a guaranteed-safe
// opening cell, this simulates a perfect logical player and reports whether the
// board can be cleared with ZERO guessing. It is the acceptance test the
// generator uses: only boards this returns `true` for are ever shown.
//
// Inference layers, applied to a fixpoint:
//   1. Trivial   - a number with N unknown neighbours and N remaining mines
//                  => all mines; with 0 remaining mines => all safe.
//   2. Subset    - if one number's unknown set is a subset of another's, the
//                  difference yields a derived constraint (handles 1-2-1 etc.).
//   3. Component - enumerate every satisfying mine layout of each connected
//                  frontier component; a cell mined in all/none is forced.
//   4. Global    - combine component mine-sums against the remaining mine total
//                  and the off-frontier cells (handles endgame counting).
//
// Cells: index = r * cols + c.  state: 0 hidden, 1 revealed, 2 known-mine.

export interface SolveGrid {
  rows: number;
  cols: number;
  mines: number;
  mine: Uint8Array; // 1 if cell is a mine
  adj: Int8Array; // adjacent mine count (valid for non-mines)
}

const COMPONENT_CAP = 22; // max unknowns enumerated per component (2^22 worst case is rare)

function neighbourIdx(i: number, rows: number, cols: number): number[] {
  const r = (i / cols) | 0;
  const c = i % cols;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(nr * cols + nc);
    }
  }
  return out;
}

function buildNeighbours(rows: number, cols: number): number[][] {
  const N = rows * cols;
  const nbrs: number[][] = new Array(N);
  for (let i = 0; i < N; i++) nbrs[i] = neighbourIdx(i, rows, cols);
  return nbrs;
}

// Given the current known state (0 hidden, 1 revealed, 2 known-mine), return all
// cells that can be PROVEN safe or PROVEN mines by logic alone. Used both by the
// solvability check and by the in-game Scout hint.
export function findDeductions(
  g: SolveGrid,
  state: Uint8Array,
  nbrs: number[][] = buildNeighbours(g.rows, g.cols),
): { safe: number[]; mine: number[] } {
  const N = g.rows * g.cols;
  const cVars: number[][] = [];
  const cNeed: number[] = [];
  for (let i = 0; i < N; i++) {
    if (state[i] !== 1 || g.adj[i] === 0) continue;
    let need = g.adj[i];
    const vars: number[] = [];
    for (const n of nbrs[i]) {
      if (state[n] === 2) need--;
      else if (state[n] === 0) vars.push(n);
    }
    if (vars.length > 0) {
      cVars.push(vars);
      cNeed.push(need);
    }
  }
  if (cVars.length === 0) return { safe: [], mine: [] };

  const safe = new Set<number>();
  const mine = new Set<number>();

  // 1. Trivial.
  for (let k = 0; k < cVars.length; k++) {
    if (cNeed[k] === 0) for (const v of cVars[k]) safe.add(v);
    else if (cNeed[k] === cVars[k].length) for (const v of cVars[k]) mine.add(v);
  }

  // 2. Subset.
  if (safe.size === 0 && mine.size === 0) {
    const sets = cVars.map((v) => new Set(v));
    for (let a = 0; a < cVars.length; a++) {
      for (let b = 0; b < cVars.length; b++) {
        if (a === b) continue;
        if (cVars[a].length >= cVars[b].length) continue;
        let subset = true;
        for (const v of cVars[a]) {
          if (!sets[b].has(v)) {
            subset = false;
            break;
          }
        }
        if (!subset) continue;
        const diff = cVars[b].filter((v) => !sets[a].has(v));
        const need = cNeed[b] - cNeed[a];
        if (need === 0) for (const v of diff) safe.add(v);
        else if (need === diff.length) for (const v of diff) mine.add(v);
      }
    }
  }

  // 3 + 4. Component enumeration + global mine count.
  if (safe.size === 0 && mine.size === 0) {
    const res = enumerateDeduce(g, state, cVars, cNeed);
    for (const v of res.safe) safe.add(v);
    for (const v of res.mine) mine.add(v);
  }

  return { safe: [...safe], mine: [...mine] };
}

export function solveNoGuess(g: SolveGrid, open: number): boolean {
  const { rows, cols } = g;
  const N = rows * cols;
  const state = new Uint8Array(N); // 0 hidden, 1 revealed, 2 known-mine
  const nbrs = buildNeighbours(rows, cols);

  const revealFlood = (start: number) => {
    if (state[start] !== 0) return;
    const stack = [start];
    while (stack.length) {
      const i = stack.pop()!;
      if (state[i] === 1) continue;
      state[i] = 1;
      if (g.adj[i] === 0) {
        for (const n of nbrs[i]) if (state[n] === 0) stack.push(n);
      }
    }
  };

  revealFlood(open);

  let progress = true;
  while (progress) {
    progress = false;
    const { safe, mine } = findDeductions(g, state, nbrs);
    for (const v of mine) {
      if (state[v] === 0) {
        state[v] = 2;
        progress = true;
      }
    }
    for (const v of safe) {
      if (state[v] === 0) {
        revealFlood(v);
        progress = true;
      }
    }
  }

  for (let i = 0; i < N; i++) {
    if (g.mine[i] === 0 && state[i] !== 1) return false;
  }
  return true;
}

function enumerateDeduce(
  g: SolveGrid,
  state: Uint8Array,
  cVars: number[][],
  cNeed: number[],
): { safe: number[]; mine: number[] } {
  const N = g.rows * g.cols;

  // Frontier = union of all constraint variables.
  const frontier = new Set<number>();
  for (const vars of cVars) for (const v of vars) frontier.add(v);

  // Build var adjacency through shared constraints to find components.
  const varList = [...frontier];
  const varIndex = new Map<number, number>();
  varList.forEach((v, i) => varIndex.set(v, i));
  const adjList: Set<number>[] = varList.map(() => new Set<number>());
  for (const vars of cVars) {
    for (let i = 0; i < vars.length; i++) {
      for (let j = i + 1; j < vars.length; j++) {
        const a = varIndex.get(vars[i])!;
        const b = varIndex.get(vars[j])!;
        adjList[a].add(b);
        adjList[b].add(a);
      }
    }
  }

  // Connected components of variables.
  const comp = new Int32Array(varList.length).fill(-1);
  const components: number[][] = [];
  for (let i = 0; i < varList.length; i++) {
    if (comp[i] !== -1) continue;
    const id = components.length;
    const queue = [i];
    comp[i] = id;
    const members: number[] = [];
    while (queue.length) {
      const x = queue.pop()!;
      members.push(x);
      for (const y of adjList[x]) if (comp[y] === -1) {
        comp[y] = id;
        queue.push(y);
      }
    }
    components.push(members);
  }

  // Known mines so far + off-frontier hidden cells, for the global count.
  let knownMines = 0;
  let hiddenTotal = 0;
  for (let i = 0; i < N; i++) {
    if (state[i] === 2) knownMines++;
    else if (state[i] === 0) hiddenTotal++;
  }
  const remainingMines = g.mines - knownMines;
  const offFrontier = hiddenTotal - frontier.size;

  // Per component: enumerate solutions, record per-var mine count per total-sum,
  // and the set of achievable sums.
  interface CompData {
    members: number[]; // var indices (into varList)
    solutions: Uint8Array[]; // each: bit per member
    sums: number[]; // mine sum per solution
  }
  const compData: CompData[] = [];

  for (const members of components) {
    if (members.length > COMPONENT_CAP) {
      // Too large to enumerate; contribute nothing (handled by other layers).
      compData.push({ members, solutions: [], sums: [] });
      continue;
    }
    const memberCells = members.map((m) => varList[m]);
    const cellPos = new Map<number, number>();
    memberCells.forEach((cell, i) => cellPos.set(cell, i));

    // Constraints fully inside this component.
    const localC: { idx: number[]; need: number }[] = [];
    for (let k = 0; k < cVars.length; k++) {
      if (cellPos.has(cVars[k][0])) {
        localC.push({ idx: cVars[k].map((v) => cellPos.get(v)!), need: cNeed[k] });
      }
    }

    const n = members.length;
    const solutions: Uint8Array[] = [];
    const sums: number[] = [];
    const total = 1 << n;
    for (let mask = 0; mask < total; mask++) {
      let ok = true;
      for (const con of localC) {
        let s = 0;
        for (const p of con.idx) s += (mask >> p) & 1;
        if (s !== con.need) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      const bits = new Uint8Array(n);
      let sum = 0;
      for (let p = 0; p < n; p++) {
        bits[p] = (mask >> p) & 1;
        sum += bits[p];
      }
      // Respect the global cap: a component can't hold more mines than remain.
      if (sum > remainingMines) continue;
      solutions.push(bits);
      sums.push(sum);
    }
    compData.push({ members, solutions, sums });
  }

  // Combined achievable sums across all components (subset-sum), so we can test
  // global feasibility of each component solution against the remaining count.
  let combined = new Set<number>([0]);
  for (const cd of compData) {
    if (cd.solutions.length === 0) continue; // unenumerated component: skip from global
    const uniqueSums = new Set(cd.sums);
    const next = new Set<number>();
    for (const base of combined) for (const s of uniqueSums) next.add(base + s);
    combined = next;
  }

  // Sums achievable by all components EXCEPT a given one.
  const sumsExcept = (excl: number): Set<number> => {
    let acc = new Set<number>([0]);
    for (let ci = 0; ci < compData.length; ci++) {
      if (ci === excl) continue;
      const cd = compData[ci];
      if (cd.solutions.length === 0) continue;
      const uniqueSums = new Set(cd.sums);
      const next = new Set<number>();
      for (const base of acc) for (const s of uniqueSums) next.add(base + s);
      acc = next;
    }
    return acc;
  };

  const safe: number[] = [];
  const mine: number[] = [];

  // A component solution with sum m is globally feasible if there is a way for
  // the other components (sum t) plus off-frontier cells (0..offFrontier) to
  // reach the remaining mine total: exists t with t <= remainingMines - m <= t + offFrontier.
  for (let ci = 0; ci < compData.length; ci++) {
    const cd = compData[ci];
    if (cd.solutions.length === 0) continue;
    const others = sumsExcept(ci);
    const feasibleSol: Uint8Array[] = [];
    for (let si = 0; si < cd.solutions.length; si++) {
      const m = cd.sums[si];
      let feasible = false;
      for (const t of others) {
        const rem = remainingMines - m - t;
        if (rem >= 0 && rem <= offFrontier) {
          feasible = true;
          break;
        }
      }
      if (feasible) feasibleSol.push(cd.solutions[si]);
    }
    if (feasibleSol.length === 0) continue;
    for (let p = 0; p < cd.members.length; p++) {
      let all1 = true;
      let all0 = true;
      for (const sol of feasibleSol) {
        if (sol[p] === 1) all0 = false;
        else all1 = false;
      }
      const cell = varList[cd.members[p]];
      if (all0) safe.push(cell);
      else if (all1) mine.push(cell);
    }
  }

  // Off-frontier deduction: feasible off-counts given combined component sums.
  if (offFrontier > 0) {
    let minOff = Infinity;
    let maxOff = -Infinity;
    for (const s of combined) {
      const off = remainingMines - s;
      if (off >= 0 && off <= offFrontier) {
        if (off < minOff) minOff = off;
        if (off > maxOff) maxOff = off;
      }
    }
    if (maxOff === 0) {
      for (let i = 0; i < N; i++) if (state[i] === 0 && !frontier.has(i)) safe.push(i);
    } else if (minOff === offFrontier) {
      for (let i = 0; i < N; i++) if (state[i] === 0 && !frontier.has(i)) mine.push(i);
    }
  }

  return { safe, mine };
}
