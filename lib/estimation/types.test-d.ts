/**
 * Compile-time fixture for the guarantees Vitest cannot observe: code that does not
 * compile is code Vitest never runs. Each case is an inverted assertion — `tsc` fails
 * with "Unused '@ts-expect-error' directive" if the error ever stops occurring.
 *
 * `pnpm typecheck` is this file's runner. The `-d` in the filename keeps it out of
 * Vitest's `include: ["**\/*.test.{ts,tsx}"]`, which matches only `*.test.ts`, while
 * `tsconfig.json`'s `**\/*.ts` keeps it in `tsc --noEmit`. Renaming it to
 * `types.test.ts` would make Vitest collect a file with no test in it and fail the run.
 */
import type { RoundEntry } from "./statistics";

// @ts-expect-error "devops" is not one of the five supported role keys.
export const unsupportedRoleKey: RoundEntry = { kind: "estimate", role: "devops", hours: 24 };

// @ts-expect-error 5 is not one of the MVP deck's hour values.
export const offDeckEstimateValue: RoundEntry = { kind: "estimate", role: "qa", hours: 5 };

// @ts-expect-error an Observer takes part in no per-role group, so it carries no role.
export const observerWithRole: RoundEntry = { kind: "observer", role: "qa" };
