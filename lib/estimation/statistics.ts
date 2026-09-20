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

function emptyStatistics(): EstimateStatistics {
  return {
    lowestHours: null,
    averageHours: null,
    highestHours: null,
    spreadHours: null,
    votes: 0,
  };
}

export function calculateRoundStatistics(
  entries: readonly RoundEntry[],
): RoundStatistics {
  void entries;

  return {
    overall: emptyStatistics(),
    byRole: Object.fromEntries(
      ROLE_KEYS.map((role) => [role, emptyStatistics()]),
    ) as Record<RoleKey, EstimateStatistics>,
  };
}
