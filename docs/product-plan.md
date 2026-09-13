# Planning Poker — product plan

What we are building, in what order, and what stays out. Scope and stack decisions only — for how agents work
in this repository see `AGENTS.md`, for the harness itself see `docs/agent-harness.md`.

## Product goal

A Planning Poker tool for team estimation where every participant carries a role — **QA**, **Backend**,
**Frontend**, **Business Analysis** or **PM**. The role is not decoration: results are reported per role as
well as overall, so a spread between QA and Backend on the same task is visible immediately and becomes the
thing the team discusses.

## Participation modes

A role says *what a person does*; the participation mode says *whether they estimate*. Both are chosen on the
way into the room and are independent of each other.

- **Voter** — the default. Holds a role, gets the card deck and the Away toggle, and counts towards `M` in the
  round's `N of M` progress counter.
- **Observer** — chosen at join time. An observer sees the current task, the live `N of M` progress and the
  revealed results, but gets no deck at all: no numeric card, no `?`, no Away toggle. Observers never count
  towards `M`.

Observer is a mode, not a sixth role: an observing PM is still a PM, they simply do not estimate this round.

## Estimation scale

The first MVP ships **one scale: Hours**. A single deck keeps the domain model, the statistics and the tests
honest; alternative scales are a later, optional addition, not a Stage 1 concern.

The deck is exactly:

`4h · 1d · 2d · 3d · 5d · 8d · 10d · 14d · ?`

Labels are what a voter sees; the model calculates in hours:

| Card | `4h` | `1d` | `2d` | `3d` | `5d` | `8d` | `10d` | `14d` | `?` |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ----- | ----- | --- |
| Hours | 4 | 8 | 16 | 24 | 40 | 64 | 80 | 112 | — |

`?` is a card in the deck: the participant cannot size this task and needs more information. It carries no
numeric value.

## Away

**Away is not a card.** It is a separate *"Stepping out for coffee"* toggle that sits under the deck, outside
it. A participant is either holding a card or away, never both:

- Picking a numeric card or `?` clears Away.
- Switching Away on clears the active card.

So a voter always has exactly one active state. For the round counter and the statistics, `?` and Away behave
alike:

- Both mean the participant has finished their action — they count towards `N` in the `N of M` progress
  counter, and a round where everyone picked `?` or went away is complete and can be revealed.
- Both are excluded from min, max, average and spread, overall and per role.

Away belongs to the round, not to the person. A reset clears it exactly like a card: every voting participant
starts the new round in **Waiting** — no numeric vote, no `?`, no Away — and someone who is still at the
coffee machine switches Away back on. Nothing about a participant's round state carries over; the current task
and the participant list do, and observers stay observers, still outside `M`.

## MVP flow

1. A facilitator creates a room.
2. A participant joins by link and enters a display name, a role and a participation mode — voter or observer.
3. The facilitator adds the current task.
4. Voting participants vote privately with the Hours deck — a numeric card or `?` — or switch on Away
   instead.
5. Votes stay hidden until reveal.
6. The facilitator reveals the results.
7. Results show min, max and average over the revealed numeric votes — overall and per role.
8. The facilitator resets the round for the next task; the task and the participants stay, every round state —
   votes, `?` and Away — does not.

That is the whole loop. Anything that does not serve it is out until the loop works end to end.

## Out of scope for the first MVP

- Fibonacci scale.
- T-shirt size scale.
- Authentication.
- Jira integration.
- Persistent project history.
- AI features.
- Multiple simultaneous tasks — one active task per room.

## Technology decisions

Already in `package.json`: TypeScript 5, Next.js 16 App Router with React 19, Tailwind CSS 4, pnpm.

- **State:** React state and context. No Redux — the state is one room, and context keeps it inspectable.
- **Unit tests:** Vitest + React Testing Library, added *before* the product logic they cover, not after.
- **End-to-end:** Playwright, added once the first complete user flow exists and is stable.
- **Validation:** Zod, introduced when real API boundaries appear — not for in-process function arguments.
- **Persistence:** a local single-browser prototype first; Supabase/PostgreSQL with Realtime only when the
  multi-user stage starts.

None of the tools above except the current four are installed yet. Each arrives at the stage that needs it,
as a deliberate, separately agreed addition (`AGENTS.md` §7).

## Delivery stages

| Stage | Deliverable |
| ----- | ----------- |
| 1 | Tested domain model and a local room prototype — the full flow in one browser, Hours scale only. |
| 2 | Polished UI built from the approved design. |
| 3 | Real-time multi-user rooms. |
| 4 | Playwright end-to-end coverage of the flow. |
| 5 | Optional: additional scales — Fibonacci and T-shirt sizes. |
| 6 | Optional integrations. |

Stages ship in order. Stage 1 owns the rules; later stages must not redefine them, only carry them across a
network boundary or add a deck behind them.

## Product invariants

These hold at every stage and are the first things a test should assert.

- Votes are hidden from everyone, including the facilitator, until reveal.
- Only the facilitator can edit the task, reveal and reset.
- One active state per voting participant per round — a single card or Away, never both, never two cards. A
  new choice replaces the previous one rather than adding to it.
- Observers have no deck and no Away toggle, and are excluded from `M` in the `N of M` counter.
- Statistics are calculated from revealed numeric votes only — `?` and Away complete a participant's action
  for `N of M` but never feed min, max, average or spread.
- The role breakdown never changes the overall result; it is a second view of the same votes.
- Reset clears every participant's active round state — numeric vote, `?` and Away alike — and hides the cards
  again. The current task and the participant list remain, every voting participant starts the new round in
  Waiting, and observers remain observers, still excluded from `M`.
- Late joiners can vote until reveal.
