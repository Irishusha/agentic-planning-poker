## Purpose

Defines the local single-screen Planning Poker round a user drives in one browser: who is in the room, how a
choice is made for a voter, what stays hidden until Reveal, what the revealed results show overall and per
role, and what Reset returns the screen to.

## ADDED Requirements

### Requirement: The room opens on a fixed task and a seeded roster

Opening the application SHALL show one task and a roster of seven participants: one QA voter, two Backend
voters, one Frontend voter, one Business Analyst voter, one PM voter and one Observer, each with a display
name. Voters SHALL be listed grouped by role in the canonical role order QA, Backend, Frontend, Business
Analyst, PM, and the Observer SHALL be shown as an Observer rather than inside a role's voting group. Every
voter SHALL start the round Waiting. The task is fixed for this screen: it SHALL be displayed and MUST NOT be
editable, and the screen SHALL offer no control to compose, edit or replace it.

#### Scenario: The room as it opens

- **WHEN** the application is opened at the root route
- **THEN** the task's title and description are displayed, and the roster shows the six voters — one QA, two
  Backend, one Frontend, one Business Analyst and one PM — each with the status `Waiting`, plus one
  participant with the status `Observer`
- **AND** the role groups appear in the order QA, Backend, Frontend, Business Analyst, PM
- **AND** the progress status reads `0 of 6 voted`

#### Scenario: The task cannot be edited

- **WHEN** the room is open in any state
- **THEN** no control to edit, compose, replace or clear the task is present

### Requirement: The operator chooses which voter is acting

The screen SHALL provide an Acting-as control that selects exactly one voter at a time, and the deck and the
Away toggle SHALL apply to that selected voter. The control SHALL offer every voter and MUST NOT offer the
Observer, because an Observer has no deck and no Away toggle. Selecting a different voter SHALL change no
participant's round state.

#### Scenario: The Observer cannot be selected

- **WHEN** the Acting-as control's options are read on the opened room
- **THEN** the six voters are offered and the Observer is not among them

#### Scenario: Switching the acting voter changes no state

- **WHEN** `5d` is chosen while the Backend voter Dmytro Levchenko is acting, and the acting voter is then
  switched to the Frontend voter Olena Shevchuk
- **THEN** the progress status still reads `1 of 6 voted` and Dmytro Levchenko's status is still `Voted`

### Requirement: A voter's choice replaces the previous one

For the acting voter the screen SHALL offer the nine Hours deck cards `4h`, `1d`, `2d`, `3d`, `5d`, `8d`,
`10d`, `14d` and `?`, and a separate Away toggle that sits outside the deck. Choosing SHALL replace the acting
voter's previous state: a numeric card SHALL clear `?` and Away, `?` SHALL clear a numeric card and Away, and
Away SHALL clear a numeric card and `?`. The Away control is a toggle: switching it off for an Away voter
SHALL return them to `Waiting` and SHALL reduce the completed count accordingly. The screen SHALL show which
card the acting voter currently holds and whether Away is on, so the operator can see their own choice, and
that indication is the acting voter's own state, not another participant's revealed value.

#### Scenario: A numeric card replaces an earlier one

- **WHEN** `5d` and then `8d` are chosen for the acting Backend voter
- **THEN** `8d` is shown as that voter's current choice, `5d` is not, and the progress status reads
  `1 of 6 voted`

#### Scenario: Away clears the chosen card

- **WHEN** `3d` is chosen for the acting PM voter and the Away toggle is then switched on
- **THEN** the PM voter's status is `Away`, no card is shown as their current choice, and the progress status
  still reads `1 of 6 voted`

#### Scenario: A card clears Away

- **WHEN** the Away toggle is switched on for the acting QA voter and `2d` is then chosen
- **THEN** `2d` is shown as that voter's current choice and their status is no longer `Away`

#### Scenario: Switching Away off returns the voter to Waiting

- **WHEN** the Away toggle is switched on and then off again for the acting QA voter
- **THEN** that voter's status is `Waiting`, no card is shown as their current choice, and the progress status
  reads `0 of 6 voted`

### Requirement: Estimates stay hidden until Reveal

Before Reveal the participant list SHALL show only a status for each participant — `Waiting`, `Voted`, `Away`
or `Observer` — and MUST NOT show any voter's chosen card label, hour value or `?`. A voter who chose `?`
SHALL read as `Voted`, so `?` is as hidden as a number. No overall or per-role statistic SHALL be shown before
Reveal.

#### Scenario: Chosen values are absent from the participant list

- **WHEN** `5d` is chosen for the Backend voter Dmytro Levchenko and `?` is chosen for the QA voter Serhii
  Bondar, and the round is not revealed
- **THEN** the participant list shows `Voted` for Dmytro Levchenko and `Voted` for Serhii Bondar, and shows
  neither `5d` nor `?` as either participant's value
- **AND** no Lowest, Average, Highest, Spread or Votes figure is displayed anywhere on the screen

### Requirement: The progress status reports N of M

The screen SHALL display how many voters have completed their action as `N of M voted`, alongside the
statement that cards stay hidden until they are revealed. A numeric estimate, `?` and Away SHALL each count
towards `N`; a Waiting voter SHALL NOT. The Observer MUST NOT be counted towards `M`.

#### Scenario: Unsure and Away count as completed

- **WHEN** `2d` is chosen for the QA voter, `?` for the Business Analyst voter and Away for the PM voter,
  leaving the two Backend voters and the Frontend voter Waiting
- **THEN** the progress status reads `3 of 6 voted`, so the Observer is absent from both numbers

### Requirement: Reveal becomes available after the first completed action

The Reveal control SHALL be present at all times and SHALL be disabled while every voter is Waiting. It SHALL
become enabled as soon as at least one voter holds a numeric estimate, `?` or Away — any one of the three
completes a voter's action — and MUST NOT require every voter to have acted. Reveal MUST NOT require an
eligible numeric estimate either: a round whose only completed actions are `?` or Away SHALL still be
revealable. Revealing SHALL switch the screen to its revealed state.

#### Scenario: Reveal is unavailable on an untouched round

- **WHEN** the room has just been opened and every voter is Waiting
- **THEN** the Reveal control is present and disabled

#### Scenario: One Away voter is enough to reveal

- **WHEN** the Away toggle is switched on for the acting PM voter and no other voter has acted
- **THEN** the Reveal control is enabled, although the progress status reads `1 of 6 voted`

#### Scenario: An unsure choice alone enables Reveal

- **WHEN** `?` is chosen for the acting Business Analyst voter and no other voter has acted
- **THEN** the Reveal control is enabled, although no numeric estimate has been given anywhere in the round

### Requirement: Revealed Overall statistics

On Reveal the screen SHALL display an Overall group reporting Lowest, Average, Highest, Spread and Votes over
the round's eligible numeric estimates. The four durations SHALL be displayed through the product's canonical
duration convention and Votes SHALL be displayed as a plain count. Overall SHALL be a second view of the same
estimates: it MUST NOT be derived from the per-role figures, and MUST NOT be reported as a sum. A `?`, Away,
Waiting or Observer entry SHALL contribute to none of the five measures. When no estimate is eligible, the
Overall group SHALL display an unavailable measure for Lowest, Average, Highest and Spread and `0` for Votes,
exactly as an empty role group does.

#### Scenario: Overall over a mixed round

- **WHEN** the round is revealed with the QA voter on `2d` (`16` hours), the Backend voters on `5d` (`40`
  hours) and `8d` (`64` hours), the Frontend voter on `3d` (`24` hours), the Business Analyst voter on `?` and
  the PM voter Away
- **THEN** the Overall group reports Lowest `16` hours, Average `36` hours, Highest `64` hours, Spread `48`
  hours and Votes `4`, over exactly the estimates `16`, `40`, `64` and `24` hours
- **AND** those figures are displayed as Lowest `2d`, Average `4.5d`, Highest `8d`, Spread `6d` and Votes `4`

#### Scenario: Overall is not the mean of the role averages

- **WHEN** the round above is revealed, in which QA averages `16` hours, Backend averages `52` hours and
  Frontend averages `24` hours
- **THEN** the Overall Average is displayed as `4.5d` and MUST NOT be displayed as `3.8d`, the `92/3`-hour
  unweighted mean of those three role averages

#### Scenario: No sum is displayed

- **WHEN** the round above is revealed
- **THEN** no total or sum of the participants' estimates — `144` hours or `18d` — is displayed anywhere

#### Scenario: Revealing a round with no eligible estimate

- **WHEN** the round is revealed with the Business Analyst voter on `?`, the PM voter Away and the other four
  voters Waiting, so the progress status reads `2 of 6 voted`
- **THEN** the Overall group displays `—` for Lowest, Average, Highest and Spread and `0` for Votes
- **AND** all five role rows are present, each displaying `—` for those four measures and `0` for Votes

### Requirement: Revealed per-role statistics

On Reveal the screen SHALL display one row for each of the five supported roles, in the canonical role order
QA, Backend, Frontend, Business Analyst, PM, each reporting that role's own Lowest, Average, Highest, Spread
and Votes over that role's eligible numeric estimates only. A role with no eligible estimate SHALL remain
visible and SHALL display an em dash `—` for Lowest, Average, Highest and Spread and `0` for Votes; it MUST
NOT display `0h` or any other placeholder number in place of an unavailable measure.

#### Scenario: A role with two estimates

- **WHEN** the round above is revealed
- **THEN** the Backend row reports Lowest `40` hours, Average `52` hours, Highest `64` hours, Spread `24`
  hours and Votes `2`, displayed as `5d`, `6.5d`, `8d`, `3d` and `2`

#### Scenario: A role with one estimate

- **WHEN** the round above is revealed
- **THEN** the QA row reports Lowest, Average and Highest of `16` hours and Spread `0` hours, displayed as
  `2d`, `2d`, `2d` and `0h`, with Votes `1`

#### Scenario: Roles whose only entries are excluded

- **WHEN** the round above is revealed, in which the Business Analyst voter chose `?` and the PM voter is Away
- **THEN** the Business Analyst row and the PM row are both present, each displaying `—` for Lowest, Average,
  Highest and Spread, and `0` for Votes

### Requirement: Revealed participant values

On Reveal each voter's own choice SHALL become visible in the participant list: a numeric estimate SHALL be
shown through the canonical duration convention, a `?` choice SHALL be shown as `?`, an Away voter SHALL be
shown as `Away` and a Waiting voter SHALL be shown as `Waiting`. The Observer SHALL still be shown as an
Observer and SHALL carry no value.

#### Scenario: Each participant's revealed state

- **WHEN** the round above is revealed
- **THEN** the participant list shows `5d` for the Backend voter Dmytro Levchenko, `8d` for the Backend voter
  Maksym Tkachuk, `2d` for the QA voter, `3d` for the Frontend voter, `?` for the Business Analyst voter,
  `Away` for the PM voter and `Observer` for Kateryna H.

### Requirement: Reset returns the round to hidden

The Reset control SHALL return the screen to its pre-reveal state: the Overall group and the per-role rows
SHALL disappear, every voter SHALL return to `Waiting`, and the deck SHALL be shown again with no card held.
The task and the roster — membership, names, roles and the Observer — SHALL be unchanged, so another round can
be run immediately without reloading the page. The Acting-as selection SHALL survive the reset: the same voter
stays selected, so the operator can start the next round without reselecting.

#### Scenario: Resetting after a reveal

- **WHEN** the round above is revealed and Reset is then used
- **THEN** no Lowest, Average, Highest, Spread or Votes figure is displayed, the participant list shows
  `Waiting` for all six voters and `Observer` for the seventh, and the progress status reads `0 of 6 voted`
- **AND** the task and the seven participants' names and roles are unchanged, and the Reveal control is
  disabled again

#### Scenario: The round is immediately repeatable

- **WHEN** the QA voter is still the Acting-as selection after that reset, and `2d` is chosen for them
- **THEN** the progress status reads `1 of 6 voted` and the Reveal control is enabled
