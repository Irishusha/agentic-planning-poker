## Context

See `proposal.md` — Why. The repository has no domain code yet: `lib/` holds only the `health` baseline
module and its colocated test, and `openspec/specs/` is empty, so this is the first capability.

The decisions below were reviewed by a human and approved before implementation. Where the first draft left a
question open — the rounding rule below 8 hours, the behaviour on invalid input, whether estimate values are
constrained — the approved answer is recorded here as a decision rather than as a risk.

Constraints that shape the approach:

- `docs/architecture.md`: pure domain types, deck conversion and statistics live in `lib/estimation/`; domain
  functions do not mutate their inputs; tests sit beside the source as `*.test.ts`; expected values in a test
  are written independently and never computed with the function under test.
- `docs/product-plan.md` — Statistics: hours are the canonical unit, one working day is 8 hours, the Average
  is calculated from unrounded hours, and display conversion happens only after calculation.
- `design/spec.md` §4.5 shows where these numbers surface (the five stat tiles and the per-role rows) but
  this change stops at the domain; nothing renders yet.
- TypeScript `strict` is on, `tsconfig.json` includes `**/*.ts`, Vitest is configured with
  `include: ["**/*.test.{ts,tsx}"]`, and `pnpm check` runs typecheck, lint, test, the hooks self-test and
  `spec:check`.

## Goals / Non-Goals

**Goals:**

- One input type that makes the five participant states mutually exclusive by construction, so later UI and
  transport code cannot assemble a contradictory entry.
- One calculation entry point that produces every group the reveal screen needs — the five roles and Overall
  — in a single pass, with unrounded hours.
- One formatter that owns the hours/days display rule for every duration the reveal screen shows, so no
  component re-derives it.
- Compile-time rejection of the two input mistakes a later caller is most likely to make: an unsupported role
  key and an off-deck estimate value.

**Non-Goals:**

- The deck's card labels and the card→hours conversion (`4h · 1d · … · 14d · ?`). Only the *type* of a legal
  estimate value lands here; the labels, their order and the conversion are a separate change.
- Runtime validation of the entry list (Zod arrives with real API boundaries, per the product plan). The
  discriminated union is the guard, at compile time. The one run-time guard in this change is the formatter's
  input check, which exists because a computed `number` reaches it without passing through the union.
- Consensus detection, per-vote names, `N of M` progress, marker positions — all later.

## Decisions

**Roles come from one runtime source.** `roles.ts` exports
`export const ROLE_KEYS = ["qa", "backend", "frontend", "ba", "pm"] as const` and derives
`export type RoleKey = (typeof ROLE_KEYS)[number]`. The union is not written a second time, so the list and
the type cannot drift apart and adding a role is a one-line edit.
*Consequence for the task order:* `ROLE_KEYS` cannot be staged behind a placeholder. Seeding it as `[]` would
make `RoleKey` resolve to `never` and turn every later test into a compile error — a structural red, which
this change's own working agreement rules out. So `ROLE_KEYS` holds its real value from the moment the module
is created, and `roles.test.ts` passes the first time it runs. It is written anyway, as the regression guard
on the list's contents and order; the red-then-green cycle applies to `formatDuration` and
`calculateRoundStatistics`, which is where the behaviour actually is.

**Estimate values are the MVP deck, as a type.** `deck.ts` exports
`export type DeckHours = 4 | 8 | 16 | 24 | 40 | 64 | 80 | 112`. An off-deck estimate is then a compile error
at the construction site, with no run-time check and no validation code. Measures the calculation *derives*
stay `number`: an Average of `128/3` is not a deck value and must not be coerced into one.
*Placement:* its own module rather than a member of `statistics.ts`, because the deck is the seam the later
card-conversion change extends, and statistics should not own the deck's definition. `deck.ts` holds no
runtime value, so it gets no `*.test.ts`; the type-level fixture covers it.
*Alternative rejected:* deriving `DeckHours` from a runtime `DECK_HOURS` tuple, mirroring the roles pattern.
Nothing in this change needs to iterate the deck — no menu is rendered, no card is converted — so a runtime
tuple would be an unused export, and the card-conversion change is the one that should decide its shape.

**A discriminated union keyed on `kind`, not a record of flags.** The entry is
`{ kind: "estimate"; role: RoleKey; hours: DeckHours } | { kind: "unsure"; role: RoleKey } |
{ kind: "waiting"; role: RoleKey } | { kind: "away"; role: RoleKey } | { kind: "observer" }`. `hours` exists
only on the `estimate` variant, so "Away with a vote" or "an observer who voted" cannot be typed at all, and
narrowing on `kind` is exhaustive. Variant names follow the product plan's vocabulary: `waiting` is the
plan's Waiting state, `unsure` is the `?` card, `away` is the coffee toggle, `observer` is the participation
mode.
*Alternative rejected:* `{ role; hours: number | null; isAway: boolean; isObserver: boolean }` — four
independent fields encode 2×2×2 contradictory combinations that every consumer would have to re-check, and
the product plan's "exactly one active state per voting participant" would become a runtime convention
instead of a type.

**The `observer` variant carries no role.** An Observer contributes to no per-role group and to no Overall
group, so a role on it would be data the calculation is required to ignore — and a reader would reasonably
expect `{ kind: "observer", role: "qa" }` to show up somewhere in the `qa` row. Omitting the field makes the
exclusion structural instead of conventional.
*Trade-off:* a participant who switches between Observer and an active mode has their role held by the
surrounding participant record, not by the round entry, so the caller re-supplies it when they become active
again. That is the right place for it — the role belongs to the person, not to one round.

**Four small modules, plus a type-level fixture.** `lib/estimation/roles.ts` (role tuple + derived key),
`lib/estimation/deck.ts` (legal estimate values), `lib/estimation/statistics.ts` (entry model, group shape,
calculation) and `lib/estimation/duration.ts` (formatting and its input guard). The three that carry runtime
behaviour each get a colocated `*.test.ts`. Formatting is independent of the calculation — it takes a number
and returns a string — and keeping it apart is what lets the calculation stay unrounded and lets the
formatter be tested on boundary values with no entries involved. No barrel file: consumers import the module
they need, as `lib/health.ts` is imported today.
*Alternative rejected:* a single `estimation.ts` — it would put the display rule and the arithmetic in one
test file and blur which one a failure came from.

**Compile-time guarantees are pinned in `lib/estimation/types.test-d.ts`.** The spec asserts that an
unsupported role key, an off-deck estimate and an Observer with a role are rejected *at compile time*, and a
Vitest test cannot observe that — code that does not compile is not code Vitest runs. The fixture states each
case as an expression preceded by `@ts-expect-error`, so `tsc` fails if the error ever stops occurring
("Unused '@ts-expect-error' directive"). That inverted assertion is what makes it a real check rather than a
comment. `pnpm typecheck` is its runner.
*Why that filename:* `tsconfig.json` includes `**/*.ts`, so `tsc --noEmit` checks it; Vitest's
`include: ["**/*.test.{ts,tsx}"]` does not match `types.test-d.ts`, and Vitest's own type-testing mode is not
enabled in `vitest.config.mts`, so `pnpm test` neither collects nor runs it. The fixture therefore cannot
turn the behavioural red phase into a configuration failure — the case the working agreement warns about.
*Alternative rejected:* naming it `types.test.ts` — Vitest would collect a file with no test in it and fail
the run with "No test suite found", which is exactly the structural noise the red phase must not contain.

**A fixed record of role groups, built from the canonical list.** The result is
`{ overall, byRole: Record<RoleKey, EstimateStatistics> }`, where `byRole` is seeded from `ROLE_KEYS`, so
every role always has a group and a role nobody voted for reports the empty group rather than being absent.
`Object.fromEntries` over that mapping is typed `{ [k: string]: EstimateStatistics }`, so the *value* shape is
checked: seeding a group with anything that is not an `EstimateStatistics` is a compile error. The
`as Record<RoleKey, EstimateStatistics>` assertion narrows the key type only — it does not statically prove
that all five keys are present, because TypeScript accepts the conversion on the strength of the overlap
alone. Key completeness is therefore a run-time property, held by construction (the seeding maps `ROLE_KEYS`
itself, so it cannot skip a role) and pinned by the test "every supported role has a group, and no other role
key does". Adding a sixth role to `ROLE_KEYS` flows through that mapping automatically and gains a group with
no edit here; it does not, and is not meant to, break the build at this site.
*Alternative rejected:* returning only the roles present in the input — the reveal screen shows one row per
role, and the caller would have to re-add the empty ones.

**Overall is computed from the eligible entries directly, not from the role groups.** Averaging five role
averages is a weighted mean and gives the wrong number (for `qa 24h`, `backend 40h`, `frontend 64h` it would
still give `128/3` by luck, but not once one role has two votes). Both Overall and each role group come from
the same helper applied to a filtered list of hours, which is also what keeps "the role breakdown never
changes the overall result" true.

**Unavailable measures are `null`, and Votes is always a number.** `null` is an explicit "no eligible
estimate" that survives JSON when a transport layer arrives, unlike `undefined`, and it is impossible to
confuse with `0` hours. Votes has a meaningful zero, so it is never `null`. All four measures are typed
`number | null` rather than `DeckHours | null`: Average and Spread are genuinely unrestricted, and giving
Lowest and Highest a narrower type than their siblings would split the group shape and the shared helper for
no gain at a call site that formats all four the same way.

**Half-up to one decimal via `Math.round(value * 10) / 10`, then template-string interpolation.**
`Math.round` rounds a positive `.5` upward, which is the rule the product plan states, and `10` hours → `1.25`
days → `12.5` → `13` → `1.3d` is exactly the case the spec pins. Interpolating the resulting number drops a
trailing `.0` on its own (`1` renders as `"1"`, giving `1d`), so no string post-processing is needed.
*Alternative rejected:* `toFixed(1)` plus a `.0`-stripping regex — it always emits a decimal that then has to
be removed again, and its rounding is defined on the decimal string rather than on the value.

**The unit branch is `hours < 8`, and the same rounding applies to both units.** The product plan states the
one-decimal half-up rule for the days display; applying it to hours as well keeps a single rule in one
function, and it is reachable from the MVP deck — `4h`, `4h`, `1d` averages to `16/3 ≈ 5.333` hours, which
must display as `5.3h` rather than a raw float. Reviewed and approved; recorded as a scenario in the spec
rather than left implicit. The same function formats Lowest, Average, Highest and Spread, so no measure gets
a display rule of its own.

**Invalid input throws `RangeError`, it does not return a fallback string.** `formatDuration` rejects a
negative value, `NaN`, `Infinity` and `-Infinity` with the exact message
`hours must be a finite non-negative number`. A guard is warranted here and nowhere else in this change
because the formatter is the one function whose argument is a computed `number` rather than a value drawn
from the discriminated union, so the type system cannot reach it. Throwing beats returning `"—"` or `"0h"`: a
bad number is a caller bug, and a placeholder string would render as a plausible statistic and hide it. The
exact message is part of the contract so a test can assert it rather than matching loosely on the type alone.
*Alternative rejected:* clamping a negative to `0` — it would silently turn a sign error into a legitimate
looking `0h`.

## Risks / Trade-offs

- **Floating-point averages.** `128/3` is not exact in binary, so tests must assert the average with
  `toBeCloseTo` (or compare against an independently written `128 / 3`) rather than a decimal literal, and
  must never compute the expectation with the function under test. → The spec states the average as the
  fraction `128/3`; the test plan writes the expectation as that arithmetic literal.
- **`Math.round(value * 10)` inherits binary representation error** for a value whose exact decimal is a tie
  it cannot represent (the classic `1.005` case). → Every tie reachable from the MVP deck comes from
  `hours / 8` with integer hours, which is exactly representable at the quarter, so the pinned `1.25 → 1.3`
  case is safe. If an alternative scale later introduces awkward values, the formatter is one function to
  revisit.
- **`roles.test.ts` is green on arrival.** The derived-type decision makes a placeholder impossible, so that
  one file does not take part in the red phase. → Accepted deliberately; the task that writes it states the
  reason, so a later reader does not "fix" it by reintroducing a placeholder.
- **The type-level fixture is only as good as its runner.** If someone renames it to `*.test.ts`, or narrows
  `tsconfig.json`'s `include`, the compile-time guarantees stop being checked without any test turning red.
  → `pnpm check` runs `typecheck` before `test`, and the fixture's own header comment states why the filename
  matters.
- **Naming lock-in.** `RoleKey`, `DeckHours`, `RoundEntry` and the variant names become the vocabulary of
  every later change (state, transport, UI). → They are taken from `docs/product-plan.md` wording, so the
  rename risk is low, and the change is still small enough to rename cheaply if Stage 2 disagrees.
- **`DeckHours` hard-codes the MVP Hours deck.** An alternative scale (story points, a different hour set)
  would need the type to become generic or per-room. → Out of scope for the MVP by the product plan; the type
  lives alone in `deck.ts` precisely so that change has one place to land.
