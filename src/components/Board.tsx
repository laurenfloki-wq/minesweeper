import type { Board as BoardType } from '../game/types';
import { CellView } from './CellView';

interface Props {
  board: BoardType;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
  onChord: (r: number, c: number) => void;
}

export function Board({ board, onReveal, onFlag, onChord }: Props) {
  const cols = board[0]?.length ?? 0;
  return (
    <div
      className="grid w-full gap-[3px] mx-auto touch-none"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => (
          <CellView
            key={`${r}-${c}`}
            cell={cell}
            onReveal={() => onReveal(r, c)}
            onFlag={() => onFlag(r, c)}
            onChord={() => onChord(r, c)}
          />
        )),
      )}
    </div>
  );
}
