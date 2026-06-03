<!--
  One coherent PR per phase (or sub-task). Each must be independently
  reviewable and revertable. Evidence is mandatory — see below.
-->

## Phase / scope

<!-- e.g. "Phase 1 — strict TS + lint + test runner" -->

## What changed

-

## Why

-

## Evidence

<!-- Every claim needs a receipt: a file:line, a test result, a build log, or a doc URL.
     "I think it works" is not evidence. -->

- [ ] `npm ci` clean
- [ ] Typecheck (`tsc -b`) clean
- [ ] **No-guess gate: 24/24** (paste `PASS n FAIL 0`)
- [ ] `vite build` clean (note main-chunk gzip size)
- [ ] Lint / tests (once wired) green

```
<!-- paste relevant logs here -->
```

## Behaviour changes (called out explicitly)

<!-- Any change to gameplay, balance, pricing, the ad policy, or the data model
     MUST be stated here. No silent changes. Write "None" if none. -->

None.

## Guardrails

- [ ] No secrets / signing material committed
- [ ] No-guess invariant intact (or N/A)
- [ ] No pay-to-win or dark patterns introduced
