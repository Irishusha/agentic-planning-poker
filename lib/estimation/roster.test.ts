import { describe, expect, it } from "vitest";
import {
  buildRoster,
  buildTask,
  validateSetup,
  type SetupDraft,
} from "./roster";

const draftOf = (
  participants: SetupDraft["participants"],
  overrides: Partial<SetupDraft> = {},
): SetupDraft => ({
  title: "Estimate the CSV import",
  description: "Rows are matched by email.",
  participants,
  ...overrides,
});

const THREE: SetupDraft["participants"] = [
  { id: "p-1", name: "Serhii Bondar", part: "qa" },
  { id: "p-2", name: "Kateryna H.", part: "observer" },
  { id: "p-3", name: "Dmytro Levchenko", part: "backend" },
];

describe("configured participants become round entries", () => {
  it("maps each part to its entry, in the configured order", () => {
    expect(buildRoster(draftOf(THREE))).toEqual([
      { id: "p-1", name: "Serhii Bondar", entry: { kind: "waiting", role: "qa" } },
      { id: "p-2", name: "Kateryna H.", entry: { kind: "observer" } },
      { id: "p-3", name: "Dmytro Levchenko", entry: { kind: "waiting", role: "backend" } },
    ]);
  });

  it("trims a participant's name", () => {
    expect(
      buildRoster(draftOf([{ id: "p-1", name: "  Ivan Petrenko  ", part: "pm" }])),
    ).toEqual([
      { id: "p-1", name: "Ivan Petrenko", entry: { kind: "waiting", role: "pm" } },
    ]);
  });
});

describe("roster construction is pure", () => {
  it("does not mutate the draft it is given", () => {
    const draft = draftOf([
      { id: "p-1", name: "Serhii Bondar", part: "qa" },
      { id: "p-2", name: "Kateryna H.", part: "observer" },
    ]);

    buildRoster(draft);

    expect(draft).toEqual({
      title: "Estimate the CSV import",
      description: "Rows are matched by email.",
      participants: [
        { id: "p-1", name: "Serhii Bondar", part: "qa" },
        { id: "p-2", name: "Kateryna H.", part: "observer" },
      ],
    });
  });

  it("produces equal rosters for equal drafts", () => {
    expect(buildRoster(draftOf(THREE))).toEqual(buildRoster(draftOf(THREE)));
  });
});

describe("the task title is required", () => {
  it("reports an empty title", () => {
    expect(validateSetup(draftOf(THREE, { title: "" }))).toEqual([
      "Enter a task title",
    ]);
  });

  it("reports a whitespace-only title", () => {
    expect(validateSetup(draftOf(THREE, { title: "   " }))).toEqual([
      "Enter a task title",
    ]);
  });

  it("accepts an empty description", () => {
    expect(validateSetup(draftOf(THREE, { description: "" }))).toEqual([]);
  });
});

describe("the task is normalised when the round starts", () => {
  it("trims the title and the description", () => {
    expect(
      buildTask(
        draftOf(THREE, {
          title: "  Estimate the CSV import  ",
          description: "  Rows are matched by email.  ",
        }),
      ),
    ).toEqual({
      title: "Estimate the CSV import",
      description: "Rows are matched by email.",
    });
  });

  it("carries an empty description through as empty", () => {
    expect(buildTask(draftOf(THREE, { description: "" })).description).toBe("");
  });

  it("does not mutate the draft it is given", () => {
    const draft = draftOf(THREE, { title: "  Estimate the CSV import  " });

    buildTask(draft);

    expect(draft.title).toBe("  Estimate the CSV import  ");
    expect(draft.description).toBe("Rows are matched by email.");
  });
});
