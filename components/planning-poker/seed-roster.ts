import type { SetupDraft } from "@/lib/estimation/roster";

/**
 * Demo-only prefill for the setup screen.
 *
 * Stage 1 has no landing, join flow or persistence, so setup opens on this
 * example instead of an empty form: a round is one click away, and the example
 * is the same team the round scenarios are written against. It is replaced when
 * the join flow arrives; nothing here is domain logic.
 *
 * The names are read from `design/screenshots/room-revealed-host.png`. The
 * Observer's surname is truncated in every screenshot ("Kateryna Hr…"), so the
 * label keeps the initial only rather than inventing the rest.
 */
export const EXAMPLE_SETUP: SetupDraft = {
  title: "PP-318 · Bulk import of candidates from CSV",
  description:
    "Recruiter uploads a CSV, we validate rows, show a preview with errors per row, then create " +
    "candidate records. Duplicates are matched by email. Needs a background job for files over " +
    "500 rows and an import report in the activity log.",
  participants: [
    { id: "qa-1", name: "Serhii Bondar", part: "qa" },
    { id: "be-1", name: "Dmytro Levchenko", part: "backend" },
    { id: "be-2", name: "Maksym Tkachuk", part: "backend" },
    { id: "fe-1", name: "Olena Shevchuk", part: "frontend" },
    { id: "ba-1", name: "Iryna Marchenko", part: "ba" },
    { id: "pm-1", name: "Anna Kovalenko", part: "pm" },
    { id: "ob-1", name: "Kateryna H.", part: "observer" },
  ],
};
