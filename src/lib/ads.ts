// Ad service (Model B: hybrid monetisation).
//
// This is a thin abstraction over the ad network so the rest of the app only
// ever calls showRewarded() / maybeShowInterstitial(). The web build uses a
// stub that simulates a watched ad. On device, wire @capacitor-community/admob
// (or AppLovin MAX mediation for higher eCPM) inside `nativeAdmob` below.
//
// Placement policy, enforced here so design and revenue stay coherent:
//   - Rewarded: opt-in only (Scout a safe cell, Stabilise/continue). The real
//     earner; tier-1 eCPM ~ $15-40. Always player-initiated.
//   - Interstitial: at most one at a genuine break (between Endless boards),
//     hard frequency cap below. Never mid-board (protects retention).
//   - Banner: menus/Gallery only (rendered by the UI, not here).
// If the remove-ads IAP is owned, every method becomes a no-op / instant grant.

import { getSettings } from './storage';

const INTERSTITIAL_MIN_GAP_MS = 90_000; // never more than one interstitial per 90s
const INTERSTITIAL_EVERY_N = 3; // and only every Nth eligible break
let lastInterstitial = 0;
let breakCounter = 0;

export type RewardedContext = 'scout' | 'stabilise' | 'reveal-scene' | 'extra-daily';
export type InterstitialContext = 'endless-board' | 'run-over';

function adsRemoved(): boolean {
  return getSettings().adsRemoved;
}

// Returns true if the reward should be granted (ad completed or ads removed).
export async function showRewarded(_context: RewardedContext): Promise<boolean> {
  if (adsRemoved()) return true; // owner of remove-ads gets the reward for free
  return nativeAdmob.showRewarded();
}

export async function maybeShowInterstitial(_context: InterstitialContext): Promise<void> {
  if (adsRemoved()) return;
  breakCounter += 1;
  const now = Date.now();
  if (breakCounter % INTERSTITIAL_EVERY_N !== 0) return;
  if (now - lastInterstitial < INTERSTITIAL_MIN_GAP_MS) return;
  lastInterstitial = now;
  await nativeAdmob.showInterstitial();
}

export function shouldShowBanner(): boolean {
  return !adsRemoved();
}

// ---- Native adapter ----------------------------------------------------------
// Replace the bodies with real AdMob calls on device. Detect native at runtime
// via Capacitor; on web the stub runs. Keep the unit IDs in env/config, not here.
interface AdAdapter {
  showRewarded(): Promise<boolean>;
  showInterstitial(): Promise<void>;
}

const stubAdapter: AdAdapter = {
  async showRewarded() {
    // Simulate a ~1s rewarded view in the browser/dev build.
    await new Promise((r) => setTimeout(r, 700));
    return true;
  },
  async showInterstitial() {
    await new Promise((r) => setTimeout(r, 300));
  },
};

// On device, swap this for a Capacitor AdMob-backed adapter. Sketch:
//
//   import { AdMob, RewardAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';
//   await AdMob.initialize();
//   async showRewarded() {
//     await AdMob.prepareRewardVideoAd({ adId: REWARDED_UNIT_ID });
//     return new Promise((resolve) => {
//       AdMob.addListener(RewardAdPluginEvents.Rewarded, () => resolve(true));
//       AdMob.addListener(RewardAdPluginEvents.Dismissed, () => resolve(false));
//       AdMob.showRewardVideoAd();
//     });
//   }
//
// Use a mediation layer (AppLovin MAX / AdMob mediation) for materially higher
// fill and eCPM than a single network.
const nativeAdmob: AdAdapter = stubAdapter;
