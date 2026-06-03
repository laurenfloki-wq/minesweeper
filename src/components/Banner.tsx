import { shouldShowBanner } from '../lib/ads';

// Menu-only banner placeholder. On device this is where the AdMob BannerAd view
// is shown (menus/gallery only, never on the live board). Hidden if ads removed.
export function Banner() {
  if (!shouldShowBanner()) return null;
  return (
    <div className="mx-auto w-full max-w-md px-4">
      <div className="h-12 rounded-lg border border-dashed border-[#283651] bg-[#0e1626] flex items-center justify-center text-[10px] font-mono text-[#46536e]">
        banner ad placeholder
      </div>
    </div>
  );
}
