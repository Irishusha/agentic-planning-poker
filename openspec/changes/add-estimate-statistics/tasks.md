## 1. Declare the public API surface (no behaviour yet)

The red phase must fail on assertions about behaviour, not on a missing import, so the modules and their
signatures exist before the tests, with deliberately unimplemented bodies. No calculation and no formatting
is written in this group.

`ROLE_KEYS` is the one exception to "no values yet", and deliberately so: `RoleKey` is derived from it, so a
placeholder `[]` would make `RoleKey` resolve to `never` and turn every later test into a compile error —
a structural red, which §2 of this plan rules out. See `design.md`, "Roles come from one runtime source".

- [x] 1.1 Create `lib/estimation/roles.ts` exporting `export const ROLE_KEYS = ["qa", "backend", "frontend", "ba", "pm"] as const` and the derived `export type RoleKey = (typeof ROLE_KEYS)[number]`, with no second hand-written union; verify with `pnpm typecheck` (clean) and by confirming the file exports both names.
- [x] 1.2 Create `lib/estimation/deck.ts` exporting `export type DeckHours = 4 | 8 | 16 | 24 | 40 | 64 | 80 | 112` and nothing else — no runtime value, no card labels, no conversion; verify with `pnpm typecheck` (clean).
- [x] 1.3 Create `lib/estimation/statistics.ts` exporting the discriminated union `RoundEntry` — `{ kind: "estimate"; role: RoleKey; hours: DeckHours }`, `{ kind: "unsure"; role: RoleKey }`, `{ kind: "waiting"; role: RoleKey }`, `{ kind: "away"; role: RoleKey }` and `{ kind: "observer" }` with no role — plus `EstimateStatistics` (`lowestHours`, `averageHours`, `highestHours`, `spreadHours` as `number | null`, `votes` as `number`), `RoundStatistics` (`overall`, `byRole: Record<RoleKey, EstimateStatistics>`) and `calculateRoundStatistics(entries: readonly RoundEntry[]): RoundStatistics` returning an all-`null` / `votes: 0` placeholder for every group; verify with `pnpm typecheck` (clean).
- [x] 1.4 Create `lib/estimation/duration.ts` exporting `formatDuration(hours: number): string` returning the placeholder `""`, with no guard and no formatting yet, so the rejection tests fail as "expected function to throw" rather than passing by accident; verify with `pnpm typecheck` (clean).
- [x] 1.5 Confirm the shapes match the spec's requirements "Round entry input model" and "Numeric estimates come from the MVP deck" — in particular that no variant other than `estimate` can carry `hours`, that `observer` carries no `role`, and that the derived measures are `number | null` rather than `DeckHours | null`; verify by adding no code and re-reading `specs/estimation-statistics/spec.md`.

## 2. Tests first (red)

Expected values are written independently, as literals or as arithmetic such as `128 / 3` — never produced by
the function under test (`docs/architecture.md`, Tests).

Two files in this group are green the first time they run — `roles.test.ts` and `types.test-d.ts` — because
what they assert was declared in group 1 rather than implemented in group 3. They are written anyway, as the
regression guards on the role list's order and on the compile-time restrictions. The red-then-green cycle
applies to `formatDuration` and `calculateRoundStatistics`, which is where the behaviour is.

- [x] 2.1 Write `lib/estimation/roles.test.ts` for the requirement "Supported roles": assert `ROLE_KEYS` equals `["qa", "backend", "frontend", "ba", "pm"]` in order; verify by running `pnpm exec vitest run lib/estimation/roles.test.ts` and quoting the pass, noting in the task record that it is green on arrival by design.
- [x] 2.2 Write `lib/estimation/duration.test.ts` for the requirement "Duration display formatting" — one test per scenario: `6` → `6h`, `8` → `1d`, `10` → `1.3d`, `16` → `2d`, `16 / 3` → `5.3h`, `0` → `0h`; verify by running `pnpm exec vitest run lib/estimation/duration.test.ts` and quoting the failing assertions.
- [x] 2.3 Add the rejection tests to `lib/estimation/duration.test.ts` for the requirement "Rejection of invalid duration input": assert that `-1`, `NaN`, `Infinity` and `-Infinity` each throw a `RangeError` whose message is exactly `hours must be a finite non-negative number`, asserting the message as a written-out string and not with a loose substring match; verify by running the file and quoting the failures as "expected function to throw".
- [x] 2.4 Write `lib/estimation/statistics.test.ts` covering the calculation scenarios: the reachable QA round (`24h`, `40h`, `64h` → `24` / `128 / 3` via `toBeCloseTo` / `64` / `40` / `3`), the single eligible estimate (`backend 40h`), exclusions (`qa 24h`, `qa ?`, `qa not-voted`, `qa Away` and one role-less Observer → one vote of `24`), the empty eligible group and the empty list (all `null`, votes `0`), per-role plus Overall (`qa 24h`, `backend 40h`, `frontend 64h`, `ba ?`, `pm Away`), and that every supported role has a group; verify by running `pnpm exec vitest run lib/estimation/statistics.test.ts` and quoting the failing assertions.
- [x] 2.5 Add the immutability test to `lib/estimation/statistics.test.ts` for the requirement "The calculation is pure": snapshot the entries as an independently written literal before the call, assert the array and each entry are deeply equal to it afterwards, and assert a second call returns a result equal to the first; verify by running the file and quoting the result.
- [x] 2.6 Write the type-level fixture `lib/estimation/types.test-d.ts` for the compile-time scenarios: an exported const per case — a `RoundEntry` with role `"devops"`, an `estimate` with `hours: 5`, and an `observer` with a `role` — each preceded by `@ts-expect-error` so `tsc` fails if the error stops occurring; add a header comment recording that the `-d` in the filename keeps it out of Vitest's `include: ["**/*.test.{ts,tsx}"]` while `tsconfig.json`'s `**/*.ts` keeps it in `tsc`; verify with `pnpm typecheck` (clean, no "Unused '@ts-expect-error' directive") and by confirming `pnpm exec vitest run lib/estimation` does not list the file among its collected test files.
- [x] 2.7 Confirm the red state is behavioural, not structural: `pnpm typecheck` passes, `pnpm exec vitest run lib/estimation` reports failures only as `expected … received …` assertion diffs or "expected function to throw", and no failure is a module-not-found, "No test suite found", syntax or configuration error; verify by quoting one failing assertion line per failing test file and the Vitest failure count.

## 3. Implement the domain (green)

- [x] 3.1 Implement the `formatDuration` guard: reject a value that is not a finite number or is below zero — `Number.isFinite(hours)` is false, or `hours < 0` — by throwing `new RangeError("hours must be a finite non-negative number")`, with that message written once as a literal; verify `pnpm exec vitest run lib/estimation/duration.test.ts` shows the four rejection tests passing.
- [x] 3.2 Implement the `formatDuration` formatting rule: below `8` hours render the hours with the suffix `h`, otherwise render `hours / 8` with the suffix `d`, in both cases rounding with `Math.round(value * 10) / 10` and interpolating the number so a trailing `.0` never appears; verify `pnpm exec vitest run lib/estimation/duration.test.ts` passes in full, including `10` → `1.3d` and `16 / 3` → `5.3h`.
- [x] 3.3 Implement the eligibility filter and the single-group helper in `lib/estimation/statistics.ts`: collect the hours of `estimate` entries only, and return `null` measures with `votes: 0` for an empty collection, otherwise Lowest, unrounded Average, Highest, Highest − Lowest and the count, all in canonical hours and none of them rounded; verify by running `pnpm exec vitest run lib/estimation/statistics.test.ts` and seeing the exclusion, empty-group and single-estimate tests pass.
- [x] 3.4 Implement `calculateRoundStatistics`: seed `byRole` from `ROLE_KEYS` so every role has a group, apply the helper per role and apply it once to all eligible entries for `overall` (not to the role aggregates), without sorting or otherwise mutating the input array or its entries; verify `pnpm exec vitest run lib/estimation/statistics.test.ts` passes in full, immutability test included.
- [x] 3.5 Re-read the scenarios in `specs/estimation-statistics/spec.md` and confirm each one has a matching passing test — the 20 behavioural scenarios against `roles.test.ts`, `duration.test.ts` and `statistics.test.ts`, and the 3 compile-time scenarios against `types.test-d.ts` under `pnpm typecheck` — with no scenario left uncovered and no product behaviour added that no scenario describes; verify by listing each scenario against its test name.

## 4. Verify the whole change

- [x] 4.1 Confirm the change stayed in scope: `git status --short` and `git diff --stat` show only `lib/estimation/**` and `openspec/changes/add-estimate-statistics/**`, with no React file, no `package.json` change, no config change and no new dependency.
- [x] 4.2 Run `pnpm check` and quote its summary/result.
