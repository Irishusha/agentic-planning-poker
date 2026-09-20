import { expect, test } from "vitest";

import { formatDuration } from "./duration";
import { calculateRoundStatistics, type RoundEntry } from "./statistics";

const NO_ESTIMATES = {
  lowestHours: null,
  averageHours: null,
  highestHours: null,
  spreadHours: null,
  votes: 0,
};

/** Formats a measure the calculation reported, failing loudly if it is unavailable. */
function displayed(measureHours: number | null): string {
  if (measureHours === null) {
    throw new Error("expected an available measure, got null");
  }

  return formatDuration(measureHours);
}

test("the five round-entry variants are distinguishable by their kind alone", () => {
  const entries: readonly RoundEntry[] = [
    { kind: "estimate", role: "qa", hours: 24 },
    { kind: "unsure", role: "qa" },
    { kind: "waiting", role: "qa" },
    { kind: "away", role: "qa" },
    { kind: "observer" },
  ];

  expect(entries.map((entry) => entry.kind)).toEqual([
    "estimate",
    "unsure",
    "waiting",
    "away",
    "observer",
  ]);
  expect(
    entries
      .filter((entry) => entry.kind === "estimate")
      .map((entry) => entry.hours),
  ).toEqual([24]);
});

test("a reachable QA round reports lowest, average, highest, spread and votes", () => {
  const { byRole } = calculateRoundStatistics([
    { kind: "estimate", role: "qa", hours: 24 },
    { kind: "estimate", role: "qa", hours: 40 },
    { kind: "estimate", role: "qa", hours: 64 },
  ]);

  expect(byRole.qa.lowestHours).toBe(24);
  expect(byRole.qa.averageHours).toBeCloseTo(128 / 3, 10);
  expect(byRole.qa.highestHours).toBe(64);
  expect(byRole.qa.spreadHours).toBe(40);
  expect(byRole.qa.votes).toBe(3);
});

test("the QA round's four measures are displayed as durations", () => {
  const { byRole } = calculateRoundStatistics([
    { kind: "estimate", role: "qa", hours: 24 },
    { kind: "estimate", role: "qa", hours: 40 },
    { kind: "estimate", role: "qa", hours: 64 },
  ]);

  expect(displayed(byRole.qa.lowestHours)).toBe("3d");
  expect(displayed(byRole.qa.averageHours)).toBe("5.3d");
  expect(displayed(byRole.qa.highestHours)).toBe("8d");
  expect(displayed(byRole.qa.spreadHours)).toBe("5d");
});

test("an average that is not a deck value is reported as it was calculated", () => {
  const { byRole } = calculateRoundStatistics([
    { kind: "estimate", role: "qa", hours: 24 },
    { kind: "estimate", role: "qa", hours: 40 },
    { kind: "estimate", role: "qa", hours: 64 },
  ]);

  expect(byRole.qa.averageHours).toBeCloseTo(128 / 3, 10);
  expect([4, 8, 16, 24, 40, 64, 80, 112]).not.toContain(byRole.qa.averageHours);
});

test("a single eligible estimate is every measure, with a spread of zero", () => {
  const { byRole } = calculateRoundStatistics([
    { kind: "estimate", role: "backend", hours: 40 },
  ]);

  expect(byRole.backend).toEqual({
    lowestHours: 40,
    averageHours: 40,
    highestHours: 40,
    spreadHours: 0,
    votes: 1,
  });
});

test("the single estimate's four measures are displayed as durations", () => {
  const { byRole } = calculateRoundStatistics([
    { kind: "estimate", role: "backend", hours: 40 },
  ]);

  expect(displayed(byRole.backend.lowestHours)).toBe("5d");
  expect(displayed(byRole.backend.averageHours)).toBe("5d");
  expect(displayed(byRole.backend.highestHours)).toBe("5d");
  expect(displayed(byRole.backend.spreadHours)).toBe("0h");
});

test("only the numeric estimate of an active participant counts", () => {
  const { byRole, overall } = calculateRoundStatistics([
    { kind: "estimate", role: "qa", hours: 24 },
    { kind: "unsure", role: "qa" },
    { kind: "waiting", role: "qa" },
    { kind: "away", role: "qa" },
    { kind: "observer" },
  ]);

  expect(byRole.qa).toEqual({
    lowestHours: 24,
    averageHours: 24,
    highestHours: 24,
    spreadHours: 0,
    votes: 1,
  });
  expect(overall).toEqual({
    lowestHours: 24,
    averageHours: 24,
    highestHours: 24,
    spreadHours: 0,
    votes: 1,
  });
});

test("a group whose entries are all excluded reports null measures and no votes", () => {
  const { byRole, overall } = calculateRoundStatistics([
    { kind: "unsure", role: "qa" },
    { kind: "waiting", role: "qa" },
    { kind: "away", role: "qa" },
    { kind: "observer" },
  ]);

  expect(byRole.qa).toEqual(NO_ESTIMATES);
  expect(overall).toEqual(NO_ESTIMATES);
});

test("an empty round reports null measures and no votes for every group", () => {
  const { byRole, overall } = calculateRoundStatistics([]);

  expect(byRole.qa).toEqual(NO_ESTIMATES);
  expect(byRole.backend).toEqual(NO_ESTIMATES);
  expect(byRole.frontend).toEqual(NO_ESTIMATES);
  expect(byRole.ba).toEqual(NO_ESTIMATES);
  expect(byRole.pm).toEqual(NO_ESTIMATES);
  expect(overall).toEqual(NO_ESTIMATES);
});

test("three roles estimate, two do not, and overall spans all three estimates", () => {
  const { byRole, overall } = calculateRoundStatistics([
    { kind: "estimate", role: "qa", hours: 24 },
    { kind: "estimate", role: "backend", hours: 40 },
    { kind: "estimate", role: "frontend", hours: 64 },
    { kind: "unsure", role: "ba" },
    { kind: "away", role: "pm" },
  ]);

  expect(byRole.qa).toEqual({
    lowestHours: 24,
    averageHours: 24,
    highestHours: 24,
    spreadHours: 0,
    votes: 1,
  });
  expect(byRole.backend).toEqual({
    lowestHours: 40,
    averageHours: 40,
    highestHours: 40,
    spreadHours: 0,
    votes: 1,
  });
  expect(byRole.frontend).toEqual({
    lowestHours: 64,
    averageHours: 64,
    highestHours: 64,
    spreadHours: 0,
    votes: 1,
  });
  expect(byRole.ba).toEqual(NO_ESTIMATES);
  expect(byRole.pm).toEqual(NO_ESTIMATES);

  expect(overall.lowestHours).toBe(24);
  expect(overall.averageHours).toBeCloseTo(128 / 3, 10);
  expect(overall.highestHours).toBe(64);
  expect(overall.spreadHours).toBe(40);
  expect(overall.votes).toBe(3);
});

// The discriminating fixture for Overall: one role holds two estimates and another
// holds one, so the unweighted mean of the role Averages — (32 + 64) / 2 = 48 — is a
// different number from the mean of the estimates, 128/3. A fixture giving every role
// one vote cannot tell the two apart (see design.md, "Overall is computed from the
// eligible entries directly").
test("overall is calculated from the estimates, not from the role averages", () => {
  const { byRole, overall } = calculateRoundStatistics([
    { kind: "estimate", role: "qa", hours: 24 },
    { kind: "estimate", role: "qa", hours: 40 },
    { kind: "estimate", role: "backend", hours: 64 },
  ]);

  expect(byRole.qa.averageHours).toBe(32);
  expect(byRole.qa.votes).toBe(2);
  expect(byRole.backend.averageHours).toBe(64);
  expect(byRole.backend.votes).toBe(1);

  expect(overall.lowestHours).toBe(24);
  expect(overall.averageHours).toBeCloseTo(128 / 3, 10);
  expect(overall.highestHours).toBe(64);
  expect(overall.spreadHours).toBe(40);
  expect(overall.votes).toBe(3);
});

test("every supported role has a group, and no other role key does", () => {
  const { byRole } = calculateRoundStatistics([
    { kind: "estimate", role: "qa", hours: 24 },
    { kind: "estimate", role: "backend", hours: 40 },
  ]);

  expect(Object.keys(byRole)).toEqual(["qa", "backend", "frontend", "ba", "pm"]);
});

test("the supplied entries are unchanged and a second call is equal to the first", () => {
  const entries: RoundEntry[] = [
    { kind: "estimate", role: "qa", hours: 24 },
    { kind: "unsure", role: "qa" },
    { kind: "estimate", role: "backend", hours: 40 },
    { kind: "away", role: "pm" },
  ];

  const first = calculateRoundStatistics(entries);

  expect(entries).toEqual([
    { kind: "estimate", role: "qa", hours: 24 },
    { kind: "unsure", role: "qa" },
    { kind: "estimate", role: "backend", hours: 40 },
    { kind: "away", role: "pm" },
  ]);
  expect(calculateRoundStatistics(entries)).toEqual(first);
});
