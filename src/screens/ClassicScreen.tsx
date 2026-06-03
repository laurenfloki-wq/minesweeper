import { useState } from 'react';
import { GameView } from '../components/GameView';
import { WinCard } from '../components/WinCard';
import { DIFFICULTIES, difficultyById } from '../game/difficulties';
import { randomScene } from '../game/scenes';
import { getBestTime, recordTime, getSettings, saveSettings } from '../lib/storage';
import { fmtTime } from '../lib/share';
import { BackIcon } from '../components/icons';

export function ClassicScreen({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<'select' | 'play' | 'win'>('select');
  const [diffId, setDiffId] = useState('easy');
  const [noGuess, setNoGuess] = useState(getSettings().noGuess);
  const [scene, setScene] = useState(randomScene().id);
  const [seconds, setSeconds] = useState(0);
  const [record, setRecord] = useState(false);

  const difficulty = difficultyById(diffId);

  const start = (id: string) => {
    setDiffId(id);
    setScene(randomScene().id);
    setPhase('play');
  };

  const onWin = (secs: number) => {
    setSeconds(secs);
    setRecord(recordTime(difficulty.id, secs));
    setPhase('win');
  };

  if (phase === 'win') {
    const best = getBestTime(difficulty.id);
    return (
      <WinCard
        sceneId={scene}
        title="Solved"
        seconds={seconds}
        stats={[
          { label: 'best', value: best ? fmtTime(best) : '—', accent: '#6ee7b7' },
          {
            label: record ? 'new record' : difficulty.name.toLowerCase(),
            value: record ? 'yes' : difficulty.name,
            accent: record ? '#f5a623' : undefined,
          },
        ]}
        primaryLabel="Play again"
        onPrimary={() => start(diffId)}
        secondaryLabel="Back to menu"
        onSecondary={onExit}
      />
    );
  }

  if (phase === 'play') {
    return (
      <GameView
        difficulty={difficulty}
        source={noGuess ? { kind: 'noguess' } : { kind: 'random' }}
        sceneId={scene}
        modeLabel={`Classic · ${difficulty.name}`}
        mode="classic"
        onWin={onWin}
        onExit={() => setPhase('select')}
      />
    );
  }

  return (
    <div className="flex h-full flex-col max-w-md mx-auto w-full px-4 pt-3">
      <div className="flex items-center gap-2 mb-6">
        <button type="button" onClick={onExit} className="text-[#8593ad] -ml-1" aria-label="back">
          <BackIcon size={24} />
        </button>
        <span className="text-sm text-[#8593ad]">Classic</span>
      </div>
      <h1 className="font-display font-bold text-2xl mb-1">Choose a difficulty</h1>
      <p className="text-sm text-[#8593ad] mb-6">Unlimited boards. Beat your best time.</p>
      <div className="space-y-3 mb-8">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => start(d.id)}
            className="w-full rounded-2xl border border-[#21304d] bg-[#131c30] p-4 flex items-center justify-between"
          >
            <div className="text-left">
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-[#8593ad]">
                {d.cols}×{d.rows} · {d.mines} mines
              </div>
            </div>
            <div className="font-mono text-xs text-[#6ee7b7]">
              {getBestTime(d.id) ? fmtTime(getBestTime(d.id)!) : '—'}
            </div>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          const next = !noGuess;
          setNoGuess(next);
          saveSettings({ noGuess: next });
        }}
        className="w-full rounded-2xl border border-[#21304d] bg-[#131c30] p-4 flex items-center justify-between"
      >
        <div className="text-left">
          <div className="font-medium">No-guess boards</div>
          <div className="text-xs text-[#8593ad]">Always solvable by logic alone</div>
        </div>
        <span
          className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors"
          style={{ background: noGuess ? '#f5a623' : '#2a3750' }}
        >
          <span
            className="w-5 h-5 rounded-full bg-white transition-transform"
            style={{ transform: noGuess ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </span>
      </button>
    </div>
  );
}
