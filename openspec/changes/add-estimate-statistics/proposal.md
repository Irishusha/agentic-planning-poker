## Why

Stage 1 of the product plan owns the estimation rules, and every later stage only carries them across a
network boundary. Nothing in the repository calculates a Planning Poker result yet: `lib/` holds only the
`health` baseline module. Until the statistics and their hours/days display exist as tested pure functions,
any room prototype would have to invent the rules inline in React, which `docs/architecture.md` forbids and
which would make the per-role and Overall numbers untestable.

## What Changes

- Add the five stable role keys (`qa`, `backend`, `frontend`, `ba`, `pm`) as a single canonical ordered
  runtime tuple, with the role type derived from that one tuple so the list and the type cannot diverge.
- Add the MVP deck's hour values (`4 | 8 | 16 | 24 | 40 | 64 | 80 | 112`) as a type, so an off-deck estimate
  is a compile error. Measures the calculation derives stay unrestricted finite non-negative numbers.
- Add a discriminated-union input model for one participant's round state, so that an estimate, `?`,
  not-voted, Away and Observer are five mutually exclusive variants and a numeric value exists only on the
  estimate variant. No booleans are combined to express these states. The four participating variants carry
  a role key; Observer carries none, because an Observer takes part in no per-role group and in no Overall
  group.
- Add a pure calculation over a list of those entries that returns Lowest, unrounded Average, Highest,
  Spread (all in canonical hours, or `null` when the group has no eligible estimate) and a numeric Votes
  count, for each of the five roles and for Overall.
- Add a pure duration formatter that renders canonical hours as the user-facing string: hours below 8,
  days at 8 and above, half-up to one decimal place in both units, with no trailing `.0`. It is the single
  convention for displaying Lowest, Average, Highest and Spread. A negative, `NaN` or infinite input is
  rejected with a `RangeError`.
- Add colocated Vitest behavioural tests covering the reachable MVP round, the exclusion rules, the empty
  group, per-role plus Overall, the formatting boundaries, the rejected inputs and input immutability, plus
  a type-level fixture that pins the compile-time restrictions on role keys, deck values and the Observer
  variant.

This change adds no React code, no state, no persistence, no networking and no dependencies. Wiring these
functions into a room UI is a later change.

## Capabilities

### New Capabilities
- `estimation-statistics`: the role keys, the deck's estimate values, the round-entry input model, the
  per-role and Overall statistics calculation in canonical hours, and the hours/days display formatting of a
  duration together with its rejection of invalid input.

### Modified Capabilities

None — this is the project's first capability spec.

## Impact

- New code under `lib/estimation/`: `roles.ts`, `deck.ts`, `statistics.ts` and `duration.ts`. The three that
  carry behaviour get a colocated `*.test.ts`; `deck.ts` is type-only, so its guarantees are pinned by the
  type-level fixture `lib/estimation/types.test-d.ts` instead, which `pnpm typecheck` checks and Vitest does
  not run.
- No existing file changes. `lib/health.ts` and its test stay as they are.
- No dependency, script or configuration changes: Vitest, TypeScript strict and ESLint are already
  configured and `pnpm check` already runs them.
- Downstream: the reveal UI, the `N of M` counter and any future transport layer consume these types rather
  than redefining the rules.
