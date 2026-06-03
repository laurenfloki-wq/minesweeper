import { useState } from 'react';
import { SceneView } from './SceneView';
import { ShareIcon, GalleryIcon, FlameIcon } from './icons';
import { sceneById } from '../game/scenes';
import { shareText, fmtTime } from '../lib/share';

interface Stat {
  label: string;
  value: string;
  accent?: string | undefined;
}

interface Props {
  sceneId: string;
  title: string;
  seconds: number;
  stats: Stat[];
  share?: string; // share text; omit to hide Share
  onAddGallery?: () => void;
  added?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function WinCard({
  sceneId,
  title,
  seconds,
  stats,
  share,
  onAddGallery,
  added,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: Props) {
  const [shareState, setShareState] = useState<string | null>(null);
  const scene = sceneById(sceneId);

  const doShare = async () => {
    if (!share) return;
    const res = await shareText(share);
    setShareState(res === 'copied' ? 'Copied' : res === 'shared' ? 'Shared' : 'Try again');
    setTimeout(() => setShareState(null), 1600);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-5 max-w-md mx-auto w-full">
      <div className="w-full fade-up">
        <h1 className="text-center text-2xl font-display font-bold mb-4">{title}</h1>
        <div className="rounded-2xl overflow-hidden border border-[#21304d] mb-1">
          <SceneView sceneId={sceneId} progress={1} className="w-full block" />
        </div>
        <p className="text-center text-xs text-[#6b7896] font-mono mb-4">{scene.name}</p>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <Cell label="time" value={fmtTime(seconds)} />
          {stats.slice(0, 2).map((s) => (
            <Cell key={s.label} label={s.label} value={s.value} accent={s.accent} />
          ))}
        </div>

        {share && (
          <button
            type="button"
            onClick={doShare}
            className="w-full rounded-xl bg-[#f5a623] py-3 mb-2 flex items-center justify-center gap-2 font-medium text-[#3a2606]"
          >
            <ShareIcon size={18} />
            {shareState ?? 'Share result'}
          </button>
        )}
        {onAddGallery && (
          <button
            type="button"
            onClick={onAddGallery}
            disabled={added}
            className="w-full rounded-xl border border-[#21304d] py-3 mb-2 flex items-center justify-center gap-2 text-[#7dd3fc] disabled:opacity-50"
          >
            <GalleryIcon size={18} />
            {added ? 'Saved to gallery' : 'Add to gallery'}
          </button>
        )}

        <button
          type="button"
          onClick={onPrimary}
          className="w-full rounded-xl border border-[#21304d] bg-[#131c30] py-3 mb-2 text-[#e7ecf5]"
        >
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="w-full py-2 text-sm text-[#8593ad]"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string | undefined;
}) {
  return (
    <div className="rounded-xl bg-[#131c30] border border-[#21304d] py-3 text-center">
      <div className="font-mono text-base" style={{ color: accent ?? '#e7ecf5' }}>
        {value}
      </div>
      <div className="text-[10px] text-[#8593ad] mt-0.5 flex items-center justify-center gap-1">
        {label === 'streak' && <FlameIcon size={11} className="text-[#f5a623]" />}
        {label}
      </div>
    </div>
  );
}
