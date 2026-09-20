## 1. Declare the surfaces (no behaviour yet)

The red phase must fail on assertions about behaviour, not on a missing module, so every file and signature
exists before the tests, with deliberately unimplemented bodies.

`SEED_ROSTER` is the one exception to "no values yet", for the same reason `ROLE_KEYS` was in
`add-estimate-statistics`: it is fixture data the tests assert *against*, and an empty roster would leave the
screen with nothing to render, turning behavioural failures into empty-render noise.

- [ ] 1.1 Read the Client Components guidance in `node_modules/next/dist/docs/01-app` and note any Next 16 deviation from prior conventions that affects where `"use client"` goes or how a Server Component composes a client child; verify by naming the exact doc file(s) consulted in the task record before any React file is written.
- [ ] 1.2 Extend `lib/estimation/deck.ts` with the `DeckCard` union — `{ readonly label: string; readonly hours: DeckHours }` or `{ readonly label: "?" }` — and `export const MVP_DECK: readonly DeckCard[] = []` as a placeholder, leaving `DeckHours` exactly as it is; verify with `pnpm typecheck` (clean) and by confirming `DeckHours` is unchanged in `git diff`.
- [ ] 1.3 Create `lib/estimation/round.ts` exporting `Participant` (`{ readonly id: string; readonly name: string; readonly entry: RoundEntry }`), `Completed` (`{ readonly n: number; readonly m: number }`), and the unimplemented `chooseCard`, `chooseUnsure`, `toggleAway` and `resetRound` — each returning the roster it was given — plus `countCompleted` returning `{ n: 0, m: 0 }`; verify with `pnpm typecheck` (clean).
- [ ] 1.4 Create `components/planning-poker/seed-roster.ts` exporting the real seven-participant `SEED_ROSTER` from the design reference — QA Serhii Bondar, Backend Dmytro Levchenko, Backend Maksym Tkachuk, Frontend Olena Shevchuk, Business Analyst Iryna Marchenko, PM Anna Kovalenko, all `waiting`, plus the Observer Kateryna H. — with a header comment recording that it is demo-only and is replaced by the join flow at Stage 3; verify with `pnpm typecheck` (clean) and by confirming six entries carry a role and the Observer carries none.
- [ ] 1.5 Create the component shells under `components/planning-poker/` — `room.tsx` with `"use client"`, plus `task-card.tsx`, `acting-as-select.tsx`, `estimate-deck.tsx`, `vote-status.tsx`, `participant-list.tsx` and `round-results.tsx` — each exporting a typed component that renders an empty element and no product text; verify with `pnpm typecheck` and `pnpm lint` (both clean).

## 2. Round state — tests first (red)

Expected values are written independently from `docs/product-plan.md`, never produced by the code under test.

- [ ] 2.1 Write `lib/estimation/deck.test.ts` for "The MVP Hours deck is available at run time": assert the nine labels in order and the eight canonical hour values paired with them, and assert the `?` card exposes no hour value; verify by running `pnpm exec vitest run lib/estimation/deck.test.ts` and quoting the failing assertions.
- [ ] 2.2 Write `lib/estimation/round.test.ts` for "A voter holds exactly one active state" — one test per scenario: waiting voter picks `5d` → `40` hours; `8d` replaces `5d`; `2d` clears Away; `?` clears `3d`; Away clears `3d`; Away clears `?`; a choice aimed at the Observer changes nothing; verify by running `pnpm exec vitest run lib/estimation/round.test.ts` and quoting the failing assertions.
- [ ] 2.3 Add the completed-count tests to `lib/estimation/round.test.ts` for "The completed count for a round": six voters with two estimates, one `?`, one Away and two Waiting plus an Observer → `4` of `6`; all-Waiting → `0` of `6`; one Waiting voter with three Observers → `0` of `1`; verify by running the file and quoting the failures.
- [ ] 2.4 Add the reset test to `lib/estimation/round.test.ts` for "Resetting a round": the `qa 24h` / `backend ?` / `frontend away` / Observer roster returns four participants in the same order with the three voters Waiting and their roles intact, the Observer untouched, and a completed count of `0` of `3`; verify by running the file and quoting the failure.
- [ ] 2.5 Add the purity tests to `lib/estimation/round.test.ts` for "Round-state operations are pure": snapshot the roster as an independently written literal, assert it is deeply unchanged after `chooseCard`, assert the returned roster is a different object holding the new estimate, and assert two independent resets of the same roster are equal; verify by running the file and quoting the results.
- [ ] 2.6 Confirm the round-state red state is behavioural: `pnpm typecheck` passes and `pnpm exec vitest run lib/estimation` reports only `expected … received …` assertion diffs, with no module-not-found, "No test suite found", syntax or configuration error; verify by quoting one failing assertion line per failing file and the Vitest failure count.

## 3. Round state — implement (green)

- [ ] 3.1 Populate `MVP_DECK` with the nine cards in deck order, the eight numeric labels paired with `4`, `8`, `16`, `24`, `40`, `64`, `80` and `112` hours and the `?` card carrying no `hours` property, declared so the list and each card are read-only; verify `pnpm exec vitest run lib/estimation/deck.test.ts` passes in full.
- [ ] 3.2 Implement `chooseCard`, `chooseUnsure` and `toggleAway` in `lib/estimation/round.ts` by mapping the roster to a new array and replacing only the target voter's `entry` with the matching `RoundEntry` variant, carrying the existing role across and returning the roster unchanged when the target is an Observer or is not found; verify `pnpm exec vitest run lib/estimation/round.test.ts` shows the one-active-state tests passing.
- [ ] 3.3 Implement `countCompleted` — `m` counts entries that are not `observer`, `n` counts `estimate`, `unsure` and `away` — and `resetRound`, which maps every non-Observer entry to `{ kind: "waiting", role }` and leaves Observers and the roster's order untouched; verify `pnpm exec vitest run lib/estimation/round.test.ts` passes in full, purity tests included.
- [ ] 3.4 Confirm no round-state rule leaked into a component and no statistic was reimplemented here: `lib/estimation/round.ts` imports only `roles`, `deck` and the `RoundEntry` type, and contains no min, max, sum, average or formatting; verify by re-reading the file and `pnpm exec vitest run lib/estimation` passing in full.

## 4. Voting screen — tests first (red)

Tests drive the real UI — the Acting-as control, the card buttons and the Away toggle — with no test-only
props and no mocking of the domain. Hidden-value assertions are scoped to the participant list region, never
to the whole document, so the deck's own `5d` label cannot satisfy them.

- [ ] 4.1 Write `components/planning-poker/room.test.tsx` for "The room opens on a fixed task and a seeded roster": the task title and description render, the six voters show `Waiting` and the seventh shows `Observer`, the role groups appear in the order QA, Backend, Frontend, Business Analyst, PM, and the status reads `0 of 6 voted`; verify by running `pnpm exec vitest run components/planning-poker/room.test.tsx` and quoting the failing assertions.
- [ ] 4.2 Add the Acting-as tests for "The operator chooses which voter is acting": the control offers the six voters and not the Observer, and switching from Dmytro Levchenko to Olena Shevchuk after choosing `5d` leaves the status at `1 of 6 voted` with Dmytro Levchenko still `Voted`; verify by running the file and quoting the failures.
- [ ] 4.3 Add the one-active-state tests for "A voter's choice replaces the previous one": `5d` then `8d` shows `8d` as the acting voter's current choice and not `5d`; `3d` then Away leaves the PM voter `Away` with no card held and the status at `1 of 6 voted`; Away then `2d` shows `2d` held and the QA voter no longer `Away`; verify by running the file and quoting the failures.
- [ ] 4.4 Add the hidden-estimate test for "Estimates stay hidden until Reveal": after `5d` for Dmytro Levchenko and `?` for Serhii Bondar, the participant list shows `Voted` for both and neither `5d` nor `?` appears as a participant's value, and no Lowest, Average, Highest, Spread or Votes figure is on screen; verify by running the file and quoting the failure.
- [ ] 4.5 Add the progress test for "The progress status reports N of M": `2d` for QA, `?` for Business Analyst and Away for PM with the two Backend voters and the Frontend voter Waiting gives `3 of 6 voted`; verify by running the file and quoting the failure.
- [ ] 4.6 Add the reveal-enablement tests for "Reveal becomes available after the first completed action": the control is present and disabled on the untouched room, becomes enabled after Away alone is switched on for the PM voter while the status still reads `1 of 6 voted`, and becomes enabled after `?` alone is chosen for the Business Analyst voter with no numeric estimate anywhere in the round; verify by running the file and quoting the failures.
- [ ] 4.7 Confirm the voting-screen red state is behavioural: every failure is a missing-text, missing-element or wrong-value assertion from a rendered component, not a module-not-found, JSX syntax or jsdom configuration error; verify by quoting one failing assertion line per test and the Vitest failure count.

## 5. Voting screen — implement (green)

- [ ] 5.1 Implement `task-card.tsx` to render the fixed task's title and description as static text with no edit affordance, and define that task as a module constant beside `SEED_ROSTER`; verify the "room as it opens" and "task cannot be edited" tests pass.
- [ ] 5.2 Implement `acting-as-select.tsx` as a labelled native `<select>` listing only participants whose entry carries a role, reporting the chosen voter id upward and holding no state of its own; verify the two Acting-as tests pass.
- [ ] 5.3 Implement `estimate-deck.tsx` rendering `MVP_DECK` as buttons plus a separate Away toggle below the grid, marking the acting voter's current card as selected in a way that does not depend on colour alone, with each control at least 44px tall; verify the three one-active-state tests pass.
- [ ] 5.4 Implement `participant-list.tsx` grouping voters by `ROLE_KEYS` order under role headings with the Observer shown outside those groups, rendering only `Waiting`, `Voted`, `Away` or `Observer` while the round is hidden, inside a region with an accessible name the tests can scope to; verify the hidden-estimate test passes.
- [ ] 5.5 Implement `vote-status.tsx` rendering `N of M voted · cards stay hidden until the host reveals` from a supplied `Completed`, plus the Reveal button disabled while `n` is `0` and the Reset button; verify the progress and reveal-enablement tests pass.
- [ ] 5.6 Wire `room.tsx`: hold the roster, the acting voter id and `revealed` in `useState`, call the `round.ts` transitions from the handlers without computing anything in them, and pass `countCompleted(roster)` down; verify `pnpm exec vitest run components/planning-poker/room.test.tsx` passes in full.
- [ ] 5.7 Apply the minimal structural styling from `design/spec.md` §3 — the flex-wrap main column plus sidebar that stacks with no media queries, dark surfaces approximating the `bg` / `surface` / `border` tokens — using Tailwind utilities only, with no token layer and no font imports; verify by rendering the app and comparing the voting state against `design/screenshots/room-voting-host.png`, and by `pnpm lint` passing.

## 6. Revealed results — tests first (red)

The revealed fixture throughout: QA `2d` (`16h`), Backend `5d` (`40h`) and `8d` (`64h`), Frontend `3d`
(`24h`), Business Analyst `?`, PM Away, plus the Observer. Every expected figure below is written
independently from that fixture, not read back from `calculateRoundStatistics`.

- [ ] 6.1 Add the Overall test for "Revealed Overall statistics": after revealing the fixture, the Overall group displays Lowest `2d`, Average `4.5d`, Highest `8d`, Spread `6d` and Votes `4`; verify by running `pnpm exec vitest run components/planning-poker/room.test.tsx` and quoting the failing assertion.
- [ ] 6.2 Add the guard tests for the same requirement: the Overall Average is `4.5d` and `3.8d` — the unweighted mean of the `16`, `52` and `24` hour role averages — appears nowhere, and no sum of the estimates (`144` hours or `18d`) is displayed; verify by running the file and quoting the failures.
- [ ] 6.3 Add the per-role tests for "Revealed per-role statistics": the Backend row shows `5d` / `6.5d` / `8d` / `3d` and Votes `2`, the QA row shows `2d` / `2d` / `2d` / `0h` and Votes `1`, and the Business Analyst and PM rows are both present showing `—` for all four durations and `0` votes with no `0h` in their place; verify by running the file and quoting the failures.
- [ ] 6.4 Add the role-order test for the same requirement: exactly five role rows render in the order QA, Backend, Frontend, Business Analyst, PM; verify by running the file and quoting the failure.
- [ ] 6.5 Add the participant test for "Revealed participant values": the list shows `5d`, `8d`, `2d`, `3d`, `?`, `Away` and `Observer` against the right people; verify by running the file and quoting the failure.
- [ ] 6.6 Add the empty-reveal test for "Revealed Overall statistics": revealing with only `?` for the Business Analyst voter and Away for the PM voter — the other four Waiting, status `2 of 6 voted` — shows the Overall group displaying `—` for Lowest, Average, Highest and Spread with `0` Votes, and all five role rows present in the same unavailable state; verify by running the file and quoting the failing assertion.
- [ ] 6.7 Confirm the revealed red state is behavioural, with every failure an assertion about rendered text rather than a structural error; verify by quoting one failing assertion line per test and the Vitest failure count.

## 7. Revealed results — implement (green)

- [ ] 7.1 Compute the statistics in `room.tsx` above the returned JSX — `revealed ? calculateRoundStatistics(roster.map((p) => p.entry)) : null` — and pass the result down, with no calculation inside JSX, inside a handler or inside a child; verify by re-reading `room.tsx` and confirming no child imports `calculateRoundStatistics`.
- [ ] 7.2 Implement `round-results.tsx` rendering the Overall group and the five role rows from the supplied `RoundStatistics`, formatting each duration with `formatDuration` and rendering `—` for a `null` measure so `formatDuration` is never called with `null`, and rendering Votes as a plain count; verify the Overall, guard, per-role and role-order tests pass.
- [ ] 7.3 Extend `participant-list.tsx` with its revealed mode: a numeric estimate renders through `formatDuration`, `?` renders as `?`, Away renders as `Away`, Waiting renders as `Waiting`, and the Observer still renders as `Observer` with no value; verify the revealed-participant test passes.
- [ ] 7.4 Show the results in place of the deck once revealed, keeping the participant list visible; verify by rendering the app and comparing the revealed state against `design/screenshots/room-revealed-host.png`, accepting the deliberate absence of the histogram, consensus chip and timer.

## 8. Reset

- [ ] 8.1 Write the reset tests for "Reset returns the round to hidden": after revealing the fixture and using Reset, no Lowest, Average, Highest, Spread or Votes figure is displayed, all six voters read `Waiting`, the seventh reads `Observer`, the status reads `0 of 6 voted`, the task and the seven names and roles are unchanged and Reveal is disabled again; and with the QA voter still selected in the Acting-as control, choosing `2d` for them afterwards gives `1 of 6 voted` with Reveal enabled; verify by running the file and quoting the failing assertions.
- [ ] 8.2 Implement Reset in `room.tsx` by applying `resetRound` to the roster and setting `revealed` to `false`, leaving the Acting-as selection and the task untouched so the same voter stays selected; verify `pnpm exec vitest run components/planning-poker` passes in full.

## 9. Compose the page and verify the whole change

- [ ] 9.1 Replace the `create-next-app` body of `app/page.tsx` with composition of `<Room />` only — no markup logic, no state, no `"use client"` — and update the `app/layout.tsx` metadata title and description from "Create Next App" to the product's; verify `pnpm typecheck` and `pnpm lint` pass and `app/page.tsx` contains no `next/image` starter content.
- [ ] 9.2 Walk the flow once in the browser with `pnpm dev`: open `/`, vote for several participants including one `?` and one Away, confirm nothing is revealed early, Reveal, read the Overall and per-role numbers, Reset and run a second round; verify by recording the observed `N of M` values and the revealed Overall figures in the task record.
- [ ] 9.3 Confirm the change stayed in scope: `git status --short` and `git diff --stat` show only `lib/estimation/deck.ts`, `lib/estimation/round.ts`, `components/planning-poker/**`, `app/page.tsx`, `app/layout.tsx`, their tests and `openspec/changes/add-local-round-demo/**` — no new dependency, no config change, no edit to `roles.ts`, `statistics.ts`, `duration.ts` or their tests, and nothing imported from `design/`; note that if `next dev` re-adds its generated block to `AGENTS.md`, that file is committed with the work rather than reverted.
- [ ] 9.4 Re-read both delta specs and confirm every scenario has a matching passing test and that no behaviour was added that no scenario describes; verify by listing each scenario against its test name.
- [ ] 9.5 Run `pnpm check` and quote its summary/result.
