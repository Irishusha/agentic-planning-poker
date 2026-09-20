## Purpose

Defines how a Planning Poker round's revealed estimates become reported numbers: which entries are eligible,
the Lowest, Average, Highest, Spread and Votes measures for each role and for Overall, and how a duration in
canonical hours is displayed to a user.

## ADDED Requirements

### Requirement: Supported roles

The domain SHALL support exactly five roles, identified by the stable keys `qa`, `backend`, `frontend`, `ba`
and `pm`. It SHALL expose them as one canonical ordered runtime list in that order, and the role type SHALL
be derived from that single list rather than declared a second time, so the list and the type cannot diverge.
The domain MUST NOT accept or report any other role key.

#### Scenario: The canonical role list

- **WHEN** the canonical list of supported role keys is read
- **THEN** it is exactly `["qa", "backend", "frontend", "ba", "pm"]`, in that order and with no other entry

#### Scenario: Every supported role is a group in a result

- **WHEN** statistics are calculated for the entries `qa 24h` and `backend 40h`
- **THEN** the result carries a statistics group for each of `qa`, `backend`, `frontend`, `ba` and `pm`, and
  for no other role key

### Requirement: Round entry input model

A round entry SHALL describe one participant's state in one round as exactly one of five mutually exclusive
variants: an active participant with a numeric estimate in canonical hours, an active participant who picked
`?`, an active participant who has not voted, an Away participant, or an Observer. The four participating
variants SHALL each carry the participant's role key. The Observer variant SHALL carry no role key, because
an Observer takes part in no per-role group and in no Overall group. A numeric estimate value SHALL exist
only on the numeric-estimate variant, so a `?`, not-voted, Away or Observer entry cannot carry an estimate.
The model MUST NOT express these states as a set of independently settable booleans, and MUST make a
contradictory combination — such as Away with a numeric estimate, an Observer who has voted, or an Observer
carrying an estimation role — unrepresentable rather than merely invalid.

#### Scenario: The five variants are distinguishable

- **WHEN** a round holds one entry of each variant: a numeric estimate of `24h`, a `?`, a not-voted entry and
  an Away entry, all with role `qa`, plus an Observer entry that carries no role
- **THEN** each entry is distinguishable from the other four by its variant discriminator alone, and the
  numeric value `24` is readable only from the numeric-estimate entry

#### Scenario: An Observer carries no estimation role

- **WHEN** an Observer entry is written with a role key, in the type-level fixture, on a line preceded by a
  `@ts-expect-error` directive
- **THEN** the typecheck reports the role key as not assignable to the Observer variant, and the directive is
  consumed rather than reported as unused

#### Scenario: An Away participant cannot carry a numeric estimate

- **WHEN** an Away entry is written with a numeric estimate of `24` hours, in the type-level fixture, on a
  line preceded by a `@ts-expect-error` directive
- **THEN** the typecheck reports the estimate as not assignable to the Away variant, and the directive is
  consumed rather than reported as unused

#### Scenario: An Observer cannot carry a numeric estimate

- **WHEN** an Observer entry is written with a numeric estimate of `24` hours, in the type-level fixture, on
  a line preceded by a `@ts-expect-error` directive
- **THEN** the typecheck reports the estimate as not assignable to the Observer variant, and the directive is
  consumed rather than reported as unused

#### Scenario: An unsupported role key is rejected at compile time

- **WHEN** a numeric-estimate entry is written with the role key `"devops"`, in the type-level fixture, on a
  line preceded by a `@ts-expect-error` directive
- **THEN** the typecheck reports `"devops"` as not assignable to the role type, and the directive is consumed
  rather than reported as unused, so no unsupported role key can reach the calculation at run time

### Requirement: Numeric estimates come from the MVP deck

A numeric estimate SHALL carry one of the MVP deck's hour values — `4`, `8`, `16`, `24`, `40`, `64`, `80` or
`112` — enforced as a type, so an off-deck value is a compile error rather than a run-time check. The measures
the calculation derives SHALL NOT be restricted to those values: Average and Spread MAY be any finite
non-negative number.

#### Scenario: An off-deck estimate value is rejected at compile time

- **WHEN** a numeric-estimate entry is written with `5` hours, in the type-level fixture, on a line preceded
  by a `@ts-expect-error` directive
- **THEN** the typecheck reports `5` as not assignable to the deck-hours type, and the directive is consumed
  rather than reported as unused

#### Scenario: A calculated measure need not be a deck value

- **WHEN** statistics are calculated for the entries `qa 24h`, `qa 40h` and `qa 64h`
- **THEN** the `qa` group's Average is `128/3` hours, which is not one of the deck values, and it is reported
  as it was calculated rather than snapped to a deck value

### Requirement: Statistics measures for a group

For every group — each supported role and Overall — the calculation SHALL report Lowest in canonical hours,
Average in canonical hours, Highest in canonical hours, Spread in canonical hours and a numeric Votes count.
Lowest SHALL be the smallest eligible estimate, Highest the largest, Spread Highest minus Lowest, and Votes
the number of eligible estimates in the group. Average SHALL be the arithmetic mean of the group's eligible
estimates in canonical hours and MUST be returned unrounded; the calculation MUST NOT round or convert any
intermediate value. The calculation MUST NOT report a sum of estimates. Lowest, Average, Highest and Spread
are durations and SHALL all be displayed through the one duration formatting convention below, so no measure
has a display rule of its own; Votes is a count, not a duration, and is not formatted that way.

#### Scenario: A reachable QA round

- **WHEN** statistics are calculated for the entries `qa 24h`, `qa 40h`, `qa 64h`
- **THEN** the `qa` group reports Lowest `24` hours, Average exactly `128/3` hours (`42.666…`, unrounded),
  Highest `64` hours, Spread `40` hours and Votes `3`
- **AND** those four durations are displayed as Lowest `3d`, Average `5.3d`, Highest `8d` and Spread `5d`

#### Scenario: A single eligible estimate

- **WHEN** statistics are calculated for the single entry `backend 40h`
- **THEN** the `backend` group reports Lowest `40` hours, Average `40` hours, Highest `40` hours, Spread `0`
  hours and Votes `1`
- **AND** those four durations are displayed as Lowest `5d`, Average `5d`, Highest `5d` and Spread `0h`

### Requirement: Eligibility of round entries

The calculation SHALL include an entry in a group's measures only when that entry is a numeric estimate from
an active participant. It SHALL exclude every `?` entry, every not-voted entry, every Away entry and every
Observer entry from Lowest, Average, Highest, Spread and the Votes count.

#### Scenario: Only the numeric estimate of an active participant counts

- **WHEN** statistics are calculated for the entries `qa 24h`, `qa ?`, `qa not-voted`, `qa Away` and one
  Observer entry
- **THEN** the `qa` group reports Lowest `24` hours, Average `24` hours, Highest `24` hours, Spread `0` hours
  and Votes `1`
- **AND** the Overall group reports the same five values, because `24h` is the only eligible estimate

### Requirement: A group with no eligible estimate

When a group has no eligible numeric estimate, the calculation SHALL report Lowest, Average, Highest and
Spread as `null`, and Votes as `0`. It MUST NOT report `0` hours, `NaN` or any placeholder value in place of
an unavailable measure.

#### Scenario: Every entry is excluded

- **WHEN** statistics are calculated for the entries `qa ?`, `qa not-voted`, `qa Away` and one Observer entry
- **THEN** the `qa` group reports Lowest `null`, Average `null`, Highest `null`, Spread `null` and Votes `0`
- **AND** the Overall group reports Lowest `null`, Average `null`, Highest `null`, Spread `null` and Votes `0`

#### Scenario: No entries at all

- **WHEN** statistics are calculated for an empty list of entries
- **THEN** each of the five role groups and the Overall group reports Lowest `null`, Average `null`, Highest
  `null`, Spread `null` and Votes `0`

### Requirement: Per-role and Overall groups

The calculation SHALL report each role's statistics over that role's eligible estimates only, and Overall
statistics over the eligible estimates of every role together. Overall MUST be a second view of the same
estimates: it SHALL NOT be affected by how those estimates are distributed across roles.

#### Scenario: Three roles estimate, two do not

- **WHEN** statistics are calculated for the entries `qa 24h`, `backend 40h`, `frontend 64h`, `ba ?` and
  `pm Away`
- **THEN** the `qa` group reports Lowest `24`, Average `24`, Highest `24`, Spread `0` hours and Votes `1`
- **AND** the `backend` group reports Lowest `40`, Average `40`, Highest `40`, Spread `0` hours and Votes `1`
- **AND** the `frontend` group reports Lowest `64`, Average `64`, Highest `64`, Spread `0` hours and Votes `1`
- **AND** the `ba` group and the `pm` group each report Lowest `null`, Average `null`, Highest `null`, Spread
  `null` and Votes `0`
- **AND** the Overall group reports Lowest `24` hours, Average exactly `128/3` hours, Highest `64` hours,
  Spread `40` hours and Votes `3`, over exactly the estimates `24h`, `40h` and `64h`

#### Scenario: Overall is calculated from the estimates, not from the role averages

- **WHEN** statistics are calculated for the entries `qa 24h`, `qa 40h` and `backend 64h`, so that one role
  holds two eligible estimates and another holds one
- **THEN** the `qa` group reports Average `32` hours and Votes `2`, and the `backend` group reports Average
  `64` hours and Votes `1`
- **AND** the Overall group reports Lowest `24` hours, Average exactly `128/3` hours, Highest `64` hours,
  Spread `40` hours and Votes `3`, because Overall is calculated from all three eligible estimates together
  and not from the role-level aggregates — the unweighted mean of the two role Averages would be `48` hours,
  which the Overall group MUST NOT report

### Requirement: The calculation is pure

The calculation SHALL NOT mutate the list of entries it is given or any entry within it, and SHALL NOT retain
state between calls. Two calls with equal input SHALL produce equal output.

#### Scenario: The supplied entries are unchanged

- **WHEN** statistics are calculated for the entries `qa 24h`, `qa ?`, `backend 40h` and `pm Away`
- **THEN** the list still holds those four entries in the same order, each with the variant, role and value
  it had before the call — in particular the `qa` estimate is still `24` hours
- **AND** calculating a second time over the same list produces a result equal to the first

### Requirement: Duration display formatting

A duration in canonical hours SHALL be formatted for display as a single string, where one working day equals
8 hours. A value below 8 hours SHALL be displayed in hours with the suffix `h`. A value of 8 hours or more
SHALL be displayed in days with the suffix `d`, the hours divided by 8. In both units the displayed value
SHALL be rounded half-up to one decimal place for positive values, and a trailing `.0` SHALL never be
displayed. Formatting SHALL be pure: it changes no stored statistic and depends on nothing but its input.

#### Scenario: Below the day boundary

- **WHEN** `6` hours is formatted
- **THEN** the result is exactly `6h`

#### Scenario: Exactly the day boundary

- **WHEN** `8` hours is formatted
- **THEN** the result is exactly `1d`, with no trailing `.0`

#### Scenario: Positive half-up rounding in days

- **WHEN** `10` hours is formatted, which is `1.25` days and whose second decimal is exactly `5`
- **THEN** the result is exactly `1.3d`, not `1.2d`

#### Scenario: A whole number of days

- **WHEN** `16` hours is formatted
- **THEN** the result is exactly `2d`, with no trailing `.0`

#### Scenario: A fractional value below the day boundary

- **WHEN** `16/3` hours (`5.333…`, the average of `4h`, `4h` and `8h`) is formatted
- **THEN** the result is exactly `5.3h`, because the one-decimal half-up rule applies to hours as well as to
  days

#### Scenario: Zero hours

- **WHEN** `0` hours — the Spread of a group whose eligible estimates are all equal — is formatted
- **THEN** the result is exactly `0h`

### Requirement: Rejection of invalid duration input

Duration formatting SHALL accept only a finite non-negative number of hours. Given a negative value, `NaN`,
`Infinity` or `-Infinity`, it SHALL throw a `RangeError` whose message is exactly
`hours must be a finite non-negative number`, and it MUST NOT return a string for such an input.

#### Scenario: A negative duration is rejected

- **WHEN** `-1` hours is formatted
- **THEN** a `RangeError` is thrown whose message is exactly `hours must be a finite non-negative number`,
  and no string is returned

#### Scenario: NaN is rejected

- **WHEN** `NaN` is formatted
- **THEN** a `RangeError` is thrown whose message is exactly `hours must be a finite non-negative number`,
  and no string is returned

#### Scenario: An infinite duration is rejected

- **WHEN** `Infinity` is formatted
- **THEN** a `RangeError` is thrown whose message is exactly `hours must be a finite non-negative number`,
  and no string is returned
- **AND** `-Infinity` is rejected the same way, with the same error type and the same message
