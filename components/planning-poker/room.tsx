"use client";

import { useState } from "react";
import type { DeckHours } from "@/lib/estimation/deck";
import {
  chooseCard,
  chooseUnsure,
  countCompleted,
  resetRound,
  toggleAway,
  type Participant,
} from "@/lib/estimation/round";
import {
  buildRoster,
  buildTask,
  validateSetup,
  type RoundTask,
  type SetupDraft,
} from "@/lib/estimation/roster";
import { calculateRoundStatistics } from "@/lib/estimation/statistics";
import { ActingAsSelect } from "./acting-as-select";
import { EstimateDeck } from "./estimate-deck";
import { ParticipantList } from "./participant-list";
import { RoundResults } from "./round-results";
import { EXAMPLE_SETUP } from "./seed-roster";
import { SetupScreen } from "./setup-screen";
import { TaskCard } from "./task-card";
import { VoteStatus } from "./vote-status";

const isVoter = (participant: Participant) =>
  participant.entry.kind !== "observer";

/** The started round: its task and its roster, or `null` while still in setup. */
type Round = {
  readonly task: RoundTask;
  readonly roster: readonly Participant[];
};

/**
 * The local single-screen demo, and the one client boundary in the app.
 *
 * It owns both phases — the setup draft, and then the round's roster, who is
 * acting and whether the cards are revealed — because every control reads and
 * writes the same state. The phase is `round === null` rather than a second
 * field, so there is nothing to keep in sync.
 *
 * Every child is presentational and receives values that are already computed:
 * validation and roster construction come from `lib/estimation/roster`, the
 * round transitions from `lib/estimation/round` and the statistics from
 * `calculateRoundStatistics`, so no rule lives in a handler or in JSX.
 */
export function Room() {
  const [draft, setDraft] = useState<SetupDraft>(EXAMPLE_SETUP);
  const [round, setRound] = useState<Round | null>(null);
  const [actingVoterId, setActingVoterId] = useState("");
  const [revealed, setRevealed] = useState(false);

  const messages = validateSetup(draft);

  const handleStart = () => {
    const roster = buildRoster(draft);

    setRound({ task: buildTask(draft), roster });
    setActingVoterId(roster.filter(isVoter)[0].id);
    setRevealed(false);
  };

  if (round === null) {
    return (
      <SetupScreen
        draft={draft}
        messages={messages}
        onTitleChange={(title) => setDraft((current) => ({ ...current, title }))}
        onDescriptionChange={(description) =>
          setDraft((current) => ({ ...current, description }))
        }
        onStart={handleStart}
      />
    );
  }

  const { task, roster } = round;
  const voters = roster.filter(isVoter);
  const actingVoter =
    voters.find((voter) => voter.id === actingVoterId) ?? voters[0];
  const completed = countCompleted(roster);
  const statistics = revealed
    ? calculateRoundStatistics(roster.map((participant) => participant.entry))
    : null;

  const updateRoster = (
    next: (current: readonly Participant[]) => readonly Participant[],
  ) =>
    setRound((current) =>
      current === null ? current : { ...current, roster: next(current.roster) },
    );

  const handleChooseCard = (hours: DeckHours) =>
    updateRoster((current) => chooseCard(current, actingVoterId, hours));
  const handleChooseUnsure = () =>
    updateRoster((current) => chooseUnsure(current, actingVoterId));
  const handleToggleAway = () =>
    updateRoster((current) => toggleAway(current, actingVoterId));

  const handleReset = () => {
    updateRoster(resetRound);
    setRevealed(false);
  };

  return (
    <div className="flex flex-1 flex-col bg-[#0A0A0C] font-sans text-[#ECECF1]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-start gap-5 px-4 py-5">
        <main className="flex flex-[1_1_460px] flex-col gap-5">
          <TaskCard title={task.title} description={task.description} />

          {statistics === null ? (
            <section className="flex flex-col gap-5 rounded-[18px] border border-[#22222C] bg-[#111116] p-5">
              <ActingAsSelect
                voters={voters}
                actingVoterId={actingVoter.id}
                onSelect={setActingVoterId}
              />
              <EstimateDeck
                entry={actingVoter.entry}
                onChooseCard={handleChooseCard}
                onChooseUnsure={handleChooseUnsure}
                onToggleAway={handleToggleAway}
              />
            </section>
          ) : (
            <RoundResults statistics={statistics} />
          )}

          <VoteStatus
            completed={completed}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onReset={handleReset}
          />
        </main>

        <aside className="flex-[1_1_300px]">
          <ParticipantList roster={roster} revealed={revealed} />
        </aside>
      </div>
    </div>
  );
}
