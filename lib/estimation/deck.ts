/**
 * The hour values of the MVP Hours deck.
 *
 * Declared as a type only: an off-deck estimate is a compile error at the
 * construction site, so no run-time validation is needed. Measures the statistics
 * derive — Average and Spread in particular — are plain numbers, not deck values.
 */
export type DeckHours = 4 | 8 | 16 | 24 | 40 | 64 | 80 | 112;

/**
 * One card of the MVP Hours deck: either a numeric card, which pairs the label a
 * voter reads with the canonical hours it stands for, or `?`, which carries no
 * hour value at all. `?` is a variant without `hours` rather than `hours: null`,
 * so an unsure choice can never be read as zero.
 */
export type DeckCard =
  | { readonly label: string; readonly hours: DeckHours }
  | { readonly label: "?" };

/**
 * The MVP Hours deck at run time, in the order a voter sees it.
 *
 * This is the single run-time source of the deck: the labels and the hours live
 * on the same card, so they cannot drift apart, and nothing that renders the deck
 * can reorder, extend or shorten it.
 */
export const MVP_DECK: readonly DeckCard[] = [
  { label: "4h", hours: 4 },
  { label: "1d", hours: 8 },
  { label: "2d", hours: 16 },
  { label: "3d", hours: 24 },
  { label: "5d", hours: 40 },
  { label: "8d", hours: 64 },
  { label: "10d", hours: 80 },
  { label: "14d", hours: 112 },
  { label: "?" },
] as const;
