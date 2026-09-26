# Planning Poker

[![CI](https://github.com/Irishusha/agentic-planning-poker/actions/workflows/ci.yml/badge.svg)](https://github.com/Irishusha/agentic-planning-poker/actions/workflows/ci.yml)

**Live demo: [agentic-planning-poker.vercel.app](https://agentic-planning-poker.vercel.app/)**

A team estimation tool where every participant carries a role — **QA**, **Backend**, **Frontend**,
**Business Analyst** or **PM** — and results are reported **per role as well as overall**.

## The problem it solves

In ordinary Planning Poker a task gets one number. That single number hides the most useful signal in the
room: when QA says three days and Backend says one, the team does not have an estimate, it has a
disagreement worth talking about. Averaging that away loses it.

This tool keeps the roles visible. Every revealed round reports Lowest, Average, Highest, Spread and Votes
for each role *and* for the team as a whole, so a spread between roles is the first thing you see rather
than something you have to reconstruct.

## What it does today

One screen, one browser, one operator driving the whole round:

```
  SETUP                                  ROUND                         REVEALED
  task title + description               acting-as: <voter>            Overall  2d 4.5d 8d 6d 4
  participants: name + role              4h 1d 2d 3d 5d 8d 10d 14d ?   QA       2d 2d 2d 0h 1
  add / rename / remove                  [coffee] Away                 Backend  5d 6.5d 8d 3d 2
  validation gates the start             "3 of 6 voted · cards stay    Frontend 3d 3d 3d 0h 1
                                          hidden until the host         Business Analyst — — — — 0
     |   Start round                      reveals"                      PM       — — — — 0
     |        |                                |  Reveal cards                    |
     |        +--------------------------------+--------------------------------->+
     |                                         ^                                  |
     |                                         |  Reset votes                     |
     |                                         |  same task, same team,           |
     |                                         +--- votes cleared ----------------+
     |                                                                            |
     +------------------------ Next task -----------------------------------------+
       same team preserved · title and description cleared · next round starts fresh
```

1. **Setup** — the app opens on a setup screen, prefilled with an example task and a seven-person roster.
   Edit the task title and description, add or remove participants, and give each one a role or make them an
   Observer.
2. **Configure and start** — names are trimmed, must be present and must be unique ignoring case, and at
   least one voter is required. `Start round` stays unavailable while any rule is unmet, and each unmet rule
   is shown as text explaining why.
3. **Vote** — pick whose deck is on screen, then choose an Hours card, `?`, or the ☕ Away toggle. A voter
   holds exactly one of those at a time: choosing a card clears Away, Away clears a card.
4. **Stay hidden** — before the reveal the participant list shows only `Waiting`, `Voted`, `Away` or
   `Observer`. A `?` reads as `Voted`, so it is as hidden as a number. The progress line shows `N of M voted`,
   with Observers outside both numbers.
5. **Reveal** — available as soon as one voter has acted; it does not wait for everyone, and it does not
   require a numeric estimate. Once shown, the control is disabled so a round cannot be revealed twice.
6. **Read the results** — Overall plus one row per role.
7. **Reset votes** — repeats the *same* task. It clears every vote and hides the results, keeping the task,
   the roster and the acting-voter selection, so the same estimate can be re-run immediately. It is available
   throughout the round.
8. **Next task** — estimates a *different* task with the same team. It appears only once the cards are
   revealed, so a round in progress has no way back to setup. Using it returns to the setup screen with the
   participants, their order, their roles and any Observers exactly as configured, while the task title and
   description are cleared and every vote, Away state and result is discarded. Focus lands in the task title
   field, and `Start round` stays unavailable until a new title is entered. The roster can be adjusted before
   starting, and the next round begins fresh: every voter Waiting, `0 of M voted`, Reveal disabled, and
   statistics computed from the new round's votes alone.

## Roles and the Hours deck

Roles: **QA · Backend · Frontend · Business Analyst · PM**. An **Observer** is a participation mode, not a
sixth role: an Observer sees everything, gets no deck and no Away toggle, and is excluded from the voter
total and from every statistic.

One scale ships — Hours. Labels are what a voter sees; the model calculates in hours:

| Card | `4h` | `1d` | `2d` | `3d` | `5d` | `8d` | `10d` | `14d` | `?` |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ----- | ----- | --- |
| Hours | 4 | 8 | 16 | 24 | 40 | 64 | 80 | 112 | — |

`?` is a real card meaning "I cannot size this" — it carries no numeric value.

## How the numbers are calculated

**Eligibility.** Only an active participant's numeric estimate counts. `?`, Away, Waiting and Observer
entries are excluded from every measure. A group with no eligible estimate reports an em dash for Lowest,
Average, Highest and Spread, and `0` for Votes — never `0h` and never a placeholder.

**Measures.** Every group — each role, and Overall — reports the same five: **Lowest**, **Average**,
**Highest**, **Spread** (Highest − Lowest) and **Votes**. Overall is a second view of the same estimates: it
is computed from all eligible estimates directly, never from the role averages, and no sum of estimates is
reported anywhere.

**Units.** All calculation happens in canonical hours, where one working day is 8 hours. Averages are kept
unrounded; conversion happens only for display. A value below 8 hours shows in hours (`6h`), 8 hours and
above in days (`4.5d`), rounded half-up to one decimal, and a trailing `.0` is never shown.

## Local-only

Everything runs in one browser tab in React state. There is no server, no database, no persistence and no
network traffic: reloading the page discards the configured task and roster. One operator drives every
participant from a single screen through an "Acting as" selector, which exists only because the round has to
be demonstrable on one device — it has no equivalent in the product being described.

The public [deployment](#deployment) does not change this: it serves the same single-browser app and adds no
persistence, no authentication, no shared rooms and no multi-client synchronisation.

## Future work

Not built, and deliberately out of scope for this stage:

- a real **Create / Join room** flow, so each participant enters their own name, role and participation mode;
- **room links** and room IDs, so a team joins by sharing a URL;
- **multi-client real-time synchronisation**, so participants vote from their own devices simultaneously;
- **persistence**, so a room and its history survive a reload;
- **authentication**, so participants are identified rather than typed in.

## Technology

TypeScript 5 (strict) · Next.js 16 App Router · React 19 · Tailwind CSS 4 · Vitest · React Testing Library ·
pnpm. No other runtime dependencies.

## Getting started

This project uses **pnpm**. A lockfile for another package manager will not be accepted.

Prerequisites:

- **Node.js 24.15.0**, as pinned in [`.nvmrc`](.nvmrc).
- **pnpm** at the version pinned by the `packageManager` field in [`package.json`](package.json).

```bash
pnpm install     # install dependencies
pnpm dev         # start the dev server
pnpm check       # the full quality gate
pnpm build       # production build
```

### What `pnpm check` runs

One command, five gates, in order:

| Step | Command | What it covers |
| --- | --- | --- |
| 1 | `pnpm typecheck` | `next typegen && tsc --noEmit` |
| 2 | `pnpm lint` | ESLint via `eslint-config-next` |
| 3 | `pnpm test` | the Vitest suite |
| 4 | `pnpm hooks:selftest` | the repository's own agent hooks still behave |
| 5 | `pnpm spec:check` | the OpenSpec tree is valid and consistent |

Step 5 is stricter than `openspec validate` alone: [`scripts/spec-check.mjs`](scripts/spec-check.mjs) also
fails on an empty spec tree, on an archived change with unfinished tasks, and on any bare `openspec` call in a
generated file.

## Continuous integration

A GitHub Actions workflow, [`.github/workflows/ci.yml`](.github/workflows/ci.yml), runs on every push to `main`
and every pull request targeting `main`. It installs dependencies with `pnpm install --frozen-lockfile`, then
runs `pnpm check` and `pnpm build` as separate steps. Node.js comes from `.nvmrc`, and pnpm comes from the
`packageManager` field in `package.json`. The workflow has read-only repository permissions and cancels a
superseded run on the same ref.

The first published run was a
[successful CI run](https://github.com/Irishusha/agentic-planning-poker/actions/runs/36240788635): it passed
dependency installation with the frozen lockfile, `pnpm check` and `pnpm build`.

## Deployment

The app is hosted on Vercel at <https://agentic-planning-poker.vercel.app/>. Every push to `main` creates a
new production deployment. The deployed app is the same local-only round described in
[Local-only](#local-only): it adds no persistence, authentication, shared rooms or multi-client
synchronisation.

## Tests

**128 tests across 9 files**, all passing.

| Area | Files | Tests |
| --- | --- | --- |
| Domain (`lib/estimation/`) | `deck` 3 · `duration` 10 · `roles` 1 · `round` 16 · `roster` 19 · `statistics` 13 | 62 |
| Components (`components/planning-poker/`) | `room` 33 · `setup-screen` 32 | 65 |
| Baseline | `lib/health` | 1 |

Domain tests are pure and need no DOM. Component tests drive the real UI through accessible roles and names —
no test-only props and no mocking of the domain.

## Specifications

Behaviour lives in [`openspec/specs/`](openspec/specs/) as four canonical capabilities:

| Capability | Requirements | Scenarios | Covers |
| --- | --- | --- | --- |
| [`estimation-statistics`](openspec/specs/estimation-statistics/spec.md) | 10 | 26 | eligibility, the five measures, per-role and Overall, duration formatting |
| [`round-state`](openspec/specs/round-state/spec.md) | 5 | 16 | the Hours deck, one active state per voter, the completed count, reset, purity |
| [`round-screen`](openspec/specs/round-screen/spec.md) | 11 | 30 | the round UI: hidden estimates, reveal, results, reset, next task |
| [`round-setup`](openspec/specs/round-setup/spec.md) | 10 | 33 | the setup screen: task, roster, validation, starting, re-entry for the next task |

Four completed changes are archived with their full history — proposal, design, delta specs and task record
— under [`openspec/changes/archive/`](openspec/changes/archive/):
`2026-09-20-add-estimate-statistics`, `2026-09-20-add-local-round-demo`, `2026-09-20-add-round-setup`,
`2026-09-20-add-next-task-flow`. There are **no active changes**.

## How this was built

The repository is also a record of an agent-assisted workflow: specifications written before code,
red-before-green tests, and an independent read-only reviewer that repeatedly found gaps a green test suite
had not.

- [`AGENTS.md`](AGENTS.md) — the working agreement every agent in this repository follows
- [`docs/product-plan.md`](docs/product-plan.md) — scope, MVP flow, product invariants, statistics rules
- [`docs/architecture.md`](docs/architecture.md) — code layout and implementation conventions
- [`docs/agent-harness.md`](docs/agent-harness.md) — the hooks, logging and skills installed here
- [`docs/capstone-evidence.md`](docs/capstone-evidence.md) — which practices are claimed, and the exact
  files and commits that evidence them
- [`openspec/specs/`](openspec/specs/) — the canonical behaviour specifications

## Scope and non-goals

**In scope:** a single-browser, local-only round on the Hours scale, with role-segmented statistics.

**Not in this repository:** no backend, database or persistence; no authentication; no rooms, room links or
multi-client real-time synchronisation; no import or export; no AI features; no Fibonacci or T-shirt scales.
The app is [deployed](#deployment) to Vercel as a public demo, and the quality gates described above run
locally and in [continuous integration](#continuous-integration).
