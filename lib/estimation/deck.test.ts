import { describe, expect, it } from "vitest";
import { MVP_DECK, type DeckCard, type DeckHours } from "./deck";

type NumericCard = Extract<DeckCard, { hours: DeckHours }>;

const numericCards = (): readonly NumericCard[] =>
  MVP_DECK.filter((card): card is NumericCard => "hours" in card);

describe("the MVP Hours deck", () => {
  it("holds exactly the nine cards, in deck order", () => {
    expect(MVP_DECK.map((card) => card.label)).toEqual([
      "4h",
      "1d",
      "2d",
      "3d",
      "5d",
      "8d",
      "10d",
      "14d",
      "?",
    ]);
  });

  it("pairs every numeric label with its canonical hours", () => {
    // Written out from the deck table in docs/product-plan.md.
    expect(numericCards()).toEqual([
      { label: "4h", hours: 4 },
      { label: "1d", hours: 8 },
      { label: "2d", hours: 16 },
      { label: "3d", hours: 24 },
      { label: "5d", hours: 40 },
      { label: "8d", hours: 64 },
      { label: "10d", hours: 80 },
      { label: "14d", hours: 112 },
    ]);
  });

  it("gives the unsure card no hour value at all", () => {
    const unsure = MVP_DECK.find((card) => card.label === "?");

    expect(unsure).toEqual({ label: "?" });
    expect(unsure === undefined ? true : "hours" in unsure).toBe(false);
  });
});
