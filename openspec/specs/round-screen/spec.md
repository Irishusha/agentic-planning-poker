# round-screen Specification

## Purpose
Defines the local single-screen Planning Poker round a user drives in one browser: who is in the room, how a
choice is made for a voter, what stays hidden until Reveal, what the revealed results show overall and per
role, and what Reset returns the screen to.

## Requirements

### Requirement: The round opens with the configured task and roster

This requirement previously fixed the screen to one hard-coded task and a hard-coded roster of seven
participants, and forbade any edit control in any state. The task and the roster are now configured in setup
before the round starts, so the fixed-roster rule and the unconditional no-edit rule are replaced by the rules
below. Everything that still holds is kept: canonical role grouping, Observers outside the voting groups,
every voter starting Waiting, and no task editing — now scoped to the started round.

This revision narrows the no-edit rule once more. The round still fixes its task and its roster *in place*,
and while the cards are hidden it offers no route out at all. A **revealed** round may be left for setup,
which ends the round rather than editing it: the estimates are already shown, and the task and roster handed
back belong to the setup screen to change, not to the round.

The round SHALL show the task and the roster configured in setup. Voters SHALL be listed grouped by role in
the canonical role order QA, Backend, Frontend, Business Analyst, PM. A role group that holds no configured
participant SHALL NOT be shown, and the Observers group SHALL NOT be shown when no Observer is configured, so
the roster reflects the team that was configured rather than the five roles the product supports. Every
Observer SHALL be shown as an Observer rather than inside a role's voting group. Every voter SHALL start the
round Waiting. Once the round has started the task and the roster are fixed in place: the task SHALL be
displayed and MUST NOT be editable within the round, and the round SHALL offer no control to compose, edit or
replace the task in place, and no control to add, rename or remove a participant. Before the cards are
revealed the round SHALL additionally offer no control that returns to setup, so neither the task nor the
roster can be changed by any route while estimates are still hidden. Leaving a revealed round for setup SHALL
NOT count as in-round editing: it ends the round instead of altering it, and the round itself still offers no
way to change the task or the roster it is displaying.

#### Scenario: The room as it opens

- **WHEN** the round is started from the prefilled example roster, which is when the round screen opens
- **THEN** the task's title and description are displayed, and the roster shows the six voters — one QA, two
  Backend, one Frontend, one Business Analyst and one PM — each with the status `Waiting`, plus one
  participant with the status `Observer`
- **AND** the role groups appear in the order QA, Backend, Frontend, Business Analyst, PM
- **AND** the progress status reads `0 of 6 voted`

#### Scenario: The task cannot be edited

- **WHEN** the round has been started, in any of its states
- **THEN** no control to edit, compose, replace or clear the task in place is present, and no control to add,
  rename or remove a participant is present
- **AND** while the cards are still hidden no control returns to setup either, so before Reveal the task and
  the roster cannot be changed by any route

#### Scenario: A role nobody was configured for is not shown

- **WHEN** the roster is configured as `Serhii Bondar` as QA and `Dmytro Levchenko` as Backend only, and the
  round is started
- **THEN** the participant list shows the groups QA and Backend in that order, and shows no Frontend, Business
  Analyst, PM or Observers group
- **AND** the revealed results still show Overall and all five role rows, with Frontend, Business Analyst and
  PM each displaying `—` for Lowest, Average, Highest and Spread and `0` for Votes

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
revealable. Revealing SHALL switch the screen to its revealed state, and the control SHALL then be disabled
while remaining visible, so revealing a round that is already revealed is never available as a user action.
It SHALL become available again only after a reset, and then only once a voter has completed an action.

#### Scenario: Reveal is unavailable on an untouched round

- **WHEN** the room has just been opened and every voter is Waiting
- **THEN** the Reveal control is present and disabled

#### Scenario: One Away voter is enough to reveal

- **WHEN** the Away toggle is switched on for the acting PM voter and no other voter has acted
- **THEN** the Reveal control is enabled, although the progress status reads `1 of 6 voted`

#### Scenario: An unsure choice alone enables Reveal

- **WHEN** `?` is chosen for the acting Business Analyst voter and no other voter has acted
- **THEN** the Reveal control is enabled, although no numeric estimate has been given anywhere in the round

#### Scenario: Reveal is unavailable once the cards are shown

- **WHEN** `2d` is chosen for the acting QA voter, which enables the Reveal control, and the round is then
  revealed with it
- **THEN** the Reveal control is still present and is disabled, so it cannot be used a second time

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

- **WHEN** the PM voter Anna Kovalenko, who was the Acting-as selection when the round was revealed, is still
  the Acting-as selection after that reset, and `2d` is chosen for them without reselecting anyone
- **THEN** the PM voter's status is `Voted`, the progress status reads `1 of 6 voted` and the Reveal control
  is enabled

### Requirement: Next task leaves the revealed round for setup

The round SHALL offer a `Next task` control that ends the round and returns to the setup screen, so the same
team can estimate another task without rebuilding the roster.

`Next task` MUST NOT be present before Reveal — neither in a round where every voter is still Waiting nor in
a round where some voters have acted — so a round in progress has no route back to setup. It SHALL be present
and available once the round is revealed.

In the revealed state the Reveal control SHALL remain present and disabled, `Reset votes` SHALL remain present
and available as the secondary action, and `Next task` SHALL be the primary action. The two SHALL be
distinguishable by their names and by their prominence, not by position alone.

Using `Next task` SHALL leave the round: the estimate deck, the Away toggle, the Acting-as control, the
`N of M voted` progress status, the revealed results and the Reveal and `Reset votes` controls SHALL all be
absent afterwards.

`Next task` and `Reset votes` SHALL remain distinct actions. `Reset votes` SHALL keep the round on screen with
its task, its roster and its Acting-as selection, and MUST NOT return to setup.

#### Scenario: Next task is absent on an untouched round

- **WHEN** the round is started from the prefilled example roster, so the progress status reads `0 of 6 voted`
  and every voter is Waiting
- **THEN** no `Next task` control is present, and the Reveal control is present and disabled

#### Scenario: Next task is absent on a partly voted round that is still hidden

- **WHEN** `2d` is chosen for the acting QA voter `Serhii Bondar` and `?` for the Business Analyst voter
  `Iryna Marchenko`, so the progress status reads `2 of 6 voted`, and the round is not revealed
- **THEN** no `Next task` control is present, although the Reveal control is now enabled

#### Scenario: Next task appears once the cards are revealed

- **WHEN** the round is revealed with `Serhii Bondar` on `2d`, `Dmytro Levchenko` on `5d`, `Maksym Tkachuk` on
  `8d`, `Olena Shevchuk` on `3d`, `Iryna Marchenko` on `?` and `Anna Kovalenko` Away
- **THEN** the `Next task` control is present and available
- **AND** the Reveal control is present and disabled, and the `Reset votes` control is present and available

#### Scenario: Using Next task leaves the round

- **WHEN** the round above is revealed and `Next task` is used
- **THEN** no `N of M voted` progress status, no `5d` estimate card, no Away toggle, no Acting-as control, no
  Reveal control and no `Reset votes` control is present
- **AND** no Lowest, Average, Highest, Spread or Votes figure is displayed anywhere on the screen

#### Scenario: Reset votes does not return to setup

- **WHEN** the round above is revealed and `Reset votes` is used instead of `Next task`
- **THEN** the round is still on screen: the task title `PP-318 · Bulk import of candidates from CSV` is
  displayed, the progress status reads `0 of 6 voted` and the Acting-as selection is still `Anna Kovalenko`
- **AND** no task title field, no task description field and no `Start round` control is present
