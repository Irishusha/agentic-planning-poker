import { formatDuration } from "@/lib/estimation/duration";
import { ROLE_KEYS } from "@/lib/estimation/roles";
import type { EstimateStatistics, RoundStatistics } from "@/lib/estimation/statistics";
import { ROLE_LABELS } from "./role-labels";

type RoundResultsProps = {
  readonly statistics: RoundStatistics;
};

/**
 * An unavailable measure reads as an em dash rather than a number.
 *
 * Rendering `null` here, instead of teaching the domain a placeholder, keeps
 * `formatDuration` free to treat a bad number as the caller bug it is.
 */
function measure(hours: number | null): string {
  return hours === null ? "—" : formatDuration(hours);
}

const MEASURES = ["Lowest", "Average", "Highest", "Spread"] as const;

const CELL = "px-3 py-3 text-right font-mono text-[15px] text-[#F6F0FF]";
const HEAD = "px-3 py-2 text-right font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7A8C]";

function Row({
  label,
  stats,
  emphasis,
}: {
  readonly label: string;
  readonly stats: EstimateStatistics;
  readonly emphasis: boolean;
}) {
  return (
    <tr className={emphasis ? "bg-[#1B1522]" : undefined}>
      <th
        scope="row"
        className={`px-3 py-3 text-left text-[14.5px] ${emphasis ? "font-bold text-[#D9C8F5]" : "font-semibold text-[#ECECF1]"}`}
      >
        {label}
      </th>
      <td className={CELL}>{measure(stats.lowestHours)}</td>
      <td className={CELL}>{measure(stats.averageHours)}</td>
      <td className={CELL}>{measure(stats.highestHours)}</td>
      <td className={CELL}>{measure(stats.spreadHours)}</td>
      <td className={CELL}>{stats.votes}</td>
    </tr>
  );
}

/**
 * The revealed numbers: Overall plus every supported role, in canonical order.
 *
 * Every figure comes from the statistics the domain already calculated — this
 * component formats and lays out, and derives nothing of its own.
 */
export function RoundResults({ statistics }: RoundResultsProps) {
  return (
    <section
      aria-labelledby="results-heading"
      className="rounded-[18px] border border-[#22222C] bg-[#111116] p-5"
    >
      <h2
        id="results-heading"
        className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7A8C]"
      >
        Results
      </h2>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#22222C]">
              <th scope="col" className={`${HEAD} text-left`}>
                Group
              </th>
              {MEASURES.map((name) => (
                <th key={name} scope="col" className={HEAD}>
                  {name}
                </th>
              ))}
              <th scope="col" className={HEAD}>
                Votes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C1C25]">
            <Row label="Overall" stats={statistics.overall} emphasis />
            {ROLE_KEYS.map((role) => (
              <Row
                key={role}
                label={ROLE_LABELS[role]}
                stats={statistics.byRole[role]}
                emphasis={false}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
