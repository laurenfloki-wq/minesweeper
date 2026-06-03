import { useState } from 'react';
import { BackIcon } from '../components/icons';
import { getSettings, saveSettings, type Settings } from '../lib/storage';
import { purchase, restorePurchases, isOwned } from '../lib/iap';

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0"
      style={{ background: on ? '#f5a623' : '#2a3750' }}
      aria-pressed={on}
    >
      <span
        className="w-5 h-5 rounded-full bg-white transition-transform"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#21304d] bg-[#131c30] p-4 flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-[#8593ad] mt-0.5">{desc}</div>
      </div>
      {children}
    </div>
  );
}

export function SettingsScreen({ onExit }: { onExit: () => void }) {
  const [s, setS] = useState<Settings>(getSettings());
  const update = (patch: Partial<Settings>) => setS(saveSettings(patch));
  const adsRemoved = isOwned('remove_ads');

  return (
    <div className="flex h-full flex-col max-w-md mx-auto w-full">
      <div className="flex items-center gap-2 px-4 pt-3 mb-4">
        <button type="button" onClick={onExit} className="text-[#8593ad] -ml-1" aria-label="back">
          <BackIcon size={24} />
        </button>
        <span className="text-sm text-[#8593ad]">Settings</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        <Row title="No-guess (Classic)" desc="Classic boards solvable by logic alone">
          <Toggle on={s.noGuess} onClick={() => update({ noGuess: !s.noGuess })} />
        </Row>
        <Row title="Flag mode default" desc="Start each game with flag mode on">
          <Toggle
            on={s.flagModeDefault}
            onClick={() => update({ flagModeDefault: !s.flagModeDefault })}
          />
        </Row>
        <Row title="Haptics" desc="Vibrate on reveal, flag, win and loss">
          <Toggle on={s.haptics} onClick={() => update({ haptics: !s.haptics })} />
        </Row>

        <div className="pt-2">
          <Row title="Remove ads" desc="One-time purchase. Keeps Scout and Stabilise free">
            <button
              type="button"
              disabled={adsRemoved}
              onClick={async () => {
                await purchase('remove_ads');
                setS(getSettings());
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{
                background: adsRemoved ? 'transparent' : '#f5a623',
                color: adsRemoved ? '#6ee7b7' : '#3a2606',
              }}
            >
              {adsRemoved ? 'Removed' : '$3.99'}
            </button>
          </Row>
        </div>

        <button
          type="button"
          onClick={() => restorePurchases()}
          className="w-full py-3 text-sm text-[#8593ad]"
        >
          Restore purchases
        </button>

        <p className="text-xs text-[#5d6b86] leading-relaxed pt-2">
          Daily and Endless always use no-guess boards. Scenes you uncover are saved to your gallery
          on this device. No account, no tracking.
        </p>
      </div>
    </div>
  );
}
