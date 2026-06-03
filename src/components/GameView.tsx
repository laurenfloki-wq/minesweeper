import { useState } from 'react';
import type { Difficulty } from '../game/types';
import { useGame, type Source } from '../hooks/useGame';
import { Board } from './Board';
import { Hud } from './Hud';
import { SceneView } from './SceneView';
import { BackIcon, EyeIcon, HeartShieldIcon, ResetIcon } from './icons';
import { getSettings } from '../lib/storage';
import { showRewarded } from '../lib/ads';

interface Props {
  difficulty: Difficulty;
  source: Source;
  sceneId: string;
  modeLabel: string;
  mode?: 'daily' | 'classic' | 'endless';
  onWin: (seconds: number) => void;
  onExit: () => void;
  allowStabilise?: boolean;
  rightSlot?: React.ReactNode;
}

export function GameView({
  difficulty,
  source,
  sceneId,
  modeLabel,
  mode = 'classic',
  onWin,
  onExit,
  allowStabilise = true,
  rightSlot,
}: Props) {
  const settings = getSettings();
  const g = useGame({
    difficulty,
    source,
    flagModeDefault: settings.flagModeDefault,
    hapticsOn: settings.haptics,
    onWin,
  });
  const [busy, setBusy] = useState(false);

  const doScout = async () => {
    if (busy || (g.status !== 'playing' && g.status !== 'ready')) return;
    setBusy(true);
    const ok = await showRewarded('scout');
    if (ok) g.scout();
    setBusy(false);
  };

  const doStabilise = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await showRewarded('stabilise');
    if (ok) g.stabilise();
    setBusy(false);
  };

  return (
    <div className="flex h-full flex-col px-4 pt-3 pb-4 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={onExit} className="text-[#8593ad] -ml-1" aria-label="back">
          <BackIcon size={24} />
        </button>
        <span className="text-sm text-[#8593ad]">{modeLabel}</span>
        <div className="min-w-[36px] text-right">{rightSlot}</div>
      </div>

      <div
        className="rounded-2xl overflow-hidden mb-3 border border-[#21304d]"
        style={{ height: 92 }}
      >
        <SceneView sceneId={sceneId} progress={g.progress} className="w-full h-full block" />
      </div>

      <div className="mb-3">
        <Hud
          minesLeft={g.minesLeft}
          time={g.time}
          flagMode={g.flagMode}
          onToggleFlagMode={() => g.setFlagMode(!g.flagMode)}
        />
      </div>

      <div className="flex-1 flex items-start justify-center">
        {g.status === 'loading' ? (
          <div className="flex h-40 items-center justify-center text-sm text-[#5d6b86]">
            Preparing a solvable board…
          </div>
        ) : (
          <Board board={g.board} onReveal={g.reveal} onFlag={g.toggleFlag} onChord={g.chord} />
        )}
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={doScout}
          disabled={busy || (g.status !== 'playing' && g.status !== 'ready')}
          className="w-full rounded-xl border border-[#21304d] bg-[#131c30] py-3 flex items-center justify-center gap-2 text-[#7dd3fc] disabled:opacity-40"
        >
          <EyeIcon size={18} />
          <span className="text-sm">Scout a safe cell</span>
          <span className="rounded bg-[#0e1626] px-1.5 py-0.5 text-[10px] font-mono text-[#6ee7b7]">
            watch
          </span>
        </button>
      </div>

      {g.status === 'lost' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#020617]/80 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-[#21304d] bg-[#131c30] p-6 text-center fade-up">
            <div className="text-xl font-display font-bold mb-1">Destabilised</div>
            <p className="text-sm text-[#8593ad] mb-5">
              You uncovered a mine. Stabilise to flag it and keep going, or start fresh.
            </p>
            {allowStabilise && g.canStabilise && (
              <button
                type="button"
                onClick={doStabilise}
                disabled={busy}
                className="w-full rounded-xl bg-[#f5a623] py-3 mb-2 flex items-center justify-center gap-2 font-medium text-[#3a2606] disabled:opacity-50"
              >
                <HeartShieldIcon size={18} />
                Stabilise and continue
                <span className="rounded bg-[#3a2606]/20 px-1.5 py-0.5 text-[10px] font-mono">
                  watch
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => g.newGame()}
              className="w-full rounded-xl border border-[#21304d] py-3 mb-2 flex items-center justify-center gap-2 text-[#e7ecf5]"
              hidden={mode === 'endless'}
            >
              <ResetIcon size={18} />
              New board
            </button>
            <button type="button" onClick={onExit} className="w-full py-2 text-sm text-[#8593ad]">
              {mode === 'endless' ? 'End run' : 'Back to menu'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
