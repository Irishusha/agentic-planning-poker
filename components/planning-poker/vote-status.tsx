import type { Completed } from "@/lib/estimation/round";

type VoteStatusProps = {
  readonly completed: Completed;
  readonly revealed: boolean;
  readonly onReveal: () => void;
  readonly onReset: () => void;
};

const BUTTON_BASE =
  "min-h-[46px] rounded-[12px] px-5 text-[14.5px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]";

/**
 * The round's progress and its two controls.
 *
 * Reveal is present at all times and disabled only while every voter is still
 * Waiting — one completed action is enough, and it need not be a numeric
 * estimate. Reset stays available after a reveal so the round can be re-run.
 */
export function VoteStatus({
  completed,
  revealed,
  onReveal,
  onReset,
}: VoteStatusProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[#22222C] bg-[#111116] p-5">
      {revealed ? (
        <p className="text-[14.5px] text-[#9A9AAB]">
          Cards are revealed · reset to run the round again
        </p>
      ) : (
        <p className="flex items-center gap-2.5 text-[14.5px] text-[#9A9AAB]">
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full bg-[#B07CFF]"
          />
          {completed.n} of {completed.m} voted · cards stay hidden until the host
          reveals
        </p>
      )}

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onReveal}
          disabled={completed.n === 0}
          className={`${BUTTON_BASE} bg-[#B07CFF] text-[#1A1024] shadow-[0_10px_30px_rgba(139,92,246,.28)] enabled:hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:bg-[#2A2A35] disabled:text-[#7A7A8C] disabled:shadow-none`}
        >
          Reveal cards
        </button>
        <button
          type="button"
          onClick={onReset}
          className={`${BUTTON_BASE} border border-[#2A2A35] bg-transparent text-[#ECECF1] hover:border-[#7C5CC4]`}
        >
          Reset votes
        </button>
      </div>
    </div>
  );
}
