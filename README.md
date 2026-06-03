# Minesweeper — cozy reveal

A calm, modern logic game built on the Minesweeper deduction mechanic, reframed
from "defuse bombs" to "uncover a scene". Three modes, no-guess boards, a daily
streak, a scene gallery, and Model B (hybrid) monetisation surfaces wired in.

Stack: React 19 + Vite 6 + TypeScript + Tailwind v4 + Capacitor 8 (Android target).

## What it does

- **Daily** — one deterministic, no-guess board per day (identical for every
  player), a streak, a spoiler-light share result, and a scene added to the
  Gallery on completion.
- **Endless** — run-based, rising difficulty, soft coins. The main ad surface:
  rewarded "Scout" and "Stabilise", capped interstitial between boards.
- **Classic** — pick difficulty, no-guess or true-random toggle. The ASO anchor.

## The differentiator: no-guess boards

Leading puzzle apps guarantee boards solvable by pure logic. This is implemented
properly here, not faked:

- `src/game/solver.ts` — a perfect-play solver. Constraint propagation (trivial +
  subset rules), connected-component enumeration of the frontier, and global
  mine-count reasoning. `solveNoGuess()` returns true only if a board clears with
  zero guessing; `findDeductions()` returns provably safe/mine cells (also used by
  the in-game Scout hint).
- `src/game/generator.ts` — rejection sampling: generate, solve, discard if it
  needs a guess. `generateNoGuess()` for live play; `generateDaily()` is seeded by
  date so it is reproducible for everyone.
- `src/game/generator.worker.ts` + `src/game/boardSource.ts` — generation runs in
  a Web Worker with a small pre-filled buffer, so new games start instantly.
  Falls back to the main thread if a worker can't be created.

Verified by `tools/solver-test.ts` (24/24 assertions): every generated board is
solvable with no guessing, first-click safe, with correct adjacency and mine
counts; the solver discriminates (only ~19% of random Hard boards are no-guess,
so the generator is doing real rejection); and the daily is deterministic.

Run the tests:

```
./node_modules/.bin/esbuild tools/solver-test.ts --bundle --platform=node --format=cjs --outfile=tools/solver-test.cjs
node tools/solver-test.cjs
```

## Architecture

```
src/
  game/
    types.ts, difficulties.ts, engine.ts   reveal/flag/chord/flood (reused)
    solver.ts        no-guess solver + findDeductions
    generator.ts     no-guess + deterministic daily generation
    generator.worker.ts, boardSource.ts    off-thread buffered generation
    scenes.ts        scene catalogue + date selection
  components/
    Board.tsx, CellView.tsx, Hud.tsx        board UI (rounded raised tiles)
    SceneView.tsx    procedural cozy SVG scenes that fill with progress
    GameView.tsx     in-game screen: scene panel, scout, destabilise overlay
    WinCard.tsx, Banner.tsx, icons.tsx
  hooks/useGame.ts   board lifecycle, progress, scout, stabilise (revive)
  lib/
    rng.ts           seeded PRNG (deterministic daily)
    storage.ts       streak, daily records, gallery, coins, settings, best times
    ads.ts           Model B ad abstraction + placement policy (stub + AdMob notes)
    iap.ts           cosmetic IAP abstraction (stub + RevenueCat notes)
    haptics.ts, share.ts
  screens/           Home, Daily, Endless, Classic, Gallery, Settings
```

## Build and run

```
npm install
npm run dev      # browser preview
npm run build    # tsc -b && vite build  (compiles clean; worker bundled separately)
```

## Monetisation (Model B) — what is stubbed

`ads.ts` and `iap.ts` are abstractions with web stubs so the flows are testable
in the browser. On device, plug the real SDKs:

- **Ads** — `@capacitor-community/admob` (or AppLovin MAX mediation for higher
  eCPM). Replace `nativeAdmob` in `ads.ts`. Policy is already enforced: rewarded
  is opt-in only (Scout, Stabilise); interstitial is capped to one per 90s and
  every 3rd Endless break; banner is menus only. If the remove-ads IAP is owned,
  all ad calls become no-ops and rewards are granted free.
- **IAP** — RevenueCat (`@revenuecat/purchases-capacitor`) recommended for
  cross-store. Replace `nativeStore` in `iap.ts`. Products: remove-ads (one-time)
  and cosmetic theme packs. No pay-to-win.

## Android / Play Console

Generating the signed AAB needs the Android SDK, a keystore, and the Play
Console — done on your machine, not here.

```
npm run build
npx cap add android        # first time
npx cap sync android
# set applicationId in capacitor.config.ts and android/app/build.gradle
cd android && ./gradlew bundleRelease   # signed AAB with your keystore
```

Remaining steps on your side: set a real `applicationId`; generate icons and
splash via `@capacitor/assets`; capture screenshots (first two + icon drive most
installs); write a privacy policy URL (the app stores only local data, no
tracking); fill the Play listing (keep "Minesweeper" in the title for search).
The 12-tester / 14-day closed-testing gate does **not** apply to your
Organisation account — you publish straight to Production.

## Notes

- All progress is local (localStorage). No accounts, no network, no tracking.
- Scenes are procedural SVG, so theme packs are cheap to add (extend `scenes.ts`
  and `SceneView.tsx`).
