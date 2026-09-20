import type { Participant } from "./round";
import type { RoleKey } from "./roles";

/**
 * One participant as the operator is configuring them, before the round starts.
 *
 * `part` is a single value rather than a role plus an `isObserver` flag, so
 * "an Observer carries no role" cannot be contradicted by two fields drifting
 * apart — the same reasoning that shaped `RoundEntry`.
 */
export type ParticipantDraft = {
  readonly id: string;
  readonly name: string;
  readonly part: RoleKey | "observer";
};

/** Everything the operator configures before starting a round. */
export type SetupDraft = {
  readonly title: string;
  readonly description: string;
  readonly participants: readonly ParticipantDraft[];
};

/** The task as the round displays it, normalised out of the draft. */
export type RoundTask = {
  readonly title: string;
  readonly description: string;
};

/**
 * Every reason the configuration cannot start a round, in a fixed order so the
 * rendered list is deterministic. An empty list means the round can start.
 */
export function validateSetup(draft: SetupDraft): readonly string[] {
  const messages: string[] = [];
  const names = draft.participants.map((participant) => participant.name.trim());

  if (draft.title.trim() === "") {
    messages.push("Enter a task title");
  }

  if (names.some((name) => name === "")) {
    messages.push("Give every participant a name");
  }

  const folded = names.map((name) => name.toLowerCase());
  if (new Set(folded).size !== folded.length) {
    messages.push("Participant names must be unique");
  }

  if (!draft.participants.some((participant) => participant.part !== "observer")) {
    messages.push("Add at least one voter");
  }

  return messages;
}

/**
 * Turns the configured participants into the round's roster.
 *
 * Each draft becomes exactly one entry, in the configured order: a voter starts
 * Waiting carrying their role, an Observer carries none. Names are trimmed here,
 * so the round only ever sees the normalised name.
 */
export function buildRoster(draft: SetupDraft): readonly Participant[] {
  return draft.participants.map((participant) => ({
    id: participant.id,
    name: participant.name.trim(),
    entry:
      participant.part === "observer"
        ? { kind: "observer" }
        : { kind: "waiting", role: participant.part },
  }));
}

/**
 * Turns the configured task into the task the round displays.
 *
 * Trimming happens on the way out of setup, so the draft keeps exactly what the
 * operator typed while the round only ever receives normalised text.
 */
export function buildTask(draft: SetupDraft): RoundTask {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
  };
}
