import { expect, test } from "vitest";

import { getHealth } from "./health";

test("getHealth reports the planning-poker service as ok", () => {
  expect(getHealth()).toEqual({ status: "ok", service: "planning-poker" });
});
