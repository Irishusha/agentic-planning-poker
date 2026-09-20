import type { ParticipantDraft } from "@/lib/estimation/roster";
import { ROLE_KEYS } from "@/lib/estimation/roles";
import { ROLE_LABELS } from "./role-labels";

type Part = ParticipantDraft["part"];

type RosterEditorProps = {
  readonly participants: readonly ParticipantDraft[];
  readonly onNameChange: (id: string, name: string) => void;
  readonly onPartChange: (id: string, part: Part) => void;
  readonly onRemove: (id: string) => void;
  readonly onAdd: () => void;
};

const PARTS: readonly { readonly value: Part; readonly label: string }[] = [
  ...ROLE_KEYS.map((role) => ({ value: role as Part, label: ROLE_LABELS[role] })),
  { value: "observer", label: "Observer" },
];

const CONTROL =
  "min-h-[44px] rounded-[12px] border border-[#26262F] bg-[#0E0E13] px-3 text-[14.5px] text-[#ECECF1] focus:border-[#8B5CF6] focus:outline-none";

/**
 * Who is in the round, before it starts.
 *
 * Demo-only: the design has people join themselves by link, so one operator
 * building the whole roster has no product equivalent. This stands in for the
 * Join flow on a single screen and goes away at Stage 3, like Acting-as. It
 * holds no state — every edit is reported upward.
 *
 * A control's accessible name carries the participant it acts on, so assistive
 * technology never announces six identical "Name" fields. An unnamed row falls
 * back to its position, because "Name for " would announce nothing.
 */
export function RosterEditor({
  participants,
  onNameChange,
  onPartChange,
  onRemove,
  onAdd,
}: RosterEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {participants.map((participant, index) => {
          const who =
            participant.name.trim() === ""
              ? `participant ${index + 1}`
              : participant.name;

          return (
            <li key={participant.id} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                aria-label={`Name for ${who}`}
                value={participant.name}
                onChange={(event) => onNameChange(participant.id, event.target.value)}
                placeholder="Enter a name"
                className={`${CONTROL} min-w-0 flex-[2_1_140px] placeholder:text-[#63637A]`}
              />
              <select
                aria-label={`Part for ${who}`}
                value={participant.part}
                onChange={(event) =>
                  onPartChange(participant.id, event.target.value as Part)
                }
                className={`${CONTROL} flex-[1_1_120px] [color-scheme:dark]`}
              >
                {PARTS.map((part) => (
                  <option key={part.value} value={part.value}>
                    {part.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={`Remove ${who}`}
                onClick={() => onRemove(participant.id)}
                className="min-h-[44px] shrink-0 rounded-[12px] border border-[#2A2A35] px-3 text-[14.5px] text-[#9A9AAB] transition-colors hover:border-[#7C5CC4] hover:text-[#ECECF1]"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      <div>
        <button
          type="button"
          onClick={onAdd}
          className="min-h-[44px] rounded-[12px] border border-dashed border-[#4A3A66] px-4 text-[14.5px] text-[#D9C8F5] transition-colors hover:border-[#8B6BD6]"
        >
          Add participant
        </button>
      </div>
    </div>
  );
}
