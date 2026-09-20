/**
 * Baseline module for the test harness.
 *
 * It exists so the quality gate has one real, deterministic behaviour to verify
 * before any Planning Poker domain code is written. Replace it with real modules
 * as the product takes shape.
 */
export type Health = {
  readonly status: "ok";
  readonly service: "planning-poker";
};

export function getHealth(): Health {
  return { status: "ok", service: "planning-poker" };
}
