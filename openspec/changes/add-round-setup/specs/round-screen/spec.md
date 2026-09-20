## RENAMED Requirements

The canonical title states the two rules this change retires — a fixed task and a seeded roster — so leaving
it in place would make the archived spec factually false. The rename carries the requirement to an accurate
title, and the MODIFIED block below references that new title, as the pinned CLI requires when a rename
exists.

- FROM: `### Requirement: The room opens on a fixed task and a seeded roster`
- TO: `### Requirement: The round opens with the configured task and roster`

## MODIFIED Requirements

### Requirement: The round opens with the configured task and roster

This requirement previously fixed the screen to one hard-coded task and a hard-coded roster of seven
participants, and forbade any edit control in any state. The task and the roster are now configured in setup
before the round starts, so the fixed-roster rule and the unconditional no-edit rule are replaced by the rules
below. Everything that still holds is kept: canonical role grouping, Observers outside the voting groups,
every voter starting Waiting, and no task editing — now scoped to the started round.

The round SHALL show the task and the roster configured in setup. Voters SHALL be listed grouped by role in
the canonical role order QA, Backend, Frontend, Business Analyst, PM. A role group that holds no configured
participant SHALL NOT be shown, and the Observers group SHALL NOT be shown when no Observer is configured, so
the roster reflects the team that was configured rather than the five roles the product supports. Every
Observer SHALL be shown as an Observer rather than inside a role's voting group. Every voter SHALL start the
round Waiting. Once the round has started the task and the roster are fixed: the task SHALL be displayed and
MUST NOT be editable, and the round SHALL offer no control to compose, edit or replace the task, and no
control to add, rename or remove a participant.

#### Scenario: The room as it opens

- **WHEN** the round is started from the prefilled example roster, which is when the round screen opens
- **THEN** the task's title and description are displayed, and the roster shows the six voters — one QA, two
  Backend, one Frontend, one Business Analyst and one PM — each with the status `Waiting`, plus one
  participant with the status `Observer`
- **AND** the role groups appear in the order QA, Backend, Frontend, Business Analyst, PM
- **AND** the progress status reads `0 of 6 voted`

#### Scenario: The task cannot be edited

- **WHEN** the round has been started, in any of its states
- **THEN** no control to edit, compose, replace or clear the task is present, and no control to add, rename or
  remove a participant is present

#### Scenario: A role nobody was configured for is not shown

- **WHEN** the roster is configured as `Serhii Bondar` as QA and `Dmytro Levchenko` as Backend only, and the
  round is started
- **THEN** the participant list shows the groups QA and Backend in that order, and shows no Frontend, Business
  Analyst, PM or Observers group
- **AND** the revealed results still show Overall and all five role rows, with Frontend, Business Analyst and
  PM each displaying `—` for Lowest, Average, Highest and Spread and `0` for Votes
