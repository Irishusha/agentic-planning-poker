# round-setup Specification

## Purpose
Defines the local setup screen a Planning Poker operator uses before a round: the example it opens on, the
task they enter, the roster they build from names and roles, the rules that decide whether the round can
start, and what starting hands to the round.

## Requirements

### Requirement: Setup is the application's entry point

Opening the application SHALL show the setup screen, prefilled with the example task and the example roster of
seven participants, so a round can be started immediately without typing anything. The round itself SHALL NOT
be shown until the round is started: the setup screen MUST NOT offer the estimate deck, the Away toggle, the
progress status, the Reveal control or any statistics.

#### Scenario: The setup screen as it opens

- **WHEN** the application is opened at the root route
- **THEN** the task title field holds `PP-318 · Bulk import of candidates from CSV`, the description field
  holds the example description, and seven participants are listed — Serhii Bondar as QA, Dmytro Levchenko
  and Maksym Tkachuk as Backend, Olena Shevchuk as Frontend, Iryna Marchenko as Business Analyst, Anna
  Kovalenko as PM and Kateryna H. as Observer
- **AND** the `Start round` control is available

#### Scenario: The round is not on screen before it starts

- **WHEN** the application is opened and the round has not been started
- **THEN** no estimate card, no Away toggle, no `N of M voted` status, no Reveal control and no Lowest,
  Average, Highest, Spread or Votes figure is present

### Requirement: The operator enters the task

The setup screen SHALL offer a task title and a task description. The title SHALL be required: a title that is
empty once trimmed is an error, so a title of whitespace only is as invalid as an empty one. The description
SHALL be optional and MAY be left empty. Both SHALL carry accessible labels. When the round starts, the title
and the description SHALL both be trimmed of surrounding whitespace, and those trimmed values are what the
round displays.

#### Scenario: An empty title blocks the start

- **WHEN** the task title is cleared
- **THEN** the message `Enter a task title` is shown and the `Start round` control is unavailable

#### Scenario: A whitespace-only title is empty

- **WHEN** the task title is set to three spaces
- **THEN** the message `Enter a task title` is shown and the `Start round` control is unavailable

#### Scenario: The description may be left empty

- **WHEN** the task description is cleared while the title reads `Estimate the CSV import`
- **THEN** no error message is shown and the `Start round` control is available

#### Scenario: An empty description reaches the round as empty

- **WHEN** the title is typed as `Estimate the CSV import`, the description is cleared, and the round is
  started
- **THEN** the round displays the title `Estimate the CSV import` and no description text

#### Scenario: The title and description are trimmed when the round starts

- **WHEN** the title is set to `  Estimate the CSV import  `, the description is set to
  `  Rows are matched by email.  `, and the round is started
- **THEN** the round displays the title `Estimate the CSV import` and the description
  `Rows are matched by email.`, each with no leading or trailing space

### Requirement: The operator builds the roster

The setup screen SHALL let the operator add a participant, edit any participant's name, choose that
participant's part in the round, and remove any participant. The available choices SHALL be exactly the five
voter roles — QA, Backend, Frontend, Business Analyst and PM — plus Observer, and no other. A newly added
participant SHALL start with an empty name and the role QA, so the operator only has to type a name. Every
control SHALL carry an accessible label that identifies the participant it acts on.

#### Scenario: Adding a participant

- **WHEN** a participant is added to the prefilled roster and named `Ivan Petrenko` with the role Frontend
- **THEN** the roster holds eight participants and, once the round is started, `Ivan Petrenko` appears in the
  Frontend group with the status `Waiting`

#### Scenario: Editing a participant's name

- **WHEN** the prefilled QA participant's name is changed from `Serhii Bondar` to `Serhii B.`
- **THEN** starting the round shows `Serhii B.` in the QA group, and `Serhii Bondar` appears nowhere

#### Scenario: Changing a participant's role

- **WHEN** `Olena Shevchuk` is changed from Frontend to Backend
- **THEN** starting the round lists `Olena Shevchuk` in the Backend group, and the Frontend group is not shown
  because no participant holds that role

#### Scenario: Removing a participant

- **WHEN** `Maksym Tkachuk` is removed from the prefilled roster
- **THEN** six participants remain and, once the round is started, the progress status reads `0 of 5 voted`

#### Scenario: The offered parts

- **WHEN** a participant's part control is read
- **THEN** it offers exactly QA, Backend, Frontend, Business Analyst, PM and Observer, and no other value

### Requirement: An Observer is configured without a role

A participant SHALL be configurable as an Observer instead of a voter. An Observer SHALL carry no estimation
role, SHALL NOT be offered by the round's Acting-as control and SHALL NOT be counted towards the round's voter
total. Observers SHALL be optional and unlimited: a roster with no Observer and a roster with several are both
valid.

#### Scenario: A configured Observer takes no part in voting

- **WHEN** `Ivan Petrenko` is added as an Observer to the prefilled roster and the round is started
- **THEN** the progress status reads `0 of 6 voted`, and the Acting-as control offers the six voters without
  `Ivan Petrenko` or `Kateryna H.`

#### Scenario: A roster without an Observer is valid

- **WHEN** `Kateryna H.`, the only Observer, is removed and the round is started
- **THEN** the round starts with six voters, the progress status reads `0 of 6 voted` and no Observers group
  is shown

### Requirement: Participant names are trimmed, present and unique

A participant's name SHALL be trimmed of surrounding whitespace, and the trimmed name is the name the round
uses. A name that is empty once trimmed is an error. Two participants MUST NOT carry the same trimmed name
compared without regard to case, so every participant is identifiable in the round's controls and lists.

#### Scenario: A surrounding-whitespace name is trimmed

- **WHEN** a participant is added with the name `  Ivan Petrenko  ` and the role PM, and the round is started
- **THEN** the PM group lists `Ivan Petrenko`, with no leading or trailing space

#### Scenario: An empty name blocks the start

- **WHEN** a participant is added and left unnamed
- **THEN** the message `Give every participant a name` is shown and the `Start round` control is unavailable

#### Scenario: A duplicate name differing only by case blocks the start

- **WHEN** a participant is added with the name `anna kovalenko`, while the prefilled roster already holds
  `Anna Kovalenko`
- **THEN** the message `Participant names must be unique` is shown and the `Start round` control is
  unavailable

### Requirement: A round needs at least one voter

Starting SHALL require at least one participant who is not an Observer. Exactly one voter SHALL be enough.

#### Scenario: A roster of Observers only cannot start

- **WHEN** every participant in the roster is set to Observer
- **THEN** the message `Add at least one voter` is shown and the `Start round` control is unavailable

#### Scenario: A single voter is enough

- **WHEN** the roster is reduced to the one QA participant `Serhii Bondar` and the round is started
- **THEN** the round starts, the progress status reads `0 of 1 voted` and only the QA group is shown

### Requirement: Validation gates the start and explains itself

The `Start round` control SHALL be unavailable while any validation error stands, and every standing error
SHALL be shown as text the operator can read and assistive technology can reach. When several errors stand at
once, all SHALL be shown rather than only the first. Correcting the last error SHALL make `Start round`
available again without reloading the page.

#### Scenario: Several errors are reported together

- **WHEN** the task title is cleared and a participant is added and left unnamed
- **THEN** both `Enter a task title` and `Give every participant a name` are shown, and the `Start round`
  control is unavailable

#### Scenario: Correcting the last error re-enables the start

- **WHEN** the task title is cleared, making `Start round` unavailable, and the title is then typed as
  `Estimate the CSV import`
- **THEN** no error message is shown and the `Start round` control is available

### Requirement: Starting hands the configured task and roster to the round

Starting the round SHALL show the round screen with the configured task and roster in place of the setup
screen. Every voter SHALL begin Waiting, and the Acting-as selection SHALL be the first voter in the roster's
order. The configured task's title and description SHALL be the ones the round displays.

#### Scenario: A custom roster reaches the round

- **WHEN** the roster is reduced to `Serhii Bondar` as QA and `Dmytro Levchenko` as Backend, the title is
  typed as `Estimate the CSV import`, the description is typed as `Rows are matched by email.`, and the round
  is started
- **THEN** the round shows the task title `Estimate the CSV import` and the task description
  `Rows are matched by email.`, neither of them the example text they replaced
- **AND** the progress status reads `0 of 2 voted`, the Acting-as selection is `Serhii Bondar`, and both
  voters show the status `Waiting`

#### Scenario: The setup screen is gone once the round starts

- **WHEN** the round is started from the prefilled roster
- **THEN** no task title field, no task description field, no participant name field and no `Start round`
  control is present

### Requirement: Roster construction and validation are pure

Converting the configured participants into a round roster, and deciding whether that configuration is valid,
SHALL NOT mutate the configuration they are given and SHALL retain no state between calls. Two calls with
equal input SHALL produce equal output. Each configured participant SHALL become exactly one round entry, in
the configured order: a voter becomes a Waiting entry carrying their role, and an Observer becomes an Observer
entry carrying no role.

#### Scenario: Configured participants become round entries

- **WHEN** a configuration of `Serhii Bondar` as QA, `Kateryna H.` as Observer and `Dmytro Levchenko` as
  Backend is converted into a roster
- **THEN** the roster holds three participants in that order: a Waiting entry with role `qa`, an Observer
  entry with no role, and a Waiting entry with role `backend`

#### Scenario: The supplied configuration is unchanged

- **WHEN** a configuration of `Serhii Bondar` as QA and `Kateryna H.` as Observer is converted into a roster
- **THEN** the configuration still holds those two participants with the same names and parts
- **AND** converting the same configuration a second time produces an equal roster

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
