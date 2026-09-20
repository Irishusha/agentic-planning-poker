## Why

The round screen works, but it can only ever estimate one hard-coded task with one hard-coded roster. A team
cannot use it for their own task, and the per-role spread — the product's whole differentiator — is only ever
demonstrated on invented names. Letting the operator type a task and build a roster turns the demo into
something a real team can run, and it is the last piece Stage 1 owes before multi-user rooms.

This is also the first change that must **revise** a shipped capability rather than extend one: the canonical
`round-screen` spec currently mandates a fixed task and a seeded roster, and forbids any edit control.

## What Changes

- **A setup screen becomes the entry point.** Opening the application shows the task and roster editor,
  prefilled with the existing PP-318 demo task and seven-person roster. `Start round` hands the configured
  task and roster to the round screen, which behaves exactly as it does today.
- **The task becomes the operator's.** A required title and an optional description, replacing the module
  constant.
- **The roster becomes the operator's.** Add a participant, edit a name, choose QA, Backend, Frontend,
  Business Analyst, PM or Observer, and remove a participant — all before the round starts.
- **Validation gates the start.** Names are trimmed, must be non-empty and must be unique case-insensitively;
  at least one voter is required; Observers are optional and unlimited. `Start round` is unavailable while any
  error stands, and each error is shown as accessible text explaining why.
- **Empty role groups disappear from the sidebar.** A roster with no Frontend voter no longer shows an empty
  Frontend heading. The revealed results are untouched: Overall and all five role rows stay, and an
  unestimated role still reports unavailable measures with `0` votes.
- **The demo survives as the prefill**, so the round remains two clicks away and every existing round scenario
  stays meaningful.

Not in this change: returning to setup once a round has started, mid-round roster or task editing, late
joiners, persistence of any kind, rooms, invite links, the Create/Join landing screens, the estimation-scale
selector, "Attach ticket link", and everything already deferred to Stage 2 and Stage 3.

## Capabilities

### New Capabilities

- `round-setup`: the local setup screen — the prefilled example, the task fields, adding, editing, role
  selection and removal of participants, the validation rules that gate `Start round`, and what starting hands
  to the round.

### Modified Capabilities

- `round-screen`: the requirement **"The room opens on a fixed task and a seeded roster"** is replaced. It
  currently states that opening the application shows a fixed seven-person roster and that "the task is fixed
  for this screen: it SHALL be displayed and MUST NOT be editable, and the screen SHALL offer no control to
  compose, edit or replace it", with a scenario asserting no edit control exists "in any state". Both are now
  wrong: the task and roster come from setup, and an edit control exists — before the round starts. The
  replacement keeps every guarantee that still holds (grouping in canonical role order, Observers outside the
  voting groups, every voter starting Waiting, no editing **once the round has started**) and adds that role
  groups with no participants are not shown.

No other `round-screen` requirement changes. In particular "Reset returns the round to hidden" already
guarantees the task, the roster and the Acting-as selection survive a reset, and "Revealed per-role
statistics" already requires all five role rows with `—` and `0` for an unestimated role — this change relies
on both and restates neither. `estimation-statistics` and `round-state` are untouched: a draft participant
becomes an ordinary `waiting` or `observer` round entry, which those capabilities already define.

## Impact

- **New code**: `lib/estimation/roster.ts` (+ test) for draft-to-roster conversion and validation;
  `components/planning-poker/setup-screen.tsx`, `task-composer.tsx`, `roster-editor.tsx` (+ tests).
- **Changed code**: `components/planning-poker/room.tsx` gains a setup phase and builds its roster at start
  instead of reading a module constant; `participant-list.tsx` hides empty role groups;
  `seed-roster.ts` becomes the prefill rather than the roster itself.
- **Changed tests**: the 26 existing round tests keep their assertions verbatim behind a helper that starts
  the prefilled demo, so the entry point moves and nothing else does.
- **Unchanged**: `lib/estimation/deck.ts`, `round.ts`, `roles.ts`, `statistics.ts`, `duration.ts` and their
  tests; `app/page.tsx` stays composition-only; `app/layout.tsx` untouched.
- **Dependencies**: none added, removed or upgraded.
- **Design**: the task composer follows `design/spec.md` §4.3 closely, and each participant row reuses §4.1's
  name field, role select and observer choice. The roster editor itself has **no design source** — the design
  has people join themselves by link — so it is a local-demo substitute for the future Join flow, in the slot
  §4.3 gives the dashed "Waiting for the team" panel. It disappears at Stage 3, like the Acting-as control.
- **Still deferred**: the product plan's "late joiners can vote until reveal" invariant stays unimplemented,
  and freezing the roster at start makes that more visible.
