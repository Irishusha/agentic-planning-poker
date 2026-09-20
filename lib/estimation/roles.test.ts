import { expect, test } from "vitest";

import { ROLE_KEYS } from "./roles";

// Green the first time it runs, by design: `RoleKey` is derived from `ROLE_KEYS`,
// so the list cannot be staged behind a placeholder (see design.md, "Roles come
// from one runtime source"). It is the regression guard on the list and its order.
test("ROLE_KEYS is the five supported roles in canonical order", () => {
  expect(ROLE_KEYS).toEqual(["qa", "backend", "frontend", "ba", "pm"]);
});
