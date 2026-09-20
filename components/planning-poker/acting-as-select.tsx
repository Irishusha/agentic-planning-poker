import type { Participant } from "@/lib/estimation/round";

type ActingAsSelectProps = {
  readonly voters: readonly Participant[];
  readonly actingVoterId: string;
  readonly onSelect: (voterId: string) => void;
};

/**
 * Picks whose deck is on screen.
 *
 * Demo-only: a real room gives every participant their own device, so this
 * control has no product equivalent and goes away at Stage 3. Only voters are
 * offered — an Observer has no deck and no Away toggle.
 */
export function ActingAsSelect({
  voters,
  actingVoterId,
  onSelect,
}: ActingAsSelectProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label
        htmlFor="acting-as"
        className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7A8C]"
      >
        Acting as
      </label>
      <select
        id="acting-as"
        value={actingVoterId}
        onChange={(event) => onSelect(event.target.value)}
        className="min-h-[44px] rounded-[12px] border border-[#26262F] bg-[#0E0E13] px-3 text-[14.5px] text-[#ECECF1] [color-scheme:dark] focus:border-[#8B5CF6] focus:outline-none"
      >
        {voters.map((voter) => (
          <option key={voter.id} value={voter.id}>
            {voter.name}
          </option>
        ))}
      </select>
    </div>
  );
}
