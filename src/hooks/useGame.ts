import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Board, Difficulty } from '../game/types';
import type { GeneratedBoard } from '../game/generator';
import {
  createEmptyBoard,
  placeMines,
  reveal as revealEngine,
  toggleFlag as toggleFlagEngine,
  chord as chordEngine,
  hasWon,
  revealAllMines,
  flagAllMines,
  countFlags,
} from '../game/engine';
import { findDeductions, type SolveGrid } from '../game/solver';
import { boardSource } from '../game/boardSource';
import { impact, notifyWin, notifyLoss } from '../lib/haptics';

export type Status = 'loading' | 'ready' | 'playing' | 'won' | 'lost';
export type Source =
  | { kind: 'preset'; board: GeneratedBoard }
  | { kind: 'noguess' }
  | { kind: 'random' };

interface Opts {
  difficulty: Difficulty;
  source: Source;
  flagModeDefault?: boolean;
  hapticsOn?: boolean;
  onWin?: (seconds: number) => void;
  onLoss?: () => void;
}

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

export function useGame(opts: Opts) {
  const { difficulty, hapticsOn = true } = opts;
  const [board, setBoard] = useState<Board>(() => createEmptyBoard(difficulty));
  const [status, setStatus] = useState<Status>('loading');
  const [time, setTime] = useState(0);
  const [flagMode, setFlagMode] = useState(opts.flagModeDefault ?? false);
  const [stabiliseUsed, setStabiliseUsed] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(0);
  const preLossRef = useRef<{ board: Board; r: number; c: number } | null>(null);
  const onWinRef = useRef(opts.onWin);
  const onLossRef = useRef(opts.onLoss);
  onWinRef.current = opts.onWin;
  onLossRef.current = opts.onLoss;

  const buzz = useCallback(
    (s: 'Light' | 'Medium' | 'Heavy') => {
      if (hapticsOn) void impact(s);
    },
    [hapticsOn],
  );

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
  }, []);
  useEffect(() => () => stopTimer(), [stopTimer]);

  const setup = useCallback(
    (src: Source) => {
      stopTimer();
      setTime(0);
      timeRef.current = 0;
      setStabiliseUsed(0);
      preLossRef.current = null;
      if (src.kind === 'random') {
        setBoard(createEmptyBoard(difficulty));
        setStatus('ready');
        return;
      }
      if (src.kind === 'preset') {
        const opened = revealEngine(src.board.board, src.board.openR, src.board.openC).board;
        setBoard(opened);
        setStatus('ready');
        return;
      }
      // noguess: fetch asynchronously
      setStatus('loading');
      void boardSource.getNoGuess(difficulty).then((gb) => {
        const opened = revealEngine(gb.board, gb.openR, gb.openC).board;
        setBoard(opened);
        setStatus('ready');
      });
    },
    [difficulty, stopTimer],
  );

  // Initialise on mount and whenever the source identity changes.
  const sourceKey =
    opts.source.kind === 'preset'
      ? `preset:${opts.source.board.openR},${opts.source.board.openC}:${difficulty.id}`
      : `${opts.source.kind}:${difficulty.id}`;
  useEffect(() => {
    setup(opts.source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  const newGame = useCallback(
    (override?: Source) => setup(override ?? opts.source),
    [setup, opts.source],
  );

  const finishWin = useCallback(
    (won: Board) => {
      stopTimer();
      setBoard(flagAllMines(won));
      setStatus('won');
      if (hapticsOn) void notifyWin();
      onWinRef.current?.(timeRef.current);
    },
    [stopTimer, hapticsOn],
  );

  const finishLoss = useCallback(
    (working: Board, r: number, c: number) => {
      stopTimer();
      preLossRef.current = { board: working, r, c };
      const lost = revealEngine(working, r, c).board;
      setBoard(revealAllMines(lost));
      setStatus('lost');
      if (hapticsOn) void notifyLoss();
      onLossRef.current?.();
    },
    [stopTimer, hapticsOn],
  );

  const beginIfNeeded = useCallback(() => {
    if (status === 'ready') {
      setStatus('playing');
      startTimer();
    }
  }, [status, startTimer]);

  const reveal = useCallback(
    (r: number, c: number) => {
      if (status === 'loading' || status === 'won' || status === 'lost') return;
      if (flagMode && !board[r][c].isRevealed) {
        beginIfNeeded();
        buzz('Medium');
        setBoard((b) => toggleFlagEngine(b, r, c));
        return;
      }
      let working = board;
      if (status === 'ready' && opts.source.kind === 'random') {
        working = placeMines(working, difficulty, r, c);
      }
      beginIfNeeded();
      const res = revealEngine(working, r, c);
      if (res.hitMine) {
        finishLoss(working, r, c);
        return;
      }
      if (hasWon(res.board, difficulty)) {
        finishWin(res.board);
        return;
      }
      buzz('Light');
      setBoard(res.board);
    },
    [board, difficulty, status, flagMode, opts.source.kind, beginIfNeeded, buzz, finishLoss, finishWin],
  );

  const toggleFlag = useCallback(
    (r: number, c: number) => {
      if (status !== 'playing' && status !== 'ready') return;
      if (board[r][c].isRevealed) return;
      beginIfNeeded();
      buzz('Medium');
      setBoard((b) => toggleFlagEngine(b, r, c));
    },
    [status, board, beginIfNeeded, buzz],
  );

  const chord = useCallback(
    (r: number, c: number) => {
      if (status !== 'playing') return;
      const res = chordEngine(board, r, c);
      if (res.board === board) return;
      if (res.hitMine) {
        finishLoss(board, r, c);
        return;
      }
      if (hasWon(res.board, difficulty)) {
        finishWin(res.board);
        return;
      }
      buzz('Light');
      setBoard(res.board);
    },
    [board, difficulty, status, buzz, finishLoss, finishWin],
  );

  // Reveal one provably-safe hidden cell (rewarded "Scout"). Falls back to any
  // hidden non-mine cell if logic can't prove one (e.g. random boards).
  const scout = useCallback(() => {
    if (status !== 'playing' && status !== 'ready') return;
    const g = gridFrom(board, difficulty);
    const state = new Uint8Array(difficulty.rows * difficulty.cols);
    for (let r = 0; r < difficulty.rows; r++)
      for (let c = 0; c < difficulty.cols; c++) {
        const i = r * difficulty.cols + c;
        if (board[r][c].isRevealed) state[i] = 1;
        else if (board[r][c].isFlagged) state[i] = 2;
      }
    let target = -1;
    const { safe } = findDeductions(g, state);
    for (const idx of safe) {
      if (state[idx] === 0) {
        target = idx;
        break;
      }
    }
    if (target === -1) {
      for (let i = 0; i < g.mine.length; i++)
        if (g.mine[i] === 0 && state[i] === 0) {
          target = i;
          break;
        }
    }
    if (target === -1) return;
    beginIfNeeded();
    const tr = (target / difficulty.cols) | 0;
    const tc = target % difficulty.cols;
    const res = revealEngine(board, tr, tc);
    buzz('Light');
    if (hasWon(res.board, difficulty)) finishWin(res.board);
    else setBoard(res.board);
  }, [board, difficulty, status, beginIfNeeded, buzz, finishWin]);

  // Undo the fatal move and flag that mine (rewarded "Stabilise").
  const stabilise = useCallback(() => {
    const snap = preLossRef.current;
    if (status !== 'lost' || !snap) return;
    const restored = toggleFlagEngine(snap.board, snap.r, snap.c);
    setBoard(restored);
    setStatus('playing');
    setStabiliseUsed((n) => n + 1);
    startTimer();
  }, [status, startTimer]);

  const minesLeft = useMemo(() => difficulty.mines - countFlags(board), [difficulty.mines, board]);
  const totalSafe = difficulty.rows * difficulty.cols - difficulty.mines;
  const progress = useMemo(() => {
    let revealed = 0;
    for (const row of board) for (const cell of row) if (cell.isRevealed && !cell.isMine) revealed++;
    return Math.min(1, revealed / totalSafe);
  }, [board, totalSafe]);

  return {
    board,
    status,
    time,
    minesLeft,
    progress,
    flagMode,
    setFlagMode,
    stabiliseUsed,
    canStabilise: status === 'lost' && preLossRef.current !== null,
    reveal,
    toggleFlag,
    chord,
    scout,
    stabilise,
    newGame,
  };
}
