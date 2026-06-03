import { SceneView } from '../components/SceneView';
import { Banner } from '../components/Banner';
import {
  PlayIcon,
  InfinityIcon,
  GridIcon,
  FlameIcon,
  GalleryIcon,
  SettingsIcon,
} from '../components/icons';
import { sceneForDate } from '../game/scenes';
import { localDateKey } from '../lib/rng';
import { getStreak, isDailyDone } from '../lib/storage';

type Screen = 'daily' | 'endless' | 'classic' | 'gallery' | 'settings';

function hoursToMidnight(): string {
  const now = new Date();
  const mid = new Date(now);
  mid.setHours(24, 0, 0, 0);
  const h = Math.floor((mid.getTime() - now.getTime()) / 3600000);
  const m = Math.floor(((mid.getTime() - now.getTime()) % 3600000) / 60000);
  return h > 0 ? `${h}h` : `${m}m`;
}

function prettyDate(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function Home({ go }: { go: (s: Screen) => void }) {
  const today = localDateKey();
  const scene = sceneForDate(today);
  const done = isDailyDone(today);
  const streak = getStreak();

  return (
    <div className="flex h-full flex-col max-w-md mx-auto w-full">
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4">
        <div className="flex items-baseline gap-2 mb-5">
          <span className="font-display font-bold text-xl">Minesweeper</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623] inline-block self-center" />
          <span className="font-mono text-xs text-[#8593ad] tracking-wide">daily logic</span>
        </div>

        <button
          type="button"
          onClick={() => go('daily')}
          className="w-full text-left rounded-2xl border border-[#21304d] bg-[#131c30] p-4 mb-3"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#8593ad]">Today's puzzle</span>
            <span className="font-mono text-xs text-[#f5a623] flex items-center gap-1">
              <FlameIcon size={13} /> {streak.current}
            </span>
          </div>
          <div
            className="rounded-xl overflow-hidden border border-[#21304d] mb-3"
            style={{ height: 84 }}
          >
            <SceneView
              sceneId={scene.id}
              progress={done ? 1 : 0.32}
              className="w-full h-full block"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#8593ad]">{prettyDate()}</span>
            <span
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{
                background: done ? 'transparent' : '#f5a623',
                color: done ? '#6ee7b7' : '#3a2606',
              }}
            >
              {done ? (
                'Completed'
              ) : (
                <>
                  <PlayIcon size={15} /> Play today
                </>
              )}
            </span>
          </div>
          {!done && (
            <div className="mt-2 text-right font-mono text-[10px] text-[#5d6b86]">
              resets in {hoursToMidnight()}
            </div>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            type="button"
            onClick={() => go('endless')}
            className="rounded-2xl border border-[#21304d] bg-[#131c30] p-4 text-center"
          >
            <InfinityIcon size={22} className="text-[#f5a623] mx-auto" />
            <div className="mt-2 text-sm">Endless</div>
            <div className="text-[11px] text-[#8593ad] mt-0.5">rising difficulty</div>
          </button>
          <button
            type="button"
            onClick={() => go('classic')}
            className="rounded-2xl border border-[#21304d] bg-[#131c30] p-4 text-center"
          >
            <GridIcon size={22} className="text-[#7dd3fc] mx-auto" />
            <div className="mt-2 text-sm">Classic</div>
            <div className="text-[11px] text-[#8593ad] mt-0.5">pick a difficulty</div>
          </button>
        </div>

        <div className="flex items-center justify-around border-t border-[#1a2540] pt-3 text-[#5d6b86]">
          <button
            type="button"
            onClick={() => go('gallery')}
            className="p-2 flex flex-col items-center gap-1 text-xs"
          >
            <GalleryIcon size={20} /> Gallery
          </button>
          <button
            type="button"
            onClick={() => go('settings')}
            className="p-2 flex flex-col items-center gap-1 text-xs"
          >
            <SettingsIcon size={20} /> Settings
          </button>
        </div>
      </div>
      <div className="pb-3">
        <Banner />
      </div>
    </div>
  );
}
