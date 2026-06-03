import { useState } from 'react';
import { SceneView } from '../components/SceneView';
import { BackIcon, LockIcon } from '../components/icons';
import { getGallery, getSettings } from '../lib/storage';
import { sceneById } from '../game/scenes';
import { PRODUCTS, isOwned, purchase } from '../lib/iap';

export function GalleryScreen({ onExit }: { onExit: () => void }) {
  const [, force] = useState(0);
  const entries = getGallery();
  const slots = Math.max(9, entries.length + 3);
  const themes = PRODUCTS.filter((p) => p.kind === 'theme');
  void getSettings();

  const buy = async (id: string) => {
    await purchase(id);
    force((n) => n + 1);
  };

  return (
    <div className="flex h-full flex-col max-w-md mx-auto w-full">
      <div className="flex items-center gap-2 px-4 pt-3 mb-4">
        <button type="button" onClick={onExit} className="text-[#8593ad] -ml-1" aria-label="back">
          <BackIcon size={24} />
        </button>
        <span className="text-sm text-[#8593ad]">Gallery</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <h1 className="font-display font-bold text-2xl mb-1">Your scenes</h1>
        <p className="text-sm text-[#8593ad] mb-5">Each daily you solve adds its scene here.</p>
        <div className="grid grid-cols-3 gap-2 mb-8">
          {Array.from({ length: slots }).map((_, i) => {
            const e = entries[i];
            if (!e) {
              return (
                <div
                  key={`lock-${i}`}
                  className="aspect-[16/10] rounded-xl border border-[#1a2540] bg-[#0e1626] flex items-center justify-center text-[#33415c]"
                >
                  <LockIcon size={16} />
                </div>
              );
            }
            return (
              <div key={e.date} className="rounded-xl overflow-hidden border border-[#21304d]">
                <SceneView sceneId={e.sceneId} progress={1} className="w-full aspect-[16/10] block" />
                <div className="px-1.5 py-1 text-[9px] font-mono text-[#6b7896] truncate bg-[#0e1626]">
                  {e.date.slice(5)}
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="font-display font-bold text-lg mb-3">Theme packs</h2>
        <div className="space-y-2">
          {themes.map((t) => {
            const owned = isOwned(t.id);
            return (
              <div
                key={t.id}
                className="rounded-xl border border-[#21304d] bg-[#131c30] p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <SceneView
                    sceneId={sceneById(t.id.replace('theme_', '')).id}
                    progress={1}
                    className="w-14 aspect-[16/10] rounded-md overflow-hidden block"
                  />
                  <span className="text-sm">{t.title}</span>
                </div>
                <button
                  type="button"
                  disabled={owned}
                  onClick={() => buy(t.id)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium"
                  style={{ background: owned ? 'transparent' : '#f5a623', color: owned ? '#6ee7b7' : '#3a2606' }}
                >
                  {owned ? 'Owned' : t.price}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
