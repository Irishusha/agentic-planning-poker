type TaskCardProps = {
  readonly title: string;
  readonly description: string;
};

/** The round's task, displayed and never editable: Stage 1 has no composer. */
export function TaskCard({ title, description }: TaskCardProps) {
  return (
    <section className="rounded-[18px] border border-[#22222C] bg-[#111116] p-5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7A8C]">
        Current task
      </p>
      <h2 className="mt-3 text-[22px] font-bold leading-[1.3] text-[#ECECF1]">
        {title}
      </h2>
      <p className="mt-3 text-[14.5px] leading-[1.65] text-[#9A9AAB]">
        {description}
      </p>
    </section>
  );
}
