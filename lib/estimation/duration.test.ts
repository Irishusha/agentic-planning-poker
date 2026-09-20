import { expect, test } from "vitest";

import { formatDuration } from "./duration";

function expectRejected(hours: number): void {
  expect(() => formatDuration(hours)).toThrowError(RangeError);
  expect(() => formatDuration(hours)).toThrowError(
    new RangeError("hours must be a finite non-negative number"),
  );
}

test("6 hours is below the day boundary and renders in hours", () => {
  expect(formatDuration(6)).toBe("6h");
});

test("8 hours is exactly the day boundary and renders as one whole day", () => {
  expect(formatDuration(8)).toBe("1d");
});

test("10 hours rounds half-up in days", () => {
  expect(formatDuration(10)).toBe("1.3d");
});

test("16 hours renders as a whole number of days with no trailing .0", () => {
  expect(formatDuration(16)).toBe("2d");
});

test("a fractional value below the day boundary rounds half-up in hours", () => {
  expect(formatDuration(16 / 3)).toBe("5.3h");
});

test("0 hours renders as 0h", () => {
  expect(formatDuration(0)).toBe("0h");
});

test("a negative duration is rejected", () => {
  expectRejected(-1);
});

test("NaN is rejected", () => {
  expectRejected(Number.NaN);
});

test("Infinity is rejected", () => {
  expectRejected(Number.POSITIVE_INFINITY);
});

test("-Infinity is rejected", () => {
  expectRejected(Number.NEGATIVE_INFINITY);
});
