## Context

See `proposal.md` — Why. The constraints that actually shape the approach:

- `lib/estimation/` already owns `ROLE_KEYS` / `RoleKey`, the `RoundEntry` discriminated union,
  `calculateRoundStatistics` and `formatDuration`. `deck.ts` exports the `DeckHours` type and **no runtime
  value**, deliberately — a deck cannot be rendered today.
- `components/planning-poker/` does not exist. This change creates the project's first React surface, so it
  also sets the pattern later screens copy.
- `docs/architecture.md`: domain functions are pure, calculations stay out of JSX and out of state handlers,
  Server Components by default with `"use client"` only on the smallest boundary that needs state, tests
  colocated, expected values written independently.
- React Testing Library, jsdom and the `*.test.tsx` include pattern are installed and configured but unused.
  No new dependency is needed for anything in this change.
- `design/spec.md` §4.4 and §4.5 are the visual reference; `design/planning-poker.html` and
  `design/support.js` are never imported.

## Goals / Non-Goals

**Goals:**

- One state owner, one client boundary, and presentational children that receive already-computed values.
- The round's per-participant state *is* a `RoundEntry`, so the statistics input needs no translation and the
  product invariants are enforced by the type system rather than by tests.
- Every round rule that is not React — deck, transitions, completed count, reset — is a pure function with a
  colocated test that needs no DOM.
- The screen adds no statistic, no measure and no formatting rule of its own.

**Non-Goals** (beyond the scope already excluded in the proposal):

- No React context, no `useReducer`, no custom state library, no memoisation layer.
- No test-only props, render hooks or component-level mocks of the domain — tests drive the real UI.
- No design-token system, font loading or pixel-matching; Stage 2 owns that.
- No abstraction for "a future second screen". This change builds one screen.

## Decisions

### A participant is an identity plus a `RoundEntry`

```ts
type Participant = { readonly id: string; readonly name: string; readonly entry: RoundEntry };
```

The role lives *inside* the entry, so an Observer structurally has no role and an Away voter structurally has
no hours — the same guarantees the archived spec fought for. Building the calculation input is
`roster.map((p) => p.entry)`.

*Alternative considered:* the flat shape suggested in `design/spec.md` §6 —
`{ id, name, role, isObserver, vote: CardId | null, away: boolean }`. Rejected: independently settable
booleans make "Away with a vote" and "an Observer who voted" representable, which the `estimation-statistics`
spec explicitly rules out, and it would need a translation step into `RoundEntry` that can drift. §6 is
labelled "suggested" and predates the archived spec; this is a deliberate divergence, recorded here.

### The runtime deck is an ordered list of discriminated cards

```ts
type DeckCard = { readonly label: string; readonly hours: DeckHours } | { readonly label: "?" };
export const MVP_DECK: readonly DeckCard[];
```

`DeckHours` is untouched, so `estimation-statistics` keeps its compile-time guarantee. `?` is a variant
without `hours` rather than `hours: null`, so it can never be read as zero.

*Alternative considered:* a `Record<label, hours>` plus a special-cased `?` in JSX. Rejected: a record has no
guaranteed order, and the special case would put a deck rule in a component.

### Round transitions live in `lib/estimation/round.ts`, not in event handlers

```ts
type Completed = { readonly n: number; readonly m: number };

function chooseCard(roster, voterId, hours: DeckHours): readonly Participant[];
function chooseUnsure(roster, voterId): readonly Participant[];
function toggleAway(roster, voterId): readonly Participant[];
function resetRound(roster): readonly Participant[];
function countCompleted(roster): Completed;
```

Each returns a new roster and mutates nothing. The one-active-state invariant is enforced in exactly one
place, which is also where Stage 3 will enforce it behind a network boundary.

*Alternatives considered:* (a) inline `setState` updater functions — rejected, `docs/architecture.md` keeps
calculation out of state handlers, and the invariant would then only be testable through the DOM; (b) a
`useReducer` — rejected, the reducer would still need these same pure functions to stay testable, so it adds
indirection and no guarantee. `Participant` and `Completed` live in `round.ts` because they are domain data,
not React concerns.

### `room.tsx` is the only client boundary

```
app/page.tsx  (Server Component, composition only)
  └── components/planning-poker/room.tsx        "use client"  — the ONE state owner
        useState<readonly Participant[]>(SEED_ROSTER)
        useState<boolean>(revealed)
        useState<string>(actingVoterId)
        ├── task-card.tsx           title + description
        ├── acting-as-select.tsx    voters only, never the Observer
        ├── estimate-deck.tsx       MVP_DECK + Away toggle + selected indication
        ├── vote-status.tsx         "N of M voted · cards stay hidden…" + Reveal + Reset
        ├── participant-list.tsx    grouped by ROLE_KEYS; status or revealed value
        └── round-results.tsx       Overall group + five role rows
```

The deck, the toggle, the counter, Reveal and Reset all read and write one shared round, so the smallest
honest boundary is the room. Props go one level deep, which is why there is no context — the product plan
permits context, it just is not needed here. Children are plain presentational functions and stay free of
`"use client"`.

### Statistics are computed once per render, above the JSX

`room.tsx` computes `revealed ? calculateRoundStatistics(roster.map((p) => p.entry)) : null` before returning
JSX and passes the result down. `round-results.tsx` only formats and lays out. No `useMemo`: the input is
seven entries and the function is pure.

### Derived state is derived, not stored

Reveal enablement is `countCompleted(roster).n > 0`, evaluated at render. Storing a `canReveal` flag would
create a second source of truth that reset and every transition would have to maintain.

### `—` is a display decision, made in the component

`calculateRoundStatistics` reports `null` for an unavailable measure. `round-results.tsx` renders `—` for
`null` and calls `formatDuration` only for a number, so `formatDuration` never receives `null` and its
`RangeError` guard stays a genuine caller-bug detector.

*Alternative considered:* a domain `formatMeasure(hours: number | null)`. Rejected: it would extend the
archived capability for a purely visual choice.

### The seeded roster is demo data, kept out of `lib/`

`components/planning-poker/seed-roster.ts` holds the seven participants from the design reference, with a
header comment marking it demo-only and replaced by the join flow at Stage 3. It is not domain logic, so it
does not belong in `lib/estimation/`; a named module keeps `room.tsx` readable and lets tests refer to the
same names the demo shows.

### Reveal and Reset are ungated

A single local screen has one operator, who is the facilitator. Host-versus-participant permission gating
needs a second client to mean anything, so it arrives with Stage 3. The design's `SCREEN / VIEW AS` chrome is
explicitly not built.

### Styling stays minimal and structural

Tailwind utilities only: the §3 flex-wrap room layout that stacks under ~780px with no media queries, a dark
surface roughly following the design's `bg` / `surface` / `border` values, and ≥44px touch targets on cards
and buttons. No token layer in `globals.css`, no Plus Jakarta Sans / JetBrains Mono — Stage 2 owns fidelity,
and this slice owns the flow.

## Risks / Trade-offs

- **The Acting-as control has no product equivalent and must be deleted at Stage 3.** → It is one component
  plus one `useState`, and the state it writes is a `RoundEntry`. Stage 3 replaces *who* sets an entry, not
  *what* the state is.
- **`design/spec.md` §6's suggested data model contradicts `RoundEntry`.** → The archived spec wins; the
  divergence is recorded above so a later reader does not "fix" it back.
- **`design/spec.md` §4.5 describes Overall stat tiles that the exported HTML does not contain.** → The
  product plan's MVP flow step 7 requires the Overall numbers, so they are rendered; their visual treatment
  (tiles, and the per-role histogram the export does show) is deferred to Stage 2. The precedence rule in
  `design/README.md` makes the product plan the tie-breaker.
- **A jsdom assertion for "no value is visible" could pass against the deck's own `5d` label.** → Hidden-value
  assertions are scoped to the participant list region by accessible role/name, never to the whole document.
- **Colocated component tests could drift into testing implementation.** → Every component test asserts text a
  user can read and interactions a user can perform; the round rules are tested in `round.test.ts` instead.

## Migration Plan

Not applicable: additive, no data, no deployment, no feature flag. The only replacement is the
`create-next-app` content of `app/page.tsx` and the `"Create Next App"` metadata in `app/layout.tsx`, both of
which are starter scaffolding rather than product code. Rollback is a revert of the change's commits.

## Open Questions

Neither of these changes the specs, the approach or the task breakdown:

- When Stage 2 introduces the real token layer, whether it lands in `globals.css` as CSS variables or as a
  Tailwind `@theme` block.
- Whether the seeded roster eventually becomes a shared fixture for Stage 3's multi-client tests, or is simply
  deleted when the join flow arrives.
