import { FlagIcon } from './icons';

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface Props {
  minesLeft: number;
  time: number;
  flagMode: boolean;
  onToggleFlagMode: () => void;
}

export function Hud({ minesLeft, time, flagMode, onToggleFlagMode }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div
        className="flex items-center gap-1.5 font-mono text-lg tabular-nums"
        style={{ color: '#e7ecf5' }}
      >
        <FlagIcon size={15} className="text-[#f5a623]" />
        {String(Math.max(0, minesLeft)).padStart(2, '0')}
      </div>
      <div className="font-mono text-lg tabular-nums" style={{ color: '#e7ecf5' }}>
        {fmt(time)}
      </div>
      <button
        type="button"
        onClick={onToggleFlagMode}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors"
        style={{
          background: flagMode ? '#f5a623' : 'var(--color-tile)',
          color: flagMode ? '#3a2606' : '#8593ad',
        }}
        aria-pressed={flagMode}
      >
        <FlagIcon size={14} />
        flag
      </button>
    </div>
  );
}
