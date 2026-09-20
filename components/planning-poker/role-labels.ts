import type { RoleKey } from "@/lib/estimation/roles";

/**
 * The user-facing name of each role key, as `docs/product-plan.md` writes them.
 *
 * The design export shortens these in the sidebar ("BACK-END", "BUSINESS
 * ANALYSIS"); the product plan controls product wording, so these labels win.
 */
export const ROLE_LABELS: Record<RoleKey, string> = {
  qa: "QA",
  backend: "Backend",
  frontend: "Frontend",
  ba: "Business Analyst",
  pm: "PM",
};
