import type { SetupDraft } from "@/lib/estimation/roster";
import { TaskComposer } from "./task-composer";

type SetupScreenProps = {
  readonly draft: SetupDraft;
  readonly messages: readonly string[];
  readonly onTitleChange: (title: string) => void;
  readonly onDescriptionChange: (description: string) => void;
  readonly onStart: () => void;
};

/**
 * Everything the operator configures before a round: the task, the roster and
 * the control that starts the round.
 *
 * It holds no state — the draft and the validation messages are computed by the
 * room and handed down, so the round keeps a single owner.
 */
export function SetupScreen({
  draft,
  messages,
  onTitleChange,
  onDescriptionChange,
  onStart,
}: SetupScreenProps) {
  return (
    <div className="flex flex-1 flex-col bg-[#0A0A0C] font-sans text-[#ECECF1]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-start gap-5 px-4 py-5">
        <main className="flex flex-[1_1_460px] flex-col gap-5 rounded-[18px] border border-[#22222C] bg-[#111116] p-5">
          <TaskComposer
            title={draft.title}
            description={draft.description}
            onTitleChange={onTitleChange}
            onDescriptionChange={onDescriptionChange}
          />

          {messages.length > 0 ? (
            <ul
              aria-live="polite"
              className="flex flex-col gap-1 rounded-[12px] border border-[#4A3A66] bg-[#1B1522] p-3"
            >
              {messages.map((message) => (
                <li key={message} className="text-[14.5px] text-[#D9C8F5]">
                  {message}
                </li>
              ))}
            </ul>
          ) : null}

          <div>
            <button
              type="button"
              onClick={onStart}
              disabled={messages.length > 0}
              className="min-h-[46px] rounded-[12px] bg-[#B07CFF] px-5 text-[14.5px] font-semibold text-[#1A1024] shadow-[0_10px_30px_rgba(139,92,246,.28)] transition-colors enabled:hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:bg-[#2A2A35] disabled:text-[#7A7A8C] disabled:shadow-none"
            >
              Start round
            </button>
          </div>
        </main>

        <aside className="flex flex-[1_1_300px] flex-col gap-4 rounded-[18px] border border-[#22222C] bg-[#111116] p-5">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7A8C]">
            Participants
          </h2>
          <ul className="flex flex-col gap-2">
            {draft.participants.map((participant) => (
              <li
                key={participant.id}
                className="rounded-[12px] border border-[#22222C] bg-[#0E0E13] px-3 py-2.5 text-[14.5px] text-[#ECECF1]"
              >
                {participant.name}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
