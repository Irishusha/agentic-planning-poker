import { ROLE_KEYS, type RoleKey } from "./roles";
import type { DeckHours } from "./deck";

/**
 * One participant's state in one round, as exactly one of five mutually exclusive
 * variants. `hours` exists only on the `estimate` variant, so "Away with a vote" or
 * "an Observer who voted" cannot be typed at all. An Observer carries no role,
 * because it takes part in no per-role group and in no Overall group.
 */
export type RoundEntry =
  | { kind: "estimate"; role: RoleKey; hours: DeckHours }
  | { kind: "unsure"; role: RoleKey }
  | { kind: "waiting"; role: RoleKey }
  | { kind: "away"; role: RoleKey }
  | { kind: "observer" };

/**
 * The measures of one group, in canonical hours. A group with no eligible estimate
 * reports `null` for every measure — never `0` hours, `NaN` or a placeholder — while
 * Votes has a meaningful zero and is always a number.
 */
export type EstimateStatistics = {
  readonly lowestHours: number | null;
  readonly averageHours: number | null;
  readonly highestHours: number | null;
  readonly spreadHours: number | null;
  readonly votes: number;
};

/** Every supported role has a group, plus Overall over all eligible estimates. */
export type RoundStatistics = {
  readonly overall: EstimateStatistics;
  readonly byRole: Record<RoleKey, EstimateStatistics>;
};

function noEligibleEstimates(): EstimateStatistics {
  return {
    lowestHours: null,
    averageHours: null,
    highestHours: null,
    spreadHours: null,
    votes: 0,
  };
}

/**
 * The measures of one group, over the eligible estimates already collected for it.
 * Everything stays in canonical hours and nothing is rounded: the Average is the
 * arithmetic mean as calculated, and display conversion happens later, in
 * `formatDuration`.
 */
function summarise(estimateHours: readonly number[]): EstimateStatistics {
  if (estimateHours.length === 0) {
    return noEligibleEstimates();
  }

  const lowestHours = Math.min(...estimateHours);
  const highestHours = Math.max(...estimateHours);
  const total = estimateHours.reduce((sum, hours) => sum + hours, 0);

  return {
    lowestHours,
    averageHours: total / estimateHours.length,
    highestHours,
    spreadHours: highestHours - lowestHours,
    votes: estimateHours.length,
  };
}

/**
 * Reports one round as a statistics group per supported role, plus Overall.
 *
 * Only an active participant's numeric estimate is eligible: `?`, not-voted, Away
 * and Observer entries count towards no measure and no vote. Overall is computed
 * from the eligible estimates directly rather than from the role groups, so the way
 * those estimates are distributed across roles cannot change it.
 *
 * Pure: the entries and the array holding them are read, never reordered or
 * modified, and nothing is retained between calls.
 */
export function calculateRoundStatistics(
  entries: readonly RoundEntry[],
): RoundStatistics {
  const eligible = entries.filter(
    (entry): entry is Extract<RoundEntry, { kind: "estimate" }> =>
      entry.kind === "estimate",
  );

  return {
    overall: summarise(eligible.map((entry) => entry.hours)),
    // Seeded from the canonical list, so a role nobody voted for still has a group,
    // and adding a sixth role breaks the build here rather than dropping a group.
    byRole: Object.fromEntries(
      ROLE_KEYS.map((role) => [
        role,
        summarise(
          eligible
            .filter((entry) => entry.role === role)
            .map((entry) => entry.hours),
        ),
      ]),
    ) as Record<RoleKey, EstimateStatistics>,
  };
}
