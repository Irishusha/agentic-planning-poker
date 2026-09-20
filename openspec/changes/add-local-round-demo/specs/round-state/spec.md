## Purpose

Defines the Hours deck a voter chooses from and the rules that govern one voter's state inside a round: the
single active choice, what counts as a completed action for the round's progress, and what a reset clears.

## ADDED Requirements

### Requirement: The MVP Hours deck is available at run time

The domain SHALL expose the MVP Hours deck as one ordered runtime list of nine cards. Eight cards SHALL carry
a user-facing label and the canonical hour value it stands for, and the ninth SHALL be the `?` card, which
carries a label and no hour value at all, so an unsure choice cannot be mistaken for a numeric one. The hour
values SHALL be exactly the eight canonical deck hours and the list SHALL be the single run-time source of the
deck, so the labels and the hours cannot drift apart. The deck SHALL be read-only: nothing that renders or
consumes it can reorder, extend or shorten it.

#### Scenario: The deck's cards, in order

- **WHEN** the runtime deck is read
- **THEN** it holds exactly nine cards in the order `4h`, `1d`, `2d`, `3d`, `5d`, `8d`, `10d`, `14d`, `?`
- **AND** the first eight carry the canonical hours `4`, `8`, `16`, `24`, `40`, `64`, `80` and `112`
  respectively, each paired with the label above it

#### Scenario: The unsure card carries no hour value

- **WHEN** the `?` card is read from the runtime deck
- **THEN** it carries the label `?` and no hour value, so it cannot be read as `0` hours or as any other
  number

### Requirement: A voter holds exactly one active state

A voter's round state SHALL be exactly one of: a numeric estimate, `?`, Away, or Waiting. Choosing SHALL
replace the previous state rather than add to it: choosing a numeric card SHALL clear `?` and Away, choosing
`?` SHALL clear a numeric estimate and Away, and switching Away on SHALL clear a numeric estimate and `?`.
Choosing SHALL preserve the voter's role and SHALL change no other participant's state. Away is a toggle:
switching it off for an Away voter SHALL return them to Waiting, the state they held before any choice. An
Observer has no deck and no Away toggle, so a choice directed at an Observer SHALL leave every participant
unchanged and MUST NOT give the Observer a role, an estimate or an Away state.

#### Scenario: A waiting voter picks a numeric card

- **WHEN** the `5d` card is chosen for a Waiting voter whose role is `backend`
- **THEN** that voter holds a numeric estimate of `40` hours and role `backend`, and holds neither `?` nor
  Away

#### Scenario: A numeric card replaces an earlier numeric card

- **WHEN** the `8d` card is chosen for a voter who already holds `5d`
- **THEN** that voter holds a single numeric estimate of `64` hours, and `40` hours is no longer held anywhere
  for that voter

#### Scenario: A numeric card clears Away

- **WHEN** the `2d` card is chosen for an Away voter whose role is `qa`
- **THEN** that voter holds a numeric estimate of `16` hours and is no longer Away

#### Scenario: Unsure clears a numeric estimate

- **WHEN** `?` is chosen for a voter who holds `3d`
- **THEN** that voter holds `?`, holds no numeric estimate, and is not Away

#### Scenario: Away clears a numeric estimate

- **WHEN** Away is switched on for a voter who holds `3d`
- **THEN** that voter is Away, holds no numeric estimate, and does not hold `?`

#### Scenario: Away clears an unsure choice

- **WHEN** Away is switched on for a voter who holds `?`
- **THEN** that voter is Away and no longer holds `?`

#### Scenario: Switching Away off returns the voter to Waiting

- **WHEN** the Away toggle is switched off for an Away voter whose role is `pm`
- **THEN** that voter is Waiting with role `pm`, and holds neither a numeric estimate nor `?`

#### Scenario: A choice directed at an Observer changes nothing

- **WHEN** the `5d` card is chosen for an Observer in a roster of one `qa` voter holding `2d` and that
  Observer
- **THEN** the Observer still holds no role, no estimate and no Away state, and the `qa` voter still holds
  `16` hours

### Requirement: The completed count for a round

A round SHALL report how many voters have finished their action as `N` out of `M`. `M` SHALL be the number of
voters in the roster, and Observers MUST NOT be counted towards it. `N` SHALL be the number of voters holding
a numeric estimate, `?` or Away — all three complete a voter's action — and a Waiting voter MUST NOT be
counted towards it.

#### Scenario: A part-way round

- **WHEN** the completed count is read for a roster of six voters — two holding numeric estimates, one holding
  `?`, one Away and two Waiting — plus one Observer
- **THEN** `N` is `4` and `M` is `6`

#### Scenario: Nobody has acted yet

- **WHEN** the completed count is read for a roster of six Waiting voters and one Observer
- **THEN** `N` is `0` and `M` is `6`

#### Scenario: Observers are outside the denominator

- **WHEN** the completed count is read for a roster of one Waiting voter and three Observers
- **THEN** `N` is `0` and `M` is `1`, so the three Observers change neither number

### Requirement: Resetting a round

A reset SHALL return every voter to Waiting, clearing a numeric estimate, `?` and Away alike. It SHALL keep
each voter's identity and role, SHALL leave every Observer an Observer, and SHALL preserve the roster's
membership and order, so the same roster can run another round immediately.

#### Scenario: Every round state is cleared

- **WHEN** a round is reset whose roster is, in order, a `qa` voter holding `24` hours, a `backend` voter
  holding `?`, a `frontend` voter who is Away and one Observer
- **THEN** the roster still holds those four participants in that order, the three voters are Waiting with
  roles `qa`, `backend` and `frontend`, and the Observer is still an Observer
- **AND** the completed count is `0` of `3`

### Requirement: Round-state operations are pure

Reading the deck, choosing, switching Away, counting and resetting SHALL NOT mutate the roster they are given
or any participant within it, and SHALL retain no state between calls. Two operations with equal input SHALL
produce equal output.

#### Scenario: The supplied roster is unchanged by a choice

- **WHEN** the `5d` card is chosen for the `backend` voter in a roster of a `qa` voter holding `24` hours,
  that Waiting `backend` voter and one Observer
- **THEN** the supplied roster still holds those three participants in the same order, with the `qa` voter
  still holding `24` hours and the `backend` voter still Waiting
- **AND** the result is a separate roster in which the `backend` voter holds `40` hours

#### Scenario: Equal input produces equal output

- **WHEN** the same roster is reset twice, independently
- **THEN** the two results are equal
