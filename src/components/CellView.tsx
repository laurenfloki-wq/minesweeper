import { useRef } from 'react';
import type { Cell } from '../game/types';
import { FlagIcon, MineIcon } from './icons';

const NUMBER_COLOURS: Record<number, string> = {
  1: '#7dd3fc',
  2: '#6ee7b7',
  3: '#fca5a5',
  4: '#c4b5fd',
  5: '#fbbf77',
  6: '#5eead4',
  7: '#f0abfc',
  8: '#cbd5e1',
};

interface Props {
  cell: Cell;
  onReveal: () => void;
  onFlag: () => void;
  onChord: () => void;
}

const LONG_PRESS_MS = 380;

export function CellView({ cell, onReveal, onFlag, onChord }: Props) {
  const longTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFired = useRef(false);

  const clearTimer = () => {
    if (longTimer.current) {
      clearTimeout(longTimer.current);
      longTimer.current = null;
    }
  };

  const onPointerDown = () => {
    longFired.current = false;
    if (cell.isRevealed) return;
    longTimer.current = setTimeout(() => {
      longFired.current = true;
      onFlag();
    }, LONG_PRESS_MS);
  };

  const onPointerUp = () => {
    clearTimer();
    if (longFired.current) return;
    if (cell.isRevealed) {
      if (cell.adjacent > 0) onChord();
    } else {
      onReveal();
    }
  };

  const base =
    'aspect-square w-full flex items-center justify-center rounded-[5px] font-mono select-none text-[3.6vw] sm:text-base leading-none';

  if (!cell.isRevealed) {
    return (
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={clearTimer}
        onContextMenu={(e) => e.preventDefault()}
        className={`${base} transition-transform active:scale-95`}
        style={{
          background: 'var(--color-tile)',
          borderBottom: '2px solid var(--color-tile-edge)',
        }}
        aria-label="hidden cell"
      >
        {cell.isFlagged && <FlagIcon size={15} className="text-[#f5a623]" />}
      </button>
    );
  }

  // Revealed.
  if (cell.isMine) {
    return (
      <div
        className={`${base}`}
        style={{
          background: cell.exploded ? '#7f1d1d' : '#1a2238',
          color: cell.exploded ? '#fecaca' : '#64748b',
        }}
      >
        <MineIcon size={15} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={clearTimer}
      onContextMenu={(e) => e.preventDefault()}
      className={`${base} reveal-pop`}
      style={{
        background: cell.wrongFlag ? '#3a1d1d' : 'var(--color-ink-2)',
        color: cell.adjacent ? NUMBER_COLOURS[cell.adjacent] : 'transparent',
        fontWeight: 500,
      }}
    >
      {cell.wrongFlag ? <FlagIcon size={14} className="text-[#ef4444]" /> : cell.adjacent || ''}
    </button>
  );
}
