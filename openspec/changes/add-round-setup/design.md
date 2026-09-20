## Context

See `proposal.md` — Why. The constraints that shape the approach:

- `room.tsx` is today the only `"use client"` file and the only state owner. It initialises its roster from
  `SEED_ROSTER` and its Acting-as selection from `SEED_ROSTER.filter(isVoter)[0].id` at mount.
- 26 existing component tests each call `render(<Room />)` and then assert against the seven-person demo, and
  roughly twenty canonical `round-screen` scenarios are written against that same fixture (`0 of 6 voted`,
  Dmytro Levchenko, Kateryna H., …). Whatever this change does, those assertions must stay true.
- `participant-list.tsx` renders all five role groups plus Observers unconditionally. With a user-built roster
  that leaves roles empty, that would show empty headings.
- `lib/estimation/` owns pure domain logic with a colocated test per module; `round.ts` set the pattern of
  keeping rules out of components.
- `design/spec.md` §4.3 gives the task composer almost verbatim; §4.1 gives a participant's three fields. The
  design has **no** roster editor — people join themselves by link.

## Goals / Non-Goals

**Goals:**

- Make the task and roster the operator's, without changing one line of how a round behaves once started.
- Keep the demo two clicks away so the existing scenarios and tests stay meaningful.
- Keep validation and roster construction pure and unit-testable, out of components.
- Revise the canonical `round-screen` requirement honestly rather than contradicting it.

**Non-Goals** (beyond the proposal's scope exclusions):

- No second client boundary, context, reducer or form library.
- No generic form abstraction — this is one screen with two field kinds.
- No test-only props or seams; the setup is driven exactly as a user drives it.

## Decisions

### Setup is a phase of `room.tsx`, not a route

```
app/page.tsx  (Server Component, composition only — unchanged)
  └── room.tsx  "use client"  — still the ONE state owner
        phase        "setup" | "round"
        draft        { title, description, participants: ParticipantDraft[], nextId }
        roster       readonly Participant[]   <- set at Start, no longer from SEED_ROSTER
        actingVoterId                          <- set at Start (first voter)
        revealed                               <- unchanged
        ├── setup-screen.tsx      (phase === "setup")
        │     ├── task-composer.tsx     title + description        [design §4.3]
        │     └── roster-editor.tsx     rows + add + remove        [no design source]
        └── the existing round children  (phase === "round")   — untouched
```

A route (`/setup`) was considered and rejected: it would put round state above the router or duplicate it, and
the constraint is one client state owner. A phase field keeps everything in one place and makes `Start round`
an ordinary state transition.

`ParticipantDraft` carries `part: RoleKey | "observer"` rather than a separate `isObserver` boolean, so the
"Observer has no role" rule is a single value, not two fields that can disagree — the same reasoning that
shaped `RoundEntry`.

### Validation and conversion live in `lib/estimation/roster.ts`

```ts
type ParticipantDraft = { readonly id: string; readonly name: string; readonly part: RoleKey | "observer" };
type SetupDraft = { readonly title: string; readonly description: string; readonly participants: readonly ParticipantDraft[] };

type RoundTask = { readonly title: string; readonly description: string };

function validateSetup(draft: SetupDraft): readonly string[];   // ordered messages, empty = valid
function buildRoster(draft: SetupDraft): readonly Participant[]; // trims names, maps part -> entry
function buildTask(draft: SetupDraft): RoundTask;                // trims title and description
```

`buildTask` is a second small function rather than a field on `buildRoster`'s result, because the round already
takes its task and its roster as separate inputs and a combined `buildRound` would force both call sites to
destructure. Both normalise the same way — trim on the way out of setup — so the draft keeps exactly what the
operator typed while the round only ever sees trimmed values.

Pure, colocated test, no React — the pattern `round.ts` established. `validateSetup` returns the messages
themselves rather than error codes, because there is exactly one presentation of them and a code table would
be indirection with no second consumer. The order is fixed (title, then names, then uniqueness, then voters)
so the rendered list is deterministic and assertable.

*Alternative considered:* validating inside the component with `useMemo`. Rejected: the rules are product
rules, `docs/architecture.md` keeps calculation out of components, and a DOM test is a poor place to pin
"trimmed, case-insensitively unique".

### Deterministic ids from a counter

New drafts get `p-1`, `p-2`, … from a `nextId` counter in the draft state; the prefill uses the existing
`SEED_ROSTER` ids. Not `crypto.randomUUID()`: ids appear in test failures and in `key` props, and a counter
keeps runs reproducible without depending on jsdom's crypto surface.

### The prefill is the existing fixture, reused

`seed-roster.ts` stops being the roster and becomes `EXAMPLE_SETUP` — the same seven people and the same task,
expressed as drafts. One source, so the demo cannot drift from the fixture the canonical scenarios describe.

### Empty groups disappear from the sidebar, never from the results

`participant-list.tsx` filters to groups with at least one member, and hides the Observers group when there
are none. `round-results.tsx` is untouched: the canonical statistics rules require all five role rows, and an
unestimated role must still report `—` with `0` votes. The asymmetry is deliberate — the sidebar shows who is
in the room, the results table shows the product's fixed reporting shape.

### The 26 existing tests move their entry point and nothing else

A `renderRound()` helper renders `<Room />` and clicks `Start round`; each existing test swaps
`render(<Room />)` for it. Every assertion stays byte-identical, which is the evidence that the round's
behaviour did not change.

### The roster editor is a local-demo substitute for the Join flow

There is no design for one person adding others: `design/spec.md` §4.1 is "*your* name, *your* role", and
§4.3 fills the sidebar from people joining by link. The editor stands in for that flow on a single screen and
occupies the slot §4.3 gives the dashed "Waiting for the team" panel. It is the second local-only affordance
after Acting-as, and it disappears at Stage 3 together with it. The field shapes are still taken from the
design: a name input, a select, and Observer as a choice within that select rather than a separate toggle —
one control per participant instead of §4.1's two, because a per-row toggle card would dominate the list.

### The requirement is renamed, not left misleading

The canonical requirement's title — "The room opens on a fixed task and a seeded roster" — names the two rules
this change retires, so leaving it in place would archive a spec whose title contradicts its body. The delta
therefore carries both a `## RENAMED Requirements` block and a `## MODIFIED Requirements` block.

The pinned CLI supports that pair, verified in its own source rather than assumed:
`node_modules/@fission-ai/openspec/dist/core/specs-apply.js:266` states the application order —
`RENAMED → REMOVED → MODIFIED → ADDED` — so the rename lands before the modification, and `:178` *requires*
`MODIFIED` to reference the new header when a rename exists, throwing otherwise. The delta follows that
contract: `MODIFIED` is written under the new title, and every pre-existing scenario of the requirement is
preserved, which the validator independently enforces (it rejects a `MODIFIED` block that drops one, resolving
the lookup through the rename).

After archive the canonical requirement reads **"The round opens with the configured task and roster"**, with
its body describing the configured task and roster and the no-editing rule scoped to the started round.

## Risks / Trade-offs

- **Two scenario names in that requirement are now loose fits.** The validator requires a `MODIFIED` block to
  keep every existing scenario name, so "The room as it opens" now describes the round screen opening at
  Start. → Read that way it is still accurate, and the body says so explicitly.
- **A 26-test entry-point change could mask a real regression.** → The helper is the only edit; any assertion
  change in the same commit is a red flag for review.
- **`voters[0]` in `room.tsx` assumes a non-empty voter list.** → The "at least one voter" rule is what keeps
  it safe; the rule is enforced before `Start round` is available, and `buildRoster` is never called on an
  invalid draft.
- **Freezing the roster at Start makes the unimplemented "late joiners" invariant more visible.** → Recorded
  in the proposal as deferred to Stage 3, not silently dropped.
- **Validation messages are strings in the domain module.** → They are product copy with one consumer; if a
  second arrives, they become codes.

## Migration Plan

Not applicable: no data, no deployment, no flag. The only behavioural change for an existing user is that the
application now opens on setup instead of the round; `Start round` reaches the previous state.

## Open Questions

Neither changes the specs, the approach or the task breakdown:

- Whether a later slice adds a "Back to setup" control after a round, and if so whether it preserves votes.
- Whether the example prefill should eventually be replaceable by an empty setup for a returning user.
