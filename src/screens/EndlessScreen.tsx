import { useEffect, useState } from 'react';
import { GameView } from '../components/GameView';
import { boardSource } from '../game/boardSource';
import { difficultyById } from '../game/difficulties';
import { sceneForIndex } from '../game/scenes';
import { addCoins, getCoins, getEndlessBest, recordEndlessLevel } from '../lib/storage';
import { maybeShowInterstitial } from '../lib/ads';
import type { GeneratedBoard } from '../game/generator';
import { InfinityIcon } from '../components/icons';

function difficultyForLevel(level: number) {
  if (level <= 2) return difficultyById('easy');
  if (level <= 5) return difficultyById('medium');
  return difficultyById('hard');
}
const sceneForLevel = (level: number) => sceneForIndex(level - 1).id;

export function EndlessScreen({ onExit }: { onExit: () => void }) {
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState(getCoins());
  const [board, setBoard] = useState<GeneratedBoard | null>(null);
  const [phase, setPhase] = useState<'loading' | 'play' | 'runover'>('loading');

  const difficulty = difficultyForLevel(level);

  useEffect(() => {
    if (phase === 'runover') return;
    let active = true;
    setPhase('loading');
    void boardSource.getNoGuess(difficulty).then((b) => {
      if (active) {
        setBoard(b);
        setPhase('play');
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const onWin = () => {
    const reward = 5 * level;
    setCoins(addCoins(reward));
    recordEndlessLevel(level);
    if (level % 3 === 0) void maybeShowInterstitial('endless-board');
    setLevel((l) => l + 1);
  };

  const endRun = () => {
    void maybeShowInterstitial('run-over');
    setPhase('runover');
  };

  if (phase === 'runover') {
    return (
      <div className="flex h-full flex-col items-center justify-center max-w-md mx-auto w-full px-6 text-center">
        <InfinityIcon size={28} className="text-[#f5a623] mb-3" />
        <h1 className="font-display font-bold text-2xl mb-1">Run over</h1>
        <p className="text-sm text-[#8593ad] mb-6">You reached level {level}.</p>
        <div className="grid grid-cols-2 gap-3 w-full mb-8">
          <div className="rounded-xl bg-[#131c30] border border-[#21304d] py-4">
            <div className="font-mono text-lg">{level}</div>
            <div className="text-[11px] text-[#8593ad]">level reached</div>
          </div>
          <div className="rounded-xl bg-[#131c30] border border-[#21304d] py-4">
            <div className="font-mono text-lg text-[#6ee7b7]">{getEndlessBest()}</div>
            <div className="text-[11px] text-[#8593ad]">best ever</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setLevel(1);
            setPhase('loading');
          }}
          className="w-full rounded-xl bg-[#f5a623] py-3 mb-2 font-medium text-[#3a2606]"
        >
          New run
        </button>
        <button type="button" onClick={onExit} className="w-full py-2 text-sm text-[#8593ad]">
          Back to menu
        </button>
      </div>
    );
  }

  if (phase === 'loading' || !board) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#5d6b86]">
        Preparing level {level}…
      </div>
    );
  }

  return (
    <GameView
      key={level}
      difficulty={difficulty}
      source={{ kind: 'preset', board }}
      sceneId={sceneForLevel(level)}
      modeLabel={`Endless · level ${level}`}
      mode="endless"
      onWin={onWin}
      onExit={endRun}
      rightSlot={<span className="font-mono text-xs text-[#f5a623]">{coins}c</span>}
    />
  );
}
