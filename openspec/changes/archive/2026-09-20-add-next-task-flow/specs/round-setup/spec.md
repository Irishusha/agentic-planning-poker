## ADDED Requirements

### Requirement: Setup is re-entered for the next task with the same team

Returning to setup from a revealed round SHALL show the setup screen carrying the roster exactly as it was
last configured: the same participants, in the same order, with the same names and the same parts, Observers
included. The roster is the team, and the team does not change because the task did.

The task SHALL be cleared. The title and the description SHALL both be empty — not restored to the example
task the application opens on, and not left holding the task just estimated. Because the title is empty, the
message `Enter a task title` SHALL be shown and the `Start round` control SHALL be unavailable until a title
that is non-blank once trimmed is entered.

Keyboard focus SHALL be placed in the task title field when that setup screen is shown. The control the
operator activated is gone with the round, so focus would otherwise be lost, and the title is the one field
that must be filled before the next round can start.

The preserved roster SHALL be editable again before the next round starts: a participant MAY be added,
renamed, given a different part or removed, under exactly the same validation rules that gate any other
start. A participant added after the return SHALL be a separate participant from every preserved one, so
editing either leaves the other unchanged.

Starting the next round SHALL produce a fresh hidden round that carries nothing from the previous one: every
voter SHALL be Waiting, the progress status SHALL report `0` completed out of the current voter total, no
Lowest, Average, Highest, Spread or Votes figure SHALL be displayed, the Reveal control SHALL be disabled,
and the Acting-as selection SHALL be the first voter of the roster as it stands at that moment. The next
round's statistics SHALL be calculated from the next round's estimates alone.

#### Scenario: The team survives and the task is cleared

- **WHEN** the prefilled example round is started, revealed with `Serhii Bondar` on `2d` and `Anna Kovalenko`
  Away, and `Next task` is used
- **THEN** the setup screen lists the same seven participants in the same order — `Serhii Bondar` as QA,
  `Dmytro Levchenko` as Backend, `Maksym Tkachuk` as Backend, `Olena Shevchuk` as Frontend, `Iryna Marchenko`
  as Business Analyst, `Anna Kovalenko` as PM and `Kateryna H.` as Observer
- **AND** the task title field and the task description field are both empty, holding neither
  `PP-318 · Bulk import of candidates from CSV` nor the example description
- **AND** the message `Enter a task title` is shown and the `Start round` control is unavailable

#### Scenario: Focus moves to the next task title

- **WHEN** the prefilled example round is revealed with `Serhii Bondar` on `2d` and `Anna Kovalenko` Away, and
  the operator activates `Next task`
- **THEN** the setup screen is shown and keyboard focus is in the `Task title` field, which is empty, so the
  next task's title can be typed without first clicking into it

#### Scenario: A new title alone re-enables the start

- **WHEN** the title is typed as `PP-319 Duplicate candidate merge` after that return, with the description
  left empty
- **THEN** no error message is shown and the `Start round` control is available

#### Scenario: The preserved roster may be adjusted before starting

- **WHEN** after that return `Maksym Tkachuk` is removed, `Olena Shevchuk` is changed from Frontend to
  Observer, the title is typed as `PP-319 Duplicate candidate merge`, and the round is started
- **THEN** the progress status reads `0 of 4 voted`, `Olena Shevchuk` is shown with the status `Observer`, and
  `Maksym Tkachuk` appears nowhere

#### Scenario: The next round carries nothing from the previous one

- **WHEN** the example round is revealed with `Serhii Bondar` on `2d`, `Dmytro Levchenko` on `5d`,
  `Iryna Marchenko` on `?` and `Anna Kovalenko` Away, `Next task` is used, the title is typed as
  `PP-319 Duplicate candidate merge` and the round is started
- **THEN** all six voters show the status `Waiting`, the progress status reads `0 of 6 voted`, no Lowest,
  Average, Highest, Spread or Votes figure is displayed, and the Reveal control is present and disabled
- **AND** the round displays the title `PP-319 Duplicate candidate merge`, and neither
  `PP-318 · Bulk import of candidates from CSV` nor `2d`, `5d`, `?` or `Away` appears as any participant's
  value

#### Scenario: Acting-as follows the roster as it now stands

- **WHEN** after that return `Serhii Bondar` is removed, the title is typed as
  `PP-319 Duplicate candidate merge`, and the round is started
- **THEN** the Acting-as selection is `Dmytro Levchenko`, the first voter of the roster as it now stands, and
  `Serhii Bondar` is offered nowhere

#### Scenario: A participant added after the return is a separate person

- **WHEN** `Ivan Petrenko` is added as Frontend before the first round, that round is started and revealed,
  `Next task` is used, and a further participant is then added and named `Yulia Popova`
- **THEN** the roster holds nine participants, `Ivan Petrenko` is still named `Ivan Petrenko` with the part
  Frontend, and `Yulia Popova` is a separate participant whose name was not written over anyone else's

#### Scenario: The next round's results are its own

- **WHEN** the example round is revealed with `Serhii Bondar` on `2d` (`16` hours) and `Dmytro Levchenko` on
  `8d` (`64` hours), `Next task` is used, the title is typed as `PP-319 Duplicate candidate merge`, the next
  round is started with the same roster, `Serhii Bondar` chooses `3d` (`24` hours), `Olena Shevchuk` chooses
  `5d` (`40` hours), and that round is revealed
- **THEN** the Overall group reports Lowest `24` hours, Average `32` hours, Highest `40` hours, Spread `16`
  hours and Votes `2`, over exactly the estimates `24` and `40` hours, displayed as `3d`, `4d`, `5d`, `2d`
  and `2`
- **AND** the Backend row displays `—` for Lowest, Average, Highest and Spread and `0` for Votes, because the
  first round's `64` hours from `Dmytro Levchenko` is not carried into the second
