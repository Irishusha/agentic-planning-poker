## Context

See `proposal.md` — Why. The constraints that shape the approach:

- `room.tsx` holds five pieces of state: `draft`, `nextId`, `round`, `actingVoterId` and `revealed`. The
  phase is `round === null`, not a separate field. `handleStart` *reads* the draft to build the round; it
  never consumes, clears or overwrites it, so **the configured roster is already alive for the whole lifetime
  of a round**. Nothing has to be preserved — something has to stop being thrown away.
- Everything this change must discard lives in exactly two places: the `Round` object (`task` plus `roster`,
  which carries every estimate, `?` and Away state) and the `revealed` boolean. The statistics are not state
  at all — `statistics` is recomputed each render as `revealed ? calculateRoundStatistics(...) : null`.
- `vote-status.tsx` already owns the status line plus Reveal and Reset, and already branches on `revealed`.
- `round-screen`'s canonical requirement forbids the round to offer "no control to compose, edit or replace
  the task" in "any of its states", and `round-setup`'s "Starting hands the configured task and roster to the
  round" already fixes Acting-as to the first voter.
- `design/spec.md` §4.5 states "No round/next-task actions in v1", while its own behaviour rule 2 lists "go
  to the next task" among the host's permissions.
- 113 tests pass today, including two that pin `Reset votes` exactly as it is.

## Goals / Non-Goals

**Goals:**

- Add the transition without adding a domain function, a round-state field or a file.
- Keep `Reset votes` provably unchanged, and make the two actions distinguishable in the spec, in the DOM and
  on screen.
- Reconcile the canonical no-edit rule honestly rather than relying on a test regex that happens not to match.
- Hand focus somewhere useful, because the control that triggers the transition unmounts itself.

**Non-Goals** (beyond the proposal's exclusions):

- No round counter, task history or "previous task" affordance.
- No second client boundary, context, reducer or router phase.
- No test-only props or seams; the transition is driven exactly as a user drives it.

## Decisions

### Dropping the round *is* the discard

```
  round: { task, roster }            revealed: true
         |                                  |
         |  setRound(null)                  |  setRevealed(false)
         v                                  v
       null                              false

  estimates      ---+
  unsure choices    |
  Away states       +--> all live inside round.roster --> gone with the object
  revealed values ---+
  statistics        ---> derived per render from (revealed, round) --> gone with both
```

```ts
const handleNextTask = () => {
  setDraft((current) => ({ ...current, title: "", description: "" }));
  setRound(null);
  setRevealed(false);
};
```

No domain function is called and no field is cleared individually. `buildRoster` rebuilds an all-Waiting
roster from the drafts at the next `Start round`, which is the same path the first start takes, so the
"fresh hidden round" guarantee costs nothing.

*`setRevealed(false)` is technically redundant* — `revealed` is unreadable while `round === null`, and
`handleStart` already resets it. It is kept because a spec requirement says reveal state is discarded, and a
reviewer should be able to see that discard rather than reconstruct an argument about unreachable branches.
One line for legibility.

*Alternative considered:* extending `resetRound` to also clear the task. Rejected outright — it would violate
the product invariant "Reset clears every participant's active round state… The current task and the
participant list remain", and would collapse the two actions this change exists to keep apart.

### The draft is updated functionally, and `nextId` is not touched

`setDraft((current) => ({ ...current, title: "", description: "" }))`, never
`setDraft({ ...EXAMPLE_SETUP, title: "", description: "" })`. The second form is the obvious-looking one and
is wrong twice: it discards the roster the operator built, and it is the shape that invites resetting
`nextId` alongside it.

`nextId` must keep climbing. It seeds `p-<n>` ids, and `updateParticipant` matches participants by id inside
a `map`, so two drafts sharing an id would both be rewritten by a single edit, and React would see duplicate
`key`s. The spec expresses this observably rather than as an internal detail — "a participant added after the
return SHALL be a separate participant from every preserved one" — and the scenario that pins it renames one
and checks the other is untouched.

### `Next task` lives in `vote-status.tsx`, rendered only when revealed

```
  VoteStatus (revealed === false)        VoteStatus (revealed === true)
  +-----------------------------+        +-------------------------------------+
  | * N of M voted - hidden ... |        | Cards are revealed - reset to run   |
  |                             |        | this task again, or move on         |
  | (Reveal cards) [Reset votes]|        |                                     |
  +-----------------------------+        | (Reveal cards) [Reset votes] [Next] |
                                         |    disabled       ghost      accent |
                                         +-------------------------------------+
```

Not a new `next-task-button.tsx`: that is a component per button. Not `round-results.tsx`, which takes only
`statistics` and renders a table — putting a phase transition inside a results table mixes an action into a
presentation of numbers.

**Present only when revealed**, rather than present-and-disabled like Reveal. Reveal is always-present because
its own requirement mandates it; nothing mandates that here, and an always-present third button would put a
permanently disabled control in every pre-reveal state. Absence is also the stronger guarantee for "no return
to setup before Reveal" — a disabled control is still a control.

`Next task` takes the accent style and `Reset votes` stays ghost, because moving on is the more common next
step after a reveal. The accent slot is nominally Reveal's, but a disabled Reveal reads as inactive, so there
is no competition. The revealed status sentence changes from "Cards are revealed · reset to run the round
again" to name both actions, so the distinction is stated in text and does not rest on colour alone
(WCAG 1.4.1). No scenario and no test asserts that sentence today.

### Focus moves to the task title, via one presentation flag

The clicked button unmounts with the round. Without intervention focus falls to `<body>`: a keyboard user
lands at the top of the document and a screen-reader user gets no signal that the screen changed.

The title input is the right target — a title is required before anything else can happen, and it announces
its `sr-only` label "Task title" plus an empty value. The existing `aria-live="polite"` message list then
announces `Enter a task title` for free, so the return carries its own explanation.

Implementation: `room.tsx` holds one boolean, passed through `SetupScreen` to `TaskComposer` as the title
input's `autoFocus`. It is `false` at mount, so the application's entry point keeps its current no-focus
behaviour, and `true` only on a next-task return. `SetupScreen` mounts fresh on that return, so `autoFocus`
fires. This is the one piece of state this change adds, and it is presentation, not round state.

*Alternatives considered:* unconditional `autoFocus` — rejected, it would change the documented entry-point
behaviour. A `ref` plus `useEffect` in `SetupScreen` — equivalent behaviour for more machinery; it is the
fallback if `autoFocus` ever becomes lint-forbidden. Focusing the element imperatively from the click handler
— rejected, it reaches across a component boundary and would need a frame delay to survive the unmount.
`jsx-a11y/no-autofocus` was checked and is enabled nowhere in this repository's `eslint-config-next` setup,
so `autoFocus` will not be flagged.

### The `round-screen` requirement is scoped, not left to a lucky regex

The canonical scenario "The task cannot be edited" asserts, *in any of its states*, that "no control to edit,
compose, replace or clear the task is present". Its test queries `/edit|compose|clear task/i` — which
`Next task` does not match, and which never covered the word "replace" at all. **The suite would stay green
while the spec quietly became false.** That is exactly the drift `add-round-setup` refused to leave behind
when it renamed a requirement rather than let its title lie.

So the requirement is MODIFIED: the prohibition is scoped to editing the task and roster *in place while
remaining in the round*; leaving a revealed round for setup is stated not to be in-round editing; and the
scenario gains the guarantee that no control returns to setup before Reveal. All three existing scenario names
are preserved, which the validator independently enforces for a MODIFIED block.

*Alternative considered:* leaving it and reconciling only inside the new requirement. Rejected — it leaves a
canonical sentence the code contradicts, discoverable only by reading both requirements side by side.

### Capability split: the click is specified from both ends

`round-screen` owns the control — when it exists, what disappears when it is used, and how it differs from
`Reset votes`. `round-setup` owns the destination — what the returned-to setup holds, and what the next start
produces. This is the same split `add-round-setup` used for `Start round`, which is specified from each side
in both capabilities.

Neither delta restates `round-setup`'s "Starting hands the configured task and roster to the round" (which
already fixes Acting-as to the first voter) or `round-screen`'s "Reset returns the round to hidden" (which
already guarantees a reset preserves the task, the roster and the Acting-as selection). Both are relied on
and left alone.

### Departing from `design/spec.md` §4.5, deliberately

§4.5 says "No round/next-task actions in v1 — the host uses `Reset votes` in the voting state to run the
estimation again." Behaviour rule 2 in the same file lists "go to the next task" among the host's
permissions, so the design contradicts itself: the capability is in its rules and absent from its v1 screens.

`design/README.md` fixes the precedence — the product plan controls scope, and "where the two disagree, the
product plan wins and the spec's wording is stale, not a second opinion". `docs/product-plan.md` MVP step 8
covers moving to the next task, so §4.5 is the stale line and rule 2 is the live one.

The mechanism still differs from the plan's. Step 8 reaches the next task by *editing* the task in place plus
a reset; this round freezes its task, so returning to setup is the local equivalent of that edit. The outcome
the plan describes — same participants, new task, every round state gone — is exactly what is delivered. The
difference disappears at Stage 3 when in-place task editing arrives, alongside Acting-as and the roster
editor. This is the third local-demo affordance with no design source, after those two.

### The deferred question, answered

`add-round-setup` excluded "returning to setup once a round has started", and its design closed on: *"Whether
a later slice adds a 'Back to setup' control after a round, and if so whether it preserves votes."* The
answer is recorded here so the deferral reads as tracked rather than rediscovered: after Reveal only, and it
does not preserve votes.

## Risks / Trade-offs

- **A third button crowds the revealed action row, and there is no design source for it.** → The row already
  wraps (`flex-wrap`), every control keeps its 46px minimum height, and the three are distinguished by name
  and weight rather than by position. Compare against `room-revealed-host.png` before completion.
- **`revealed` stays `true` in state between `Next task` and the next `Start round` if the redundant setter is
  ever dropped.** → Unobservable today, but a representable meaningless state. The setter stays, and the
  reason is written above so a later reader does not "simplify" it away.
- **Third consecutive change centred on `room.tsx`'s phase logic.** → Accepted deliberately: it is the
  narrowest slice available, and touching zero files under `lib/estimation/` is itself the evidence that the
  domain boundary held.
- **A naive implementation "preserves" the roster by resetting to `EXAMPLE_SETUP`.** → Called out above and
  pinned by the "separate person" scenario; any task that writes `setNextId` is out of scope.
- **A new button could make an existing test selector ambiguous.** → Checked: `reset()` matches `/reset/i` and
  `revealButton()` matches `/reveal/i`; `Next task` matches neither, so no existing query becomes ambiguous.
- **`autoFocus` on a returning screen can surprise a user mid-scroll.** → The return replaces the whole
  screen, so there is no scroll position to preserve, and the focused field is the one the operator must fill
  in first.

## Migration Plan

Not applicable: no data, no deployment, no flag, no persisted state. The only behavioural change for an
existing user is that a revealed round now offers a third control.

## Open Questions

Neither changes the specs, the approach or the task breakdown:

- Whether a later slice keeps a list of the tasks estimated in one session, which would make a round counter
  meaningful — `design/spec.md` §5 rule 4 rules one out "in v1".
- Whether the returning setup should eventually offer the previous title as a placeholder, or a "same task
  again" shortcut, once real teams have used the flow.
