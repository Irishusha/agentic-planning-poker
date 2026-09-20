## Why

The estimation domain is finished, tested and archived, but nothing renders it: `app/page.tsx` is still the
`create-next-app` template and `components/planning-poker/` does not exist yet. Stage 1 of the delivery plan
asks for "the full flow in one browser", and the fastest honest proof of the product's differentiator — a
spread between QA and Backend visible on a single task — is one local screen that drives
`calculateRoundStatistics` end to end. This change builds that screen and nothing else.

## What Changes

- **A runtime Hours deck.** `lib/estimation/deck.ts` currently exports the `DeckHours` type and no value, so a
  deck cannot be rendered. It gains `MVP_DECK`, the nine cards `4h · 1d · 2d · 3d · 5d · 8d · 10d · 14d · ?`
  with their canonical hours, alongside the unchanged `DeckHours` type.
- **Pure round-state transitions.** A new `lib/estimation/round.ts` owns choosing a card, choosing `?`,
  switching Away, resetting the round and counting `N of M`. The one-active-state invariant lives there, not in
  an event handler.
- **The first React surface.** `components/planning-poker/` is created: one client component owning the round
  state, plus presentational children for the task, the deck, the status row, the participant list and the
  results table.
- **The page becomes the product.** `app/page.tsx` drops the starter template and composes the room; the
  document metadata stops saying "Create Next App".
- **A seeded roster stands in for joining.** Seven fixed participants — six voters across the five roles plus
  one Observer — mirroring the design reference, so the round is interactive without a landing or join flow.
- **An operator-only "Acting as" control.** A single local screen has one pointer and six voters, so the
  operator selects whose deck is on screen. This has no product equivalent and exists only for the local demo.

Not in this change: the landing/create/join flow, the task composer, room IDs and invite links, authentication,
any backend, database, realtime or persistence, the revealed histogram and its markers, consensus badges, the
timer, avatars, import/export, AI, Playwright, and any new dependency.

## Capabilities

### New Capabilities

- `round-state`: the runtime Hours deck and the pure round-state rules — a voter's single active state, the
  transitions between card, `?`, Away and Waiting, reset, and the completed-count that excludes Observers from
  the denominator. Framework-free and colocated-tested, like the rest of `lib/estimation/`.
- `round-screen`: what a user sees and can do on the local single-screen round — the seeded roster, acting-as
  selection, the deck, estimates hidden until Reveal, when Reveal becomes available, the Overall and per-role
  result table, and Reset.

### Modified Capabilities

_None._ `estimation-statistics` is consumed exactly as archived: `round-screen` calls
`calculateRoundStatistics` and `formatDuration` and adds no statistic, no measure and no formatting rule of its
own. The two new capabilities deliberately carry no statistics requirements, so the canonical spec stays the
single source for them.

## Impact

- **New code**: `lib/estimation/round.ts` (+ test), `components/planning-poker/**` (+ tests).
- **Changed code**: `lib/estimation/deck.ts` (adds `MVP_DECK`, keeps `DeckHours`), `app/page.tsx`,
  `app/layout.tsx` (metadata only). `lib/estimation/deck.ts` is now touched by two capabilities — the type by
  `estimation-statistics`, the runtime list by `round-state`; capabilities describe behaviour, not file
  ownership.
- **Unchanged**: `lib/estimation/roles.ts`, `statistics.ts`, `duration.ts` and every existing test.
- **Dependencies**: none added, removed or upgraded. React Testing Library, jsdom and the `*.test.tsx` include
  pattern are already installed and configured but so far unused; this change is their first consumer.
- **Design**: `design/spec.md` §4.4 is the primary reference and §4.5 the second state; §4.3 is skipped because
  it exists only to host the excluded task composer. Nothing is copied from `design/planning-poker.html` or
  `design/support.js`.
- **Carried forward to Stage 3**: the "Acting as" control is the only piece with no product equivalent. Keeping
  each participant's state as a `RoundEntry` means the network stage replaces *who* sets an entry, not *what*
  the state is.
