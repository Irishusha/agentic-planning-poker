import { describe, expect, it } from "vitest";
import {
  chooseCard,
  chooseUnsure,
  countCompleted,
  resetRound,
  toggleAway,
  type Participant,
} from "./round";

const voter = (
  id: string,
  role: "qa" | "backend" | "frontend" | "ba" | "pm",
  entry: Participant["entry"],
): Participant => ({ id, name: `Voter ${id}`, entry });

const observer = (id: string): Participant => ({
  id,
  name: `Observer ${id}`,
  entry: { kind: "observer" },
});

describe("a voter holds exactly one active state", () => {
  it("gives a waiting voter the numeric estimate they picked", () => {
    const roster = [voter("b1", "backend", { kind: "waiting", role: "backend" })];

    expect(chooseCard(roster, "b1", 40)[0].entry).toEqual({
      kind: "estimate",
      role: "backend",
      hours: 40,
    });
  });

  it("replaces an earlier numeric estimate rather than adding to it", () => {
    const roster = [
      voter("b1", "backend", { kind: "estimate", role: "backend", hours: 40 }),
    ];

    expect(chooseCard(roster, "b1", 64)[0].entry).toEqual({
      kind: "estimate",
      role: "backend",
      hours: 64,
    });
  });

  it("clears Away when a numeric card is picked", () => {
    const roster = [voter("q1", "qa", { kind: "away", role: "qa" })];

    expect(chooseCard(roster, "q1", 16)[0].entry).toEqual({
      kind: "estimate",
      role: "qa",
      hours: 16,
    });
  });

  it("clears a numeric estimate when the unsure card is picked", () => {
    const roster = [voter("f1", "frontend", { kind: "estimate", role: "frontend", hours: 24 })];

    expect(chooseUnsure(roster, "f1")[0].entry).toEqual({
      kind: "unsure",
      role: "frontend",
    });
  });

  it("clears a numeric estimate when Away is switched on", () => {
    const roster = [voter("f1", "frontend", { kind: "estimate", role: "frontend", hours: 24 })];

    expect(toggleAway(roster, "f1")[0].entry).toEqual({
      kind: "away",
      role: "frontend",
    });
  });

  it("clears an unsure choice when Away is switched on", () => {
    const roster = [voter("a1", "ba", { kind: "unsure", role: "ba" })];

    expect(toggleAway(roster, "a1")[0].entry).toEqual({ kind: "away", role: "ba" });
  });

  it("returns an Away voter to Waiting when Away is switched off", () => {
    const roster = [voter("m1", "pm", { kind: "away", role: "pm" })];

    expect(toggleAway(roster, "m1")[0].entry).toEqual({ kind: "waiting", role: "pm" });
  });

  it("changes nothing when a choice is directed at an Observer", () => {
    const roster = [
      voter("q1", "qa", { kind: "estimate", role: "qa", hours: 16 }),
      observer("o1"),
    ];

    expect(chooseCard(roster, "o1", 40)).toEqual([
      { id: "q1", name: "Voter q1", entry: { kind: "estimate", role: "qa", hours: 16 } },
      { id: "o1", name: "Observer o1", entry: { kind: "observer" } },
    ]);
  });
});

describe("the completed count for a round", () => {
  it("counts estimates, unsure and Away against the voters only", () => {
    const roster = [
      voter("q1", "qa", { kind: "estimate", role: "qa", hours: 16 }),
      voter("b1", "backend", { kind: "estimate", role: "backend", hours: 40 }),
      voter("b2", "backend", { kind: "unsure", role: "backend" }),
      voter("f1", "frontend", { kind: "away", role: "frontend" }),
      voter("a1", "ba", { kind: "waiting", role: "ba" }),
      voter("m1", "pm", { kind: "waiting", role: "pm" }),
      observer("o1"),
    ];

    expect(countCompleted(roster)).toEqual({ n: 4, m: 6 });
  });

  it("counts nobody as completed while every voter is waiting", () => {
    const roster = [
      voter("q1", "qa", { kind: "waiting", role: "qa" }),
      voter("b1", "backend", { kind: "waiting", role: "backend" }),
      voter("b2", "backend", { kind: "waiting", role: "backend" }),
      voter("f1", "frontend", { kind: "waiting", role: "frontend" }),
      voter("a1", "ba", { kind: "waiting", role: "ba" }),
      voter("m1", "pm", { kind: "waiting", role: "pm" }),
      observer("o1"),
    ];

    expect(countCompleted(roster)).toEqual({ n: 0, m: 6 });
  });

  it("leaves Observers out of the denominator", () => {
    const roster = [
      voter("q1", "qa", { kind: "waiting", role: "qa" }),
      observer("o1"),
      observer("o2"),
      observer("o3"),
    ];

    expect(countCompleted(roster)).toEqual({ n: 0, m: 1 });
  });
});

describe("resetting a round", () => {
  const revealedRoster = (): Participant[] => [
    voter("q1", "qa", { kind: "estimate", role: "qa", hours: 24 }),
    voter("b1", "backend", { kind: "unsure", role: "backend" }),
    voter("f1", "frontend", { kind: "away", role: "frontend" }),
    observer("o1"),
  ];

  it("returns every voter to Waiting and leaves the roster otherwise intact", () => {
    expect(resetRound(revealedRoster())).toEqual([
      { id: "q1", name: "Voter q1", entry: { kind: "waiting", role: "qa" } },
      { id: "b1", name: "Voter b1", entry: { kind: "waiting", role: "backend" } },
      { id: "f1", name: "Voter f1", entry: { kind: "waiting", role: "frontend" } },
      { id: "o1", name: "Observer o1", entry: { kind: "observer" } },
    ]);
  });

  it("leaves a reset round with no completed voters", () => {
    expect(countCompleted(resetRound(revealedRoster()))).toEqual({ n: 0, m: 3 });
  });
});

describe("round-state operations are pure", () => {
  const supplied = (): Participant[] => [
    voter("q1", "qa", { kind: "estimate", role: "qa", hours: 24 }),
    voter("b1", "backend", { kind: "waiting", role: "backend" }),
    observer("o1"),
  ];

  it("does not mutate the roster it is given", () => {
    const roster = supplied();

    chooseCard(roster, "b1", 40);

    expect(roster).toEqual([
      { id: "q1", name: "Voter q1", entry: { kind: "estimate", role: "qa", hours: 24 } },
      { id: "b1", name: "Voter b1", entry: { kind: "waiting", role: "backend" } },
      { id: "o1", name: "Observer o1", entry: { kind: "observer" } },
    ]);
  });

  it("returns a separate roster holding the new estimate", () => {
    const roster = supplied();

    const result = chooseCard(roster, "b1", 40);

    expect(result).not.toBe(roster);
    expect(result[1].entry).toEqual({ kind: "estimate", role: "backend", hours: 40 });
  });

  it("produces equal output for equal input", () => {
    expect(resetRound(supplied())).toEqual(resetRound(supplied()));
  });
});
