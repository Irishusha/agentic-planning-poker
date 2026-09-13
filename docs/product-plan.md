# Planning Poker — product plan

What we are building, in what order, and what stays out. Scope and stack decisions only — for how agents work
in this repository see `AGENTS.md`, for the harness itself see `docs/agent-harness.md`.

## Product goal

A Planning Poker tool for team estimation where every participant carries a role — **QA**, **Backend** or
**Frontend**. The role is not decoration: results are reported per role as well as overall, so a spread
between QA and Backend on the same task is visible immediately and becomes the thing the team discusses.

## MVP flow

1. A facilitator creates a room.
2. A participant joins by link and enters a display name and a role.
3. The facilitator adds the current task.
4. Participants vote privately.
5. Votes stay hidden until reveal.
6. The facilitator reveals the results.
7. Results show min, max and average — overall and per role.
8. The facilitator resets the round for the next task.

That is the whole loop. Anything that does not serve it is out until the loop works end to end.

## Out of scope for the first MVP

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
| 1 | Tested domain model and a local room prototype — the full flow in one browser. |
| 2 | Polished UI built from the approved design. |
| 3 | Real-time multi-user rooms. |
| 4 | Playwright end-to-end coverage of the flow. |
| 5 | Optional integrations. |

Stages ship in order. Stage 1 owns the rules; later stages must not redefine them, only carry them across a
network boundary.

## Product invariants

These hold at every stage and are the first things a test should assert.

- Votes are hidden before reveal — no participant, including the facilitator, can see another vote early.
- One active vote per participant per round; a re-vote replaces the previous one rather than adding to it.
- Only the facilitator can reveal or reset.
- Statistics are calculated from revealed numeric votes — abstentions and non-numeric cards are excluded.
- The role breakdown never changes the overall result; it is a second view of the same votes.
