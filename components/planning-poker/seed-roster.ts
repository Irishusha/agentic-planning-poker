import type { Participant } from "@/lib/estimation/round";

/**
 * Demo-only fixture data for the local single-screen round.
 *
 * Stage 1 has no landing, join flow or persistence, so the room opens on a fixed
 * roster and a fixed task instead. Both are replaced when the join flow and the
 * task composer arrive; nothing here is domain logic.
 *
 * The names are read from `design/screenshots/room-revealed-host.png`. The
 * Observer's surname is truncated in every screenshot ("Kateryna Hr…"), so the
 * label keeps the initial only rather than inventing the rest.
 */
export const SEED_ROSTER: readonly Participant[] = [
  { id: "qa-1", name: "Serhii Bondar", entry: { kind: "waiting", role: "qa" } },
  { id: "be-1", name: "Dmytro Levchenko", entry: { kind: "waiting", role: "backend" } },
  { id: "be-2", name: "Maksym Tkachuk", entry: { kind: "waiting", role: "backend" } },
  { id: "fe-1", name: "Olena Shevchuk", entry: { kind: "waiting", role: "frontend" } },
  { id: "ba-1", name: "Iryna Marchenko", entry: { kind: "waiting", role: "ba" } },
  { id: "pm-1", name: "Anna Kovalenko", entry: { kind: "waiting", role: "pm" } },
  { id: "ob-1", name: "Kateryna H.", entry: { kind: "observer" } },
];

/** The one task the room estimates, taken from the same design reference. */
export const CURRENT_TASK = {
  title: "PP-318 · Bulk import of candidates from CSV",
  description:
    "Recruiter uploads a CSV, we validate rows, show a preview with errors per row, then create " +
    "candidate records. Duplicates are matched by email. Needs a background job for files over " +
    "500 rows and an import report in the activity log.",
} as const;
