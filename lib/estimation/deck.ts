/**
 * The hour values of the MVP Hours deck.
 *
 * Declared as a type only: an off-deck estimate is a compile error at the
 * construction site, so no run-time validation is needed. Measures the statistics
 * derive — Average and Spread in particular — are plain numbers, not deck values.
 */
export type DeckHours = 4 | 8 | 16 | 24 | 40 | 64 | 80 | 112;
