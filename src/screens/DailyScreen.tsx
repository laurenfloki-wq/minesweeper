import { useEffect, useState } from 'react';
import { GameView } from '../components/GameView';
import { WinCard } from '../components/WinCard';
import { boardSource } from '../game/boardSource';
import { difficultyById } from '../game/difficulties';
import { sceneForDate } from '../game/scenes';
import { localDateKey } from '../lib/rng';
import {
  recordDailyComplete,
  saveDailyRecord,
  addToGallery,
  getDailyRecord,
  getStreak,
} from '../lib/storage';
import type { GeneratedBoard } from '../game/generator';
import { fmtTime } from '../lib/share';

const DAILY_DIFFICULTY = difficultyById('medium');

export function DailyScreen({ onExit }: { onExit: () => void }) {
  const today = localDateKey();
  const scene = sceneForDate(today);
  const existing = getDailyRecord(today);

  const [board, setBoard] = useState<GeneratedBoard | null>(null);
  const [phase, setPhase] = useState<'loading' | 'play' | 'win'>(existing ? 'win' : 'loading');
  const [seconds, setSeconds] = useState(existing?.seconds ?? 0);
  const [streak, setStreak] = useState(getStreak());

  useEffect(() => {
    if (existing) return;
    let active = true;
    void boardSource.getDaily(DAILY_DIFFICULTY, today).then((b) => {
      if (active) {
        setBoard(b);
        setPhase('play');
      }
    });
    return () => {
      active = false;
    };
  }, [existing, today]);

  const onWin = (secs: number) => {
    setSeconds(secs);
    const s = recordDailyComplete(today);
    saveDailyRecord({ date: today, seconds: secs, sceneId: scene.id });
    addToGallery({ date: today, sceneId: scene.id, seconds: secs });
    setStreak(s);
    setPhase('win');
  };

  if (phase === 'win') {
    const shareStr = `Minesweeper Daily — ${today}\nSolved in ${fmtTime(seconds)} · streak ${streak.current}`;
    return (
      <WinCard
        sceneId={existing?.sceneId ?? scene.id}
        title="Daily solved"
        seconds={seconds}
        stats={[
          { label: 'streak', value: String(streak.current), accent: '#f5a623' },
          { label: 'best', value: String(streak.best), accent: '#6ee7b7' },
        ]}
        share={shareStr}
        primaryLabel="Back to menu"
        onPrimary={onExit}
      />
    );
  }

  if (phase === 'loading' || !board) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#5d6b86]">
        Preparing today's puzzle…
      </div>
    );
  }

  return (
    <GameView
      difficulty={DAILY_DIFFICULTY}
      source={{ kind: 'preset', board }}
      sceneId={scene.id}
      modeLabel="Daily"
      mode="daily"
      onWin={onWin}
      onExit={onExit}
    />
  );
}
