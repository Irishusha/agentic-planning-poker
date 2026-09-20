## Why

The round screen can estimate one task and then only repeat it. A team that finishes PP-318 and wants to
estimate PP-319 with the same six people must reload the page and retype the whole roster — seven names and
seven parts — which is exactly the work the setup screen was added to stop. Estimating a series of tasks in
one sitting is the ordinary way Planning Poker is used, and it is the last piece of the Stage 1 loop that is
missing.

This is a deferral the repository recorded, not a new idea. `add-round-setup` excluded "returning to setup
once a round has started" from its scope, and its design closed on the open question of *"whether a later
slice adds a 'Back to setup' control after a round, and if so whether it preserves votes."* This change
answers it: after Reveal only, and it does not preserve votes.

## What Changes

- **A `Next task` control appears once the round is revealed.** It is not rendered before Reveal — neither in
  an untouched round nor in a partially voted one — so there is no way back to setup while cards are still
  hidden.
- **Using it returns to setup with the team intact.** Participant names, order, roles and Observers survive
  exactly as configured, and the roster is editable again before the next round starts.
- **The task is cleared, not prefilled.** Title and description are both emptied, so the returning operator
  sees an empty task rather than the example task the application opens on. The existing `Enter a task title`
  message stands and `Start round` is unavailable until a non-blank title is entered.
- **Every round state is discarded.** Numeric estimates, `?`, Away, the reveal state and the calculated
  results all go; the next round is built from the configured drafts through the existing
  `validateSetup` / `buildTask` / `buildRoster` path, so every voter starts Waiting, the progress reads
  `0 of M voted`, Reveal is disabled and Acting-as is the first voter of the roster as it then stands.
- **`Reset votes` is unchanged and stays the other action.** It remains in the round, keeps the current task,
  roster and Acting-as selection, and clears only the active round state. The two are visibly distinct in the
  revealed action row: `Reveal cards` stays present and disabled, `Reset votes` stays the ghost action, and
  `Next task` is the accent action.
- **The round's no-edit rule is scoped rather than contradicted.** `round-screen` currently forbids any
  control that would "replace" the task "in any of its states"; that is narrowed to editing the task and
  roster *in place while staying in the round*, and leaving a revealed round for setup is stated not to be
  in-round editing.

Not in this change: returning to setup before Reveal, in-place task or roster editing inside the round, a
round counter or task history, carrying any vote across tasks, persistence, rooms, invite links,
authentication, realtime, and everything already deferred to Stage 2 and Stage 3.

## Capabilities

### New Capabilities

None. Both new requirements belong to capabilities that already exist.

### Modified Capabilities

- `round-screen`: one requirement MODIFIED and one ADDED.
  - **MODIFIED — "The round opens with the configured task and roster."** Its body forbids the round to
    "offer no control to compose, edit or replace the task", and its scenario "The task cannot be edited"
    asserts, *in any of its states*, that "no control to edit, compose, replace or clear the task is
    present". A `Next task` control in the revealed state reads as a control that replaces the task, so the
    rule is scoped to editing in place while remaining in the round, and the scenario gains the guarantee
    that no control returns to setup before Reveal. Every existing scenario is preserved.
  - **ADDED — "Next task leaves the revealed round for setup."** The control's visibility before and after
    Reveal, the phase transition itself, the disappearance of the round-only controls, and the behavioural
    distinction from `Reset votes`.
- `round-setup`: one requirement ADDED.
  - **ADDED — "Setup is re-entered for the next task with the same team."** The preserved roster, the cleared
    task, the validation that gates the next start, editing the roster before starting, and what the next
    start produces.

`round-state` and `estimation-statistics` are untouched. No voter-state rule changes — the next round's
participants are ordinary `waiting` and `observer` entries the existing capability already defines — and no
statistic is redefined: the second round's figures come from `calculateRoundStatistics` over a second roster,
which is the same rule applied to different input.

Two existing requirements are relied on and deliberately not restated. `round-setup`'s "Starting hands the
configured task and roster to the round" already fixes Acting-as to the first voter, which is what the next
start must do. `round-screen`'s "Reset returns the round to hidden" already guarantees the task, the roster
and the Acting-as selection survive a reset, which is the behaviour this change must leave alone.

## Impact

- **Changed code**: `components/planning-poker/room.tsx` gains one handler that clears the draft's task fields
  and drops the round; `vote-status.tsx` gains the control and the revealed status copy naming both actions;
  `setup-screen.tsx` and `task-composer.tsx` thread one optional presentation flag that focuses the task
  title input on the return.
- **New files**: none.
- **Unchanged**: all of `lib/estimation/` — `roster.ts`, `round.ts`, `statistics.ts`, `deck.ts`, `roles.ts`,
  `duration.ts` and their tests. The change computes nothing and reuses every existing domain function, so it
  cannot duplicate a validation or statistics rule. `seed-roster.ts`, `participant-list.tsx`,
  `round-results.tsx`, `roster-editor.tsx`, `estimate-deck.tsx`, `acting-as-select.tsx`, `task-card.tsx` and
  `app/**` are all untouched.
- **Changed tests**: new cases are added to `room.test.tsx` and `setup-screen.test.tsx`. No existing
  assertion changes — in particular both "Reset returns the round to hidden" tests and the 26 round
  assertions behind `renderRound()` must keep passing byte-identical.
- **Dependencies**: none added, removed or upgraded.
- **State**: `room.tsx` remains the only client state owner and the only `"use client"` file. No new round
  state field; the phase stays `round === null`. The `nextId` counter and `EXAMPLE_SETUP` are deliberately
  not reset, so participant ids stay unique across tasks and the application's entry point keeps its prefill.
- **Design**: `design/spec.md` §4.5 defers next-task actions to a later version while its own behaviour rule
  2 lists "go to the next task" among the host's permissions. `design/README.md` fixes the precedence — the
  product plan wins and the spec's wording is stale — and `docs/product-plan.md` MVP step 8 covers moving to
  the next task. The departure is deliberate and recorded in `design.md`.
- **Still deferred**: the product plan's "late joiners can vote until reveal" invariant stays unimplemented;
  this change widens the window in which the roster can be edited but still freezes it once a round starts.
