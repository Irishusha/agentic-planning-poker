/**
 * The estimation roles the product supports.
 *
 * `ROLE_KEYS` is the single canonical source: `RoleKey` is derived from it, so the
 * list and the type cannot drift apart and adding a role is a one-line edit.
 */
export const ROLE_KEYS = ["qa", "backend", "frontend", "ba", "pm"] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];
