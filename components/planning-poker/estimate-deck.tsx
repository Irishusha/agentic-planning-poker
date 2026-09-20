import { MVP_DECK, type DeckHours } from "@/lib/estimation/deck";
import type { RoundEntry } from "@/lib/estimation/statistics";

type EstimateDeckProps = {
  readonly entry: RoundEntry;
  readonly onChooseCard: (hours: DeckHours) => void;
  readonly onChooseUnsure: () => void;
  readonly onToggleAway: () => void;
};

const CARD_BASE =
  "flex h-[72px] items-center justify-center rounded-[14px] border font-mono text-[20px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]";

// Selected is carried by weight, border and shadow as well as colour, so the
// choice is visible without relying on hue (design/spec.md, Accessibility).
const CARD_SELECTED =
  "border-[#8B6BD6] bg-[#B07CFF] font-extrabold text-[#1A1024] shadow-[0_10px_30px_rgba(139,92,246,.28)]";
const CARD_IDLE = "border-[#2A2A35] bg-[#14141A] font-bold text-[#ECECF1] hover:border-[#7C5CC4]";

const AWAY_BASE =
  "mt-4 min-h-[44px] rounded-[12px] border px-4 text-[14.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]";
const AWAY_ON = "border-[#7C5CC4] bg-[#33244D] font-semibold text-[#F0E7FF]";
const AWAY_OFF = "border-[#2B2B36] bg-[#14141A] text-[#9A9AAB] hover:border-[#7C5CC4]";

/**
 * The acting voter's deck. Away sits outside the card grid because it is a
 * status, not an estimate, and it toggles: switching it off returns the voter
 * to Waiting.
 */
export function EstimateDeck({
  entry,
  onChooseCard,
  onChooseUnsure,
  onToggleAway,
}: EstimateDeckProps) {
  const isAway = entry.kind === "away";

  return (
    <section>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7A8C]">
        Choose your estimate
      </p>

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(74px,1fr))] gap-2.5">
        {MVP_DECK.map((card) => {
          const selected =
            "hours" in card
              ? entry.kind === "estimate" && entry.hours === card.hours
              : entry.kind === "unsure";

          return (
            <button
              key={card.label}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                "hours" in card ? onChooseCard(card.hours) : onChooseUnsure()
              }
              className={`${CARD_BASE} ${selected ? CARD_SELECTED : CARD_IDLE}`}
            >
              {card.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-pressed={isAway}
        onClick={onToggleAway}
        className={`${AWAY_BASE} ${isAway ? AWAY_ON : AWAY_OFF}`}
      >
        {isAway ? "☕ Away — back soon" : "☕ Stepping out for coffee"}
      </button>
    </section>
  );
}
