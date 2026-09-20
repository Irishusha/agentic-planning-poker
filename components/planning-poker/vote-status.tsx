import type { Completed } from "@/lib/estimation/round";

type VoteStatusProps = {
  readonly completed: Completed;
  readonly revealed: boolean;
  readonly onReveal: () => void;
  readonly onReset: () => void;
  readonly onNextTask: () => void;
};

const BUTTON_BASE =
  "min-h-[46px] rounded-[12px] px-5 text-[14.5px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]";

const PRIMARY =
  "bg-[#B07CFF] text-[#1A1024] shadow-[0_10px_30px_rgba(139,92,246,.28)] enabled:hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:bg-[#2A2A35] disabled:text-[#7A7A8C] disabled:shadow-none";

const GHOST =
  "border border-[#2A2A35] bg-transparent text-[#ECECF1] hover:border-[#7C5CC4]";

/**
 * The round's progress and its controls.
 *
 * Reveal is present at all times: disabled while every voter is still Waiting —
 * one completed action is enough, and it need not be a numeric estimate — and
 * disabled again once the cards are shown, so a revealed round cannot be
 * revealed a second time. Reset stays available after a reveal so the round can
 * be re-run.
 *
 * Next task exists only once the cards are revealed, because it is the one way
 * out of a round and a round in progress must have none. It ends the round and
 * hands the team back to setup, where Reset repeats this task with this roster —
 * so the two carry different names and different weight, and the revealed
 * status line names both rather than leaving colour to carry the difference.
 */
export function VoteStatus({
  completed,
  revealed,
  onReveal,
  onReset,
  onNextTask,
}: VoteStatusProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[#22222C] bg-[#111116] p-5">
      {revealed ? (
        <p className="text-[14.5px] text-[#9A9AAB]">
          Cards are revealed · reset the votes to estimate this task again, or
          move on to the next task
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
          disabled={revealed || completed.n === 0}
          className={`${BUTTON_BASE} ${PRIMARY}`}
        >
          Reveal cards
        </button>
        <button
          type="button"
          onClick={onReset}
          className={`${BUTTON_BASE} ${GHOST}`}
        >
          Reset votes
        </button>
        {revealed ? (
          <button
            type="button"
            onClick={onNextTask}
            className={`${BUTTON_BASE} ${PRIMARY}`}
          >
            Next task
          </button>
        ) : null}
      </div>
    </div>
  );
}
