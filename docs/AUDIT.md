# Handover audit — Minesweeper (cozy reveal)

_Engineer of record onboarding. Date: 2026-06-03. Evidence-first: every claim
below is backed by a file path, a command result, or a build log._

## 0. Provenance note (resolved)

The working directory was **empty** on handover. The codebase was delivered as
`minesweeper-app.zip` in `~/Downloads` (54 files, dated 2026-06-02/03) and
extracted into place. It matches the brief's file map exactly. Verified before
any other work. No prior git history existed; this repo's initial commit is the
provenance baseline.

## 1. Current state (verified)

| Claim | Evidence |
|---|---|
| No-guess invariant holds | `tools/solver-test.ts` → **`PASS 24  FAIL 0`** (exit 0) |
| Generation is fast | Easy avg 5.0 ms, Medium 14.4 ms, Hard 62.2 ms (matches brief) |
| Solver discriminates | Random Hard boards no-guess: **19.7%** (brief: ~19%) — real rejection sampling |
| Daily is deterministic | Seeded `mulberry32(hashSeed("${date}:${id}"))` in `generator.ts:109`; test asserts identical board per date+difficulty |
| Production build clean | `npm run build` exit 0; **main chunk gzip 75.92 kB** (`index-*.js`) — on the brief's ~76 kB budget |
| TypeScript strict | `tsconfig.json` has `strict: true`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` |
| Local data only | `lib/storage.ts` is `localStorage`-only, guarded by try/catch; no network |
| Model B ad policy implemented | `lib/ads.ts`: rewarded opt-in only; interstitial cap 90 s + every 3rd break (`INTERSTITIAL_MIN_GAP_MS`, `INTERSTITIAL_EVERY_N`); `adsRemoved` no-ops all of it |

**Stack:** React 19, Vite 6, TypeScript 5.6, Tailwind v4, **Capacitor 8** (note:
brief said "pinned in package.json" — confirmed v8, Android-only config today).
Node engine requires `>=22`; CI pins Node 22.

## 2. Strengths

- The crown jewel is real, not faked: `solver.ts` is a genuine constraint solver
  (trivial → subset → connected-component enumeration with a 2^22 cap → global
  mine-count reasoning). It is the same code path used for the in-game Scout hint.
- Monetisation abstractions (`ads.ts`, `iap.ts`) have clean public surfaces and
  documented native-SDK integration sketches — Phase 4 can swap internals without
  touching callers, exactly as the brief requires.
- Off-thread buffered generation (`generator.worker.ts` + `boardSource.ts`) keeps
  game starts instant; falls back to main thread if a worker can't be created.

## 3. Risks & gaps (mapped to phases)

| # | Gap | Severity | Phase |
|---|---|---|---|
| 1 | No git/repo/CI on handover | — | **0 (this PR)** |
| 2 | No test runner, lint, or formatter; no eslint/vitest/playwright deps. No-guess test runs via ad-hoc `esbuild`+`node` | High | 1 |
| 3 | Brief's strict extras off: `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`. Enabling will create real fallout — `solver.ts` indexes typed arrays heavily (`cVars[k]`, `sol[p]`, `nbrs[i]`) | Med | 1 |
| 4 | `tools/` is not in `tsconfig` include → the solver harness is not typechecked by `tsc -b` | Med | 1 |
| 5 | `capacitor.config.ts` is Android-only; no iOS config block; README says "Android target". Brief wants both stores | High | 3 |
| 6 | **`.gitignore` blanket-ignores `/android` `/ios`.** When native projects are added (Phase 3) this must be narrowed, or committed native config (PrivacyInfo.xcprivacy, AndroidManifest edits, signing templates) will be lost on regenerate | High | 3 |
| 7 | `appId: com.studioappfactory.minesweeper` is a placeholder; finalising it requires owner sign-off (irreversible after first publish) | Blocker (gated) | 3 |
| 8 | No `PrivacyInfo.xcprivacy`, no privacy labels / Data Safety, no hosted policy | High | 5 |
| 9 | App ships ~180 kB of web fonts (Bricolage Grotesque + DM Mono, multiple weights/subsets). Outside the JS budget but affects app size; consider subsetting | Low | 1–2 |
| 10 | Interstitial frequency cap state is module-level in-memory (resets on reload) — acceptable, but needs the test the brief asks for | Low | 1 |

## 4. Plan against the brief's phases

- **Phase 0 (this PR):** repo, hardened `.gitignore` + `.gitattributes`, CI (Node 22
  → typecheck → **no-guess gate** → build → `npm audit` → gitleaks), CODEOWNERS,
  PR template, Dependabot, branch protection. Acceptance = green CI on this PR.
- **Phase 1:** strict-TS extras + fix fallout; ESLint/Prettier (typescript-eslint,
  react-hooks, jsx-a11y); Vitest unit/integration (engine, solver, storage, rng,
  ads); component tests (Board/CellView); Playwright e2e (Classic → win); coverage
  floor; bundle-size budget + Lighthouse. Wire all as CI gates.
- **Phase 2:** polish — latency, 60fps animation + `prefers-reduced-motion`,
  loading/empty/error states, WCAG 2.1 AA, safe-area/landscape, i18n scaffolding.
- **Phase 3:** `cap add ios android`; narrow the native `.gitignore`; Android
  target SDK per current Play policy (verify 35/36), min 24+, adaptive icon,
  edge-to-edge, predictive + hardware back; iOS deploy target 15+, ATS, safe areas;
  `@capacitor/assets` from the master mark in `/assets`.
- **Phase 4:** real AdMob (+ consider MAX mediation), UMP consent, iOS ATT, child
  flags; RevenueCat IAP (purchase/restore). Public surfaces of `ads.ts`/`iap.ts`
  unchanged.
- **Phase 5:** privacy manifest + required-reason APIs, nutrition labels, Data
  Safety, hosted policy, age ratings, export compliance.
- **Phase 6:** icons/screenshots/feature graphic; listing copy in `store/`
  ("Minesweeper" in both titles).
- **Phase 7:** Play App Signing + upload key; ASC API key; fastlane lanes; signed
  AAB + IPA from a tag in CI.
- **Phase 8:** Sentry behind consent; internal/TestFlight tracks; staged rollout.
  Everything stops at the human go/no-go line.

## 5. Items requiring the owner (blocks the back half)

1. **Apple Developer Program** account (App Store Connect access) — confirm it exists.
2. **Google Play Console Organisation** account — confirm it exists (and the
   12-tester/14-day exemption applies — verify in Console).
3. Final **bundle identifier / applicationId** decision (currently a placeholder).
4. GitHub token currently lacks `admin:repo_hook` scope (has `repo`, `workflow`,
   `gist`, `read:org`). Not needed for Phase 0–1; flag for later webhook needs.
5. All signing keys, AdMob/RevenueCat/Sentry IDs → GitHub Actions secrets, supplied
   by the owner. None committed, ever.
