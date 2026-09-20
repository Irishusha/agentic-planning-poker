## MODIFIED Requirements

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

## ADDED Requirements

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
