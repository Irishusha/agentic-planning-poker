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

describe("participant names are present and unique", () => {
  it("reports a participant with no name", () => {
    expect(
      validateSetup(
        draftOf([
          { id: "p-1", name: "Serhii Bondar", part: "qa" },
          { id: "p-2", name: "", part: "backend" },
        ]),
      ),
    ).toEqual(["Give every participant a name"]);
  });

  it("reports a whitespace-only name", () => {
    expect(
      validateSetup(
        draftOf([
          { id: "p-1", name: "Serhii Bondar", part: "qa" },
          { id: "p-2", name: "   ", part: "backend" },
        ]),
      ),
    ).toEqual(["Give every participant a name"]);
  });

  it("reports two names that differ only by case", () => {
    expect(
      validateSetup(
        draftOf([
          { id: "p-1", name: "Anna Kovalenko", part: "qa" },
          { id: "p-2", name: "anna kovalenko", part: "backend" },
        ]),
      ),
    ).toEqual(["Participant names must be unique"]);
  });

  it("compares names after trimming", () => {
    expect(
      validateSetup(
        draftOf([
          { id: "p-1", name: "  Anna Kovalenko  ", part: "qa" },
          { id: "p-2", name: "Anna Kovalenko", part: "backend" },
        ]),
      ),
    ).toEqual(["Participant names must be unique"]);
  });

  it("accepts two distinct names", () => {
    expect(
      validateSetup(
        draftOf([
          { id: "p-1", name: "Anna Kovalenko", part: "qa" },
          { id: "p-2", name: "Anna K.", part: "backend" },
        ]),
      ),
    ).toEqual([]);
  });
});

describe("a round needs at least one voter", () => {
  it("reports a roster of Observers only", () => {
    expect(
      validateSetup(
        draftOf([
          { id: "p-1", name: "Serhii Bondar", part: "observer" },
          { id: "p-2", name: "Kateryna H.", part: "observer" },
        ]),
      ),
    ).toEqual(["Add at least one voter"]);
  });

  it("accepts exactly one voter", () => {
    expect(
      validateSetup(draftOf([{ id: "p-1", name: "Serhii Bondar", part: "qa" }])),
    ).toEqual([]);
  });
});

describe("every standing error is reported", () => {
  it("reports the title and the name together, in a fixed order", () => {
    expect(
      validateSetup(
        draftOf(
          [
            { id: "p-1", name: "Serhii Bondar", part: "qa" },
            { id: "p-2", name: "", part: "backend" },
          ],
          { title: "" },
        ),
      ),
    ).toEqual(["Enter a task title", "Give every participant a name"]);
  });
});

describe("validation is pure", () => {
  it("leaves the draft untouched and answers the same way twice", () => {
    const draft: SetupDraft = {
      title: "",
      description: "Rows are matched by email.",
      participants: [
        { id: "p-1", name: "Anna Kovalenko", part: "pm" },
        { id: "p-2", name: "anna kovalenko", part: "qa" },
        { id: "p-3", name: "Kateryna H.", part: "observer" },
      ],
    };
    // An independent snapshot: a separate literal, not a copy of `draft`.
    const before: SetupDraft = {
      title: "",
      description: "Rows are matched by email.",
      participants: [
        { id: "p-1", name: "Anna Kovalenko", part: "pm" },
        { id: "p-2", name: "anna kovalenko", part: "qa" },
        { id: "p-3", name: "Kateryna H.", part: "observer" },
      ],
    };
    // Written from the rules, not from the function under test: the title is
    // empty and two names match ignoring case, reported in the fixed order.
    const expected = ["Enter a task title", "Participant names must be unique"];

    const first = validateSetup(draft);
    const second = validateSetup(draft);

    expect(first).toEqual(expected);
    expect(second).toEqual(first);
    expect(draft).toEqual(before);
    expect(draft.participants).toEqual(before.participants);
  });
});
