import { formatDuration } from "@/lib/estimation/duration";
import type { Participant } from "@/lib/estimation/round";
import { ROLE_KEYS } from "@/lib/estimation/roles";
import type { RoundEntry } from "@/lib/estimation/statistics";
import { ROLE_LABELS } from "./role-labels";

type ParticipantListProps = {
  readonly roster: readonly Participant[];
  readonly revealed: boolean;
};

/**
 * What one participant's badge reads.
 *
 * Before the reveal a chosen card and `?` both read `Voted`, so `?` is as
 * hidden as a number; only after the reveal does the value itself appear.
 */
function statusLabel(entry: RoundEntry, revealed: boolean): string {
  switch (entry.kind) {
    case "observer":
      return "Observer";
    case "waiting":
      return "Waiting";
    case "away":
      return "Away";
    case "unsure":
      return revealed ? "?" : "Voted";
    case "estimate":
      return revealed ? formatDuration(entry.hours) : "Voted";
  }
}

const BADGE_BASE =
  "shrink-0 rounded-[10px] border px-2.5 py-1 font-mono text-[12px]";

function badgeClass(entry: RoundEntry): string {
  if (entry.kind === "observer") {
    return `${BADGE_BASE} border-[#26262F] bg-[#0E0E13] text-[#7A7A8C]`;
  }

  if (entry.kind === "waiting") {
    return `${BADGE_BASE} border-[#26262F] bg-[#0E0E13] text-[#9A9AAB]`;
  }

  return `${BADGE_BASE} border-[#6B54A0] bg-[#241A3A] text-[#C9A6FF]`;
}

function Row({
  participant,
  revealed,
}: {
  readonly participant: Participant;
  readonly revealed: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-[12px] border border-[#22222C] bg-[#0E0E13] px-3 py-2.5">
      <span className="truncate text-[14.5px] text-[#ECECF1]" title={participant.name}>
        {participant.name}
      </span>
      <span className={badgeClass(participant.entry)}>
        {statusLabel(participant.entry, revealed)}
      </span>
    </li>
  );
}

/** The roster, grouped by role, with Observers listed outside the voting groups. */
export function ParticipantList({ roster, revealed }: ParticipantListProps) {
  const groups = ROLE_KEYS.map((role) => ({
    role,
    members: roster.filter(
      (participant) =>
        participant.entry.kind !== "observer" && participant.entry.role === role,
    ),
  }));
  const observers = roster.filter(
    (participant) => participant.entry.kind === "observer",
  );

  return (
    <section
      aria-labelledby="participants-heading"
      className="flex flex-col gap-4 rounded-[18px] border border-[#22222C] bg-[#111116] p-5"
    >
      <h2
        id="participants-heading"
        className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7A8C]"
      >
        Participants
      </h2>

      {groups.map(({ role, members }) => (
        <div key={role} className="flex flex-col gap-2">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#63637A]">
            {ROLE_LABELS[role]}
          </h3>
          <ul className="flex flex-col gap-2">
            {members.map((participant) => (
              <Row key={participant.id} participant={participant} revealed={revealed} />
            ))}
          </ul>
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#63637A]">
          Observers
        </h3>
        <ul className="flex flex-col gap-2">
          {observers.map((participant) => (
            <Row key={participant.id} participant={participant} revealed={revealed} />
          ))}
        </ul>
      </div>
    </section>
  );
}
