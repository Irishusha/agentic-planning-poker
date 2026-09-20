const HOURS_PER_DAY = 8;

/** Half-up at one decimal place for positive values, as the product plan states. */
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Renders a duration in canonical hours as the one user-facing string convention:
 * hours below the 8-hour working day, days at 8 and above, rounded half-up to one
 * decimal place in both units. Interpolating the rounded number drops a trailing
 * `.0` on its own, so `8` renders as `1d` rather than `1.0d`.
 *
 * This is the only run-time guard in the estimation domain: `formatDuration` is the
 * one function whose argument is a computed number rather than a value drawn from
 * `RoundEntry`, so the type system cannot reach it. A bad number is a caller bug,
 * and a placeholder string would render as a plausible statistic and hide it.
 *
 * @throws RangeError if `hours` is negative, `NaN` or infinite.
 */
export function formatDuration(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) {
    throw new RangeError("hours must be a finite non-negative number");
  }

  if (hours < HOURS_PER_DAY) {
    return `${roundToOneDecimal(hours)}h`;
  }

  return `${roundToOneDecimal(hours / HOURS_PER_DAY)}d`;
}
