import type { DeckHours } from "./deck";
import type { RoundEntry } from "./statistics";

/**
 * One person in the room: an identity plus their state in the current round.
 *
 * The role lives inside the entry rather than beside it, so an Observer
 * structurally carries no role and an Away participant structurally carries no
 * estimate — the same guarantees `RoundEntry` already gives the statistics.
 */
export type Participant = {
  readonly id: string;
  readonly name: string;
  readonly entry: RoundEntry;
};

/** How many voters have finished their action (`n`) out of how many voters (`m`). */
export type Completed = {
  readonly n: number;
  readonly m: number;
};

/** Everything a voter can hold. An Observer is the one entry that is not one of these. */
type VoterEntry = Exclude<RoundEntry, { kind: "observer" }>;

/**
 * Rebuilds the roster with one voter's entry replaced, which is the single place
 * "a voter holds exactly one active state" is enforced: the new entry replaces the
 * old one outright, so no combination of card, `?` and Away can accumulate.
 *
 * A target that is an Observer, or that is not in the roster at all, changes
 * nothing — an Observer has no deck and no Away toggle.
 */
function replaceEntry(
  roster: readonly Participant[],
  voterId: string,
  next: (entry: VoterEntry) => VoterEntry,
): readonly Participant[] {
  return roster.map((participant) => {
    const { entry } = participant;

    if (participant.id !== voterId || entry.kind === "observer") {
      return participant;
    }

    return { ...participant, entry: next(entry) };
  });
}

/**
 * Replaces the acting voter's state with the numeric estimate they picked,
 * clearing `?` or Away in the process.
 */
export function chooseCard(
  roster: readonly Participant[],
  voterId: string,
  hours: DeckHours,
): readonly Participant[] {
  return replaceEntry(roster, voterId, ({ role }) => ({
    kind: "estimate",
    role,
    hours,
  }));
}

/** Replaces the acting voter's state with `?`, clearing an estimate or Away. */
export function chooseUnsure(
  roster: readonly Participant[],
  voterId: string,
): readonly Participant[] {
  return replaceEntry(roster, voterId, ({ role }) => ({ kind: "unsure", role }));
}

/**
 * Switches Away on for the acting voter, clearing an estimate or `?` — or off
 * again, which returns them to Waiting, the state they held before any choice.
 */
export function toggleAway(
  roster: readonly Participant[],
  voterId: string,
): readonly Participant[] {
  return replaceEntry(roster, voterId, (entry) =>
    entry.kind === "away"
      ? { kind: "waiting", role: entry.role }
      : { kind: "away", role: entry.role },
  );
}

/** Returns every voter to Waiting, leaving Observers and the roster's order alone. */
export function resetRound(
  roster: readonly Participant[],
): readonly Participant[] {
  return roster.map((participant) =>
    participant.entry.kind === "observer"
      ? participant
      : { ...participant, entry: { kind: "waiting", role: participant.entry.role } },
  );
}

/**
 * Counts finished voters against voters. A numeric estimate, `?` and Away all
 * complete a voter's action; only Waiting does not. Observers are outside both
 * numbers, so they can never make a round look unfinished.
 */
export function countCompleted(roster: readonly Participant[]): Completed {
  let n = 0;
  let m = 0;

  for (const { entry } of roster) {
    if (entry.kind === "observer") {
      continue;
    }

    m += 1;

    if (entry.kind !== "waiting") {
      n += 1;
    }
  }

  return { n, m };
}
