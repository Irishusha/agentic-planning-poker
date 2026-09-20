type TaskComposerProps = {
  readonly title: string;
  readonly description: string;
  readonly onTitleChange: (title: string) => void;
  readonly onDescriptionChange: (description: string) => void;
};

const FIELD =
  "w-full rounded-[12px] border border-[#26262F] bg-[#0E0E13] px-3 py-3 text-[14.5px] text-[#ECECF1] placeholder:text-[#63637A] focus:border-[#8B5CF6] focus:outline-none";

/**
 * The task the round will estimate, following `design/spec.md` §4.3.
 *
 * Both fields are labelled for assistive technology; the labels are visually
 * hidden because the design carries their meaning in the panel eyebrow and the
 * placeholders.
 */
export function TaskComposer({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: TaskComposerProps) {
  return (
    <section className="flex flex-col gap-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7A8C]">
        What are we estimating?
      </p>

      <div>
        <label htmlFor="task-title" className="sr-only">
          Task title
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Task title — e.g. PP-318 Bulk import of candidates"
          className={`${FIELD} min-h-[44px]`}
        />
      </div>

      <div>
        <label htmlFor="task-description" className="sr-only">
          Task description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Paste the description, acceptance criteria or a ticket link here."
          rows={5}
          className={`${FIELD} resize-y leading-[1.65]`}
        />
      </div>
    </section>
  );
}
