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
import { calculateRoundStatistics } from "@/lib/estimation/statistics";
import { ActingAsSelect } from "./acting-as-select";
import { EstimateDeck } from "./estimate-deck";
import { ParticipantList } from "./participant-list";
import { RoundResults } from "./round-results";
import { CURRENT_TASK, SEED_ROSTER } from "./seed-roster";
import { TaskCard } from "./task-card";
import { VoteStatus } from "./vote-status";

const isVoter = (participant: Participant) =>
  participant.entry.kind !== "observer";

/**
 * The local single-screen round, and the one client boundary in the app.
 *
 * It owns the whole round — the roster, who is acting and whether the cards are
 * revealed — because the deck, the Away toggle, the counter, Reveal and Reset
 * all read and write the same state. Every child is presentational and receives
 * values that are already computed: the transitions come from
 * `lib/estimation/round` and the statistics from `calculateRoundStatistics`, so
 * no rule lives in a handler or in JSX.
 */
export function Room() {
  const [roster, setRoster] = useState<readonly Participant[]>(SEED_ROSTER);
  const [actingVoterId, setActingVoterId] = useState(
    SEED_ROSTER.filter(isVoter)[0].id,
  );
  const [revealed, setRevealed] = useState(false);

  const voters = roster.filter(isVoter);
  const actingVoter =
    voters.find((voter) => voter.id === actingVoterId) ?? voters[0];
  const completed = countCompleted(roster);
  const statistics = revealed
    ? calculateRoundStatistics(roster.map((participant) => participant.entry))
    : null;

  const handleChooseCard = (hours: DeckHours) =>
    setRoster((current) => chooseCard(current, actingVoterId, hours));
  const handleChooseUnsure = () =>
    setRoster((current) => chooseUnsure(current, actingVoterId));
  const handleToggleAway = () =>
    setRoster((current) => toggleAway(current, actingVoterId));

  const handleReset = () => {
    setRoster(resetRound);
    setRevealed(false);
  };

  return (
    <div className="flex flex-1 flex-col bg-[#0A0A0C] font-sans text-[#ECECF1]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-start gap-5 px-4 py-5">
        <main className="flex flex-[1_1_460px] flex-col gap-5">
          <TaskCard
            title={CURRENT_TASK.title}
            description={CURRENT_TASK.description}
          />

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
