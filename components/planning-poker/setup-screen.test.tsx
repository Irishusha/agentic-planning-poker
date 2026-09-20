import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Room } from "./room";

// Vitest runs without `globals`, so React Testing Library's automatic cleanup
// never registers. Unmounting between tests keeps each render isolated.
afterEach(cleanup);

const EXAMPLE_NAMES = [
  "Serhii Bondar",
  "Dmytro Levchenko",
  "Maksym Tkachuk",
  "Olena Shevchuk",
  "Iryna Marchenko",
  "Anna Kovalenko",
  "Kateryna H.",
];

const titleField = () => screen.getByLabelText("Task title");
const descriptionField = () => screen.getByLabelText("Task description");
const startButton = () => screen.getByRole("button", { name: /start round/i });
const start = () => fireEvent.click(startButton());

const type = (field: HTMLElement, value: string) =>
  fireEvent.change(field, { target: { value } });

/**
 * A configured name may be shown as text or as the value of an editable field,
 * so the roster can become editable without rewriting this assertion.
 */
const shownNames = () =>
  EXAMPLE_NAMES.filter(
    (name) =>
      screen.queryByText(name) !== null ||
      screen.queryByDisplayValue(name) !== null,
  );

describe("setup is the application's entry point", () => {
  it("opens prefilled with the example task and roster", () => {
    render(<Room />);

    expect(titleField()).toHaveValue("PP-318 · Bulk import of candidates from CSV");
    expect(descriptionField()).toHaveDisplayValue(/Recruiter uploads a CSV/);
    expect(shownNames()).toEqual(EXAMPLE_NAMES);
    expect(startButton()).toBeEnabled();
  });

  it("does not show the round before it starts", () => {
    render(<Room />);

    expect(screen.queryByRole("button", { name: "5d" })).toBeNull();
    expect(screen.queryByRole("button", { name: /coffee|back soon/i })).toBeNull();
    expect(screen.queryByText(/\d+ of \d+ voted/)).toBeNull();
    expect(screen.queryByRole("button", { name: /reveal/i })).toBeNull();

    for (const measure of ["Lowest", "Average", "Highest", "Spread", "Votes"]) {
      expect(screen.queryByText(measure)).toBeNull();
    }
  });
});

describe("the operator enters the task", () => {
  it("blocks the start on an empty title", () => {
    render(<Room />);

    type(titleField(), "");

    expect(screen.getByText("Enter a task title")).toBeInTheDocument();
    expect(startButton()).toBeDisabled();
  });

  it("blocks the start on a whitespace-only title", () => {
    render(<Room />);

    type(titleField(), "   ");

    expect(screen.getByText("Enter a task title")).toBeInTheDocument();
    expect(startButton()).toBeDisabled();
  });

  it("allows an empty description", () => {
    render(<Room />);

    type(titleField(), "Estimate the CSV import");
    type(descriptionField(), "");

    expect(screen.queryByText("Enter a task title")).toBeNull();
    expect(startButton()).toBeEnabled();
  });
});

describe("starting hands the configured task to the round", () => {
  it("starts the round on the example task", () => {
    render(<Room />);

    start();

    expect(
      screen.getByText(/Bulk import of candidates from CSV/),
    ).toBeInTheDocument();
    expect(screen.getByText(/\d+ of \d+ voted/)).toHaveTextContent("0 of 6 voted");
  });

  it("leaves no setup control on screen once the round starts", () => {
    render(<Room />);

    start();

    expect(screen.queryByLabelText("Task title")).toBeNull();
    expect(screen.queryByLabelText("Task description")).toBeNull();
    expect(screen.queryByRole("button", { name: /start round/i })).toBeNull();
  });

  it("carries a custom title and description into the round, trimmed", () => {
    render(<Room />);

    type(titleField(), "  Estimate the CSV import  ");
    type(descriptionField(), "  Rows are matched by email.  ");
    start();

    // Exact raw text: RTL would match the untrimmed strings just as happily.
    expect(exactTextOf(/Estimate the CSV import/)).toBe("Estimate the CSV import");
    expect(exactTextOf(/Rows are matched by email\./)).toBe(
      "Rows are matched by email.",
    );
    expect(screen.queryByText(/Bulk import of candidates from CSV/)).toBeNull();
    expect(screen.queryByText(/Recruiter uploads a CSV/)).toBeNull();
  });

  it("carries an empty description into the round as no description", () => {
    render(<Room />);

    type(titleField(), "Estimate the CSV import");
    type(descriptionField(), "");
    start();

    expect(screen.getByText("Estimate the CSV import")).toBeInTheDocument();
    expect(screen.queryByText(/Recruiter uploads a CSV/)).toBeNull();
  });
});

describe("validation gates the start and explains itself", () => {
  it("re-enables the start once the last error is corrected", () => {
    render(<Room />);

    type(titleField(), "");
    expect(startButton()).toBeDisabled();

    type(titleField(), "Estimate the CSV import");

    expect(screen.queryByText("Enter a task title")).toBeNull();
    expect(startButton()).toBeEnabled();
  });
});

const nameField = (name: string) =>
  screen.getByDisplayValue(name) as HTMLInputElement;
const partSelect = (name: string) =>
  screen.getByLabelText(`Part for ${name}`) as HTMLSelectElement;
const removeButton = (name: string) =>
  screen.getByRole("button", { name: `Remove ${name}` });
const addParticipant = () =>
  fireEvent.click(screen.getByRole("button", { name: /add participant/i }));

const participantsRegion = () =>
  within(screen.getByRole("region", { name: "Participants" }));
const groupHeadings = () =>
  participantsRegion()
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
const rowFor = (name: string) =>
  participantsRegion().getByText(name).closest("li");

/** The block a role heading introduces, so membership can be asserted per group. */
const groupFor = (label: string) =>
  participantsRegion()
    .getAllByRole("heading", { level: 3 })
    .find((heading) => heading.textContent === label)
    ?.closest("div") ?? null;

/**
 * The names listed under one role, read as raw text.
 *
 * RTL's matchers normalise whitespace, so `getByText("Ivan Petrenko")` would
 * also match an untrimmed `"  Ivan Petrenko  "`. Reading `textContent` keeps a
 * trimming regression visible.
 */
const namesIn = (label: string) => {
  const group = groupFor(label);

  return group === null
    ? []
    : within(group)
        .getAllByRole("listitem")
        .map((item) => item.querySelector("span")?.textContent ?? "");
};

/** Finds an element by a loose matcher, then asserts its exact, raw text. */
const exactTextOf = (matcher: RegExp) => screen.getByText(matcher).textContent;

describe("the operator builds the roster", () => {
  it("adds a participant with a name and a role", () => {
    render(<Room />);

    addParticipant();
    type(nameField(""), "Ivan Petrenko");
    fireEvent.change(partSelect("Ivan Petrenko"), { target: { value: "frontend" } });
    start();

    // Inside the Frontend group, not merely somewhere on screen: the prefilled
    // Olena Shevchuk already makes a "Frontend heading exists" check pass.
    expect(namesIn("Frontend")).toEqual(["Olena Shevchuk", "Ivan Petrenko"]);
    expect(namesIn("QA")).toEqual(["Serhii Bondar"]);
    expect(participantsRegion().getAllByRole("listitem")).toHaveLength(8);
    expect(rowFor("Ivan Petrenko")).toHaveTextContent("Waiting");
  });

  it("renames a participant", () => {
    render(<Room />);

    type(nameField("Serhii Bondar"), "Serhii B.");
    start();

    expect(rowFor("Serhii B.")).toBeInTheDocument();
    expect(screen.queryByText("Serhii Bondar")).toBeNull();
  });

  it("changes a participant's role", () => {
    render(<Room />);

    fireEvent.change(partSelect("Olena Shevchuk"), { target: { value: "backend" } });
    start();

    expect(groupHeadings()).not.toContain("Frontend");
    expect(rowFor("Olena Shevchuk")).toBeInTheDocument();
  });

  it("removes a participant", () => {
    render(<Room />);

    fireEvent.click(removeButton("Maksym Tkachuk"));
    start();

    expect(screen.getByText(/\d+ of \d+ voted/)).toHaveTextContent("0 of 5 voted");
  });

  it("offers exactly the five roles and Observer", () => {
    render(<Room />);

    expect(
      within(partSelect("Serhii Bondar"))
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["QA", "Backend", "Frontend", "Business Analyst", "PM", "Observer"]);
  });

  it("trims a name on the way into the round", () => {
    render(<Room />);

    addParticipant();
    type(nameField(""), "  Ivan Petrenko  ");
    // The label carries the typed name; RTL normalises its whitespace.
    fireEvent.change(partSelect("Ivan Petrenko"), { target: { value: "pm" } });
    start();

    // Raw text, so an untrimmed "  Ivan Petrenko  " cannot satisfy this.
    expect(namesIn("PM")).toEqual(["Anna Kovalenko", "Ivan Petrenko"]);
    expect(participantsRegion().getByText(/Ivan Petrenko/).textContent).toBe(
      "Ivan Petrenko",
    );
  });
});

describe("an Observer is configured without a role", () => {
  it("keeps an added Observer out of the voting", () => {
    render(<Room />);

    addParticipant();
    type(nameField(""), "Ivan Petrenko");
    fireEvent.change(partSelect("Ivan Petrenko"), { target: { value: "observer" } });
    start();

    expect(screen.getByText(/\d+ of \d+ voted/)).toHaveTextContent("0 of 6 voted");
    expect(
      within(screen.getByLabelText("Acting as"))
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).not.toContain("Ivan Petrenko");
  });

  it("starts a round with no Observer at all", () => {
    render(<Room />);

    fireEvent.click(removeButton("Kateryna H."));
    start();

    expect(screen.getByText(/\d+ of \d+ voted/)).toHaveTextContent("0 of 6 voted");
    expect(groupHeadings()).not.toContain("Observers");
  });
});

describe("roster validation gates the start", () => {
  it("blocks an unnamed participant", () => {
    render(<Room />);

    addParticipant();

    expect(screen.getByText("Give every participant a name")).toBeInTheDocument();
    expect(startButton()).toBeDisabled();
  });

  it("blocks a duplicate name differing only by case", () => {
    render(<Room />);

    addParticipant();
    type(nameField(""), "anna kovalenko");

    expect(screen.getByText("Participant names must be unique")).toBeInTheDocument();
    expect(startButton()).toBeDisabled();
  });

  it("blocks a roster with no voter", () => {
    render(<Room />);

    for (const name of [
      "Serhii Bondar",
      "Dmytro Levchenko",
      "Maksym Tkachuk",
      "Olena Shevchuk",
      "Iryna Marchenko",
      "Anna Kovalenko",
    ]) {
      fireEvent.change(partSelect(name), { target: { value: "observer" } });
    }

    expect(screen.getByText("Add at least one voter")).toBeInTheDocument();
    expect(startButton()).toBeDisabled();
  });

  it("reports the title and the name errors together", () => {
    render(<Room />);

    type(titleField(), "");
    addParticipant();

    expect(screen.getByText("Enter a task title")).toBeInTheDocument();
    expect(screen.getByText("Give every participant a name")).toBeInTheDocument();
    expect(startButton()).toBeDisabled();
  });

  it("starts a round with a single voter", () => {
    render(<Room />);

    for (const name of [
      "Dmytro Levchenko",
      "Maksym Tkachuk",
      "Olena Shevchuk",
      "Iryna Marchenko",
      "Anna Kovalenko",
      "Kateryna H.",
    ]) {
      fireEvent.click(removeButton(name));
    }
    start();

    expect(screen.getByText(/\d+ of \d+ voted/)).toHaveTextContent("0 of 1 voted");
    expect(groupHeadings()).toEqual(["QA"]);
  });
});

describe("a custom roster reaches the round and its statistics", () => {
  it("reports only the configured roles, with the rest unavailable", () => {
    render(<Room />);

    for (const name of [
      "Maksym Tkachuk",
      "Olena Shevchuk",
      "Iryna Marchenko",
      "Anna Kovalenko",
      "Kateryna H.",
    ]) {
      fireEvent.click(removeButton(name));
    }
    type(titleField(), "Estimate the CSV import");
    type(descriptionField(), "Rows are matched by email.");
    start();

    expect(exactTextOf(/Estimate the CSV import/)).toBe("Estimate the CSV import");
    expect(exactTextOf(/Rows are matched by email\./)).toBe(
      "Rows are matched by email.",
    );
    expect(screen.queryByText(/Bulk import of candidates from CSV/)).toBeNull();
    expect(screen.queryByText(/Recruiter uploads a CSV/)).toBeNull();

    expect(screen.getByText(/\d+ of \d+ voted/)).toHaveTextContent("0 of 2 voted");
    expect(screen.getByLabelText("Acting as")).toHaveDisplayValue("Serhii Bondar");
    expect(groupHeadings()).toEqual(["QA", "Backend"]);
    expect(rowFor("Serhii Bondar")).toHaveTextContent("Waiting");
    expect(rowFor("Dmytro Levchenko")).toHaveTextContent("Waiting");

    // Serhii 2d = 16h, Dmytro 5d = 40h: mean 56/2 = 28h -> 3.5d, spread 24h -> 3d.
    fireEvent.click(screen.getByRole("button", { name: "2d" }));
    fireEvent.change(screen.getByLabelText("Acting as"), {
      target: {
        value: within(screen.getByLabelText("Acting as"))
          .getByRole<HTMLOptionElement>("option", { name: "Dmytro Levchenko" })
          .value,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "5d" }));
    fireEvent.click(screen.getByRole("button", { name: /reveal/i }));

    const results = within(screen.getByRole("region", { name: "Results" }));
    const valuesOf = (label: string) =>
      within(
        results.getByRole("row", { name: (n) => n.startsWith(label) }),
      )
        .getAllByRole("cell")
        .map((cell) => cell.textContent);

    expect(valuesOf("Overall")).toEqual(["2d", "3.5d", "5d", "3d", "2"]);
    expect(valuesOf("QA")).toEqual(["2d", "2d", "2d", "0h", "1"]);
    expect(valuesOf("Backend")).toEqual(["5d", "5d", "5d", "0h", "1"]);
    expect(valuesOf("Frontend")).toEqual(["—", "—", "—", "—", "0"]);
    expect(valuesOf("Business Analyst")).toEqual(["—", "—", "—", "—", "0"]);
    expect(valuesOf("PM")).toEqual(["—", "—", "—", "—", "0"]);
  });
});

const selectVoter = (name: string) => {
  const select = screen.getByLabelText("Acting as");
  const option = within(select).getByRole<HTMLOptionElement>("option", { name });

  fireEvent.change(select, { target: { value: option.value } });
};

const chooseCard = (label: string) =>
  fireEvent.click(screen.getByRole("button", { name: label }));
const toggleAway = () =>
  fireEvent.click(screen.getByRole("button", { name: /coffee|back soon/i }));
const reveal = () =>
  fireEvent.click(screen.getByRole("button", { name: /reveal/i }));
const nextTask = () =>
  fireEvent.click(screen.getByRole("button", { name: /next task/i }));
const progress = () => screen.getByText(/\d+ of \d+ voted/);

/**
 * The configured names in the order the roster editor lists them, read from the
 * name fields themselves so a reordering cannot pass unnoticed.
 */
const draftNames = () =>
  screen
    .getAllByRole("textbox")
    .filter((field) => field.getAttribute("aria-label")?.startsWith("Name for "))
    .map((field) => (field as HTMLInputElement).value);

/** The configured parts in the same order; the part selects are the only ones. */
const draftParts = () =>
  screen
    .getAllByRole("combobox")
    .map((select) => (select as HTMLSelectElement).value);

const EXAMPLE_PARTS = [
  "qa",
  "backend",
  "backend",
  "frontend",
  "ba",
  "pm",
  "observer",
];

/** Reveals the prefilled example round so it can be left with `Next task`. */
const revealExampleRound = () => {
  start();
  selectVoter("Serhii Bondar");
  chooseCard("2d");
  selectVoter("Anna Kovalenko");
  toggleAway();
  reveal();
};

describe("setup is re-entered for the next task with the same team", () => {
  it("keeps the team and clears the task", () => {
    render(<Room />);
    revealExampleRound();
    nextTask();

    expect(draftNames()).toEqual(EXAMPLE_NAMES);
    expect(draftParts()).toEqual(EXAMPLE_PARTS);
    expect(titleField()).toHaveValue("");
    expect(descriptionField()).toHaveValue("");
    expect(screen.getByText("Enter a task title")).toBeInTheDocument();
    expect(startButton()).toBeDisabled();
  });

  it("re-enables the start on a new title alone", () => {
    render(<Room />);
    revealExampleRound();
    nextTask();

    type(titleField(), "PP-319 Duplicate candidate merge");

    expect(screen.queryByText("Enter a task title")).toBeNull();
    expect(startButton()).toBeEnabled();
  });

  it("lets the preserved roster be adjusted before starting", () => {
    render(<Room />);
    revealExampleRound();
    nextTask();

    fireEvent.click(removeButton("Maksym Tkachuk"));
    fireEvent.change(partSelect("Olena Shevchuk"), {
      target: { value: "observer" },
    });
    type(titleField(), "PP-319 Duplicate candidate merge");
    start();

    expect(progress()).toHaveTextContent("0 of 4 voted");
    expect(rowFor("Olena Shevchuk")).toHaveTextContent("Observer");
    expect(screen.queryByText("Maksym Tkachuk")).toBeNull();
  });

  it("starts the next round carrying nothing from the previous one", () => {
    render(<Room />);
    start();
    selectVoter("Serhii Bondar");
    chooseCard("2d");
    selectVoter("Dmytro Levchenko");
    chooseCard("5d");
    selectVoter("Iryna Marchenko");
    chooseCard("?");
    selectVoter("Anna Kovalenko");
    toggleAway();
    reveal();
    nextTask();

    type(titleField(), "PP-319 Duplicate candidate merge");
    start();

    for (const name of EXAMPLE_NAMES.slice(0, 6)) {
      expect(rowFor(name)).toHaveTextContent("Waiting");
    }

    expect(progress()).toHaveTextContent("0 of 6 voted");
    expect(screen.queryByRole("region", { name: "Results" })).toBeNull();
    expect(screen.getByRole("button", { name: /reveal/i })).toBeDisabled();
    expect(screen.getByText("PP-319 Duplicate candidate merge")).toBeInTheDocument();
    expect(screen.queryByText(/Bulk import of candidates from CSV/)).toBeNull();

    for (const carried of ["2d", "5d", "?", "Away"]) {
      expect(participantsRegion().queryByText(carried)).toBeNull();
    }
  });

  it("selects the first voter of the roster as it now stands", () => {
    render(<Room />);
    revealExampleRound();
    nextTask();

    fireEvent.click(removeButton("Serhii Bondar"));
    type(titleField(), "PP-319 Duplicate candidate merge");
    start();

    const actingAs = screen.getByLabelText("Acting as");

    expect(actingAs).toHaveDisplayValue("Dmytro Levchenko");
    expect(
      within(actingAs)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).not.toContain("Serhii Bondar");
  });

  // If the participant-id sequence restarted, the added row would share an id
  // with Ivan Petrenko and naming one would rename the other.
  it("adds a participant that is separate from every preserved one", () => {
    render(<Room />);

    addParticipant();
    type(screen.getByLabelText("Name for participant 8"), "Ivan Petrenko");
    fireEvent.change(partSelect("Ivan Petrenko"), {
      target: { value: "frontend" },
    });
    revealExampleRound();
    nextTask();

    addParticipant();
    type(screen.getByLabelText("Name for participant 9"), "Yulia Popova");

    expect(draftNames()).toEqual([
      ...EXAMPLE_NAMES,
      "Ivan Petrenko",
      "Yulia Popova",
    ]);
    expect(partSelect("Ivan Petrenko")).toHaveValue("frontend");
  });

  it("puts focus in the task title field", () => {
    render(<Room />);
    revealExampleRound();
    nextTask();

    expect(titleField()).toHaveFocus();
  });

  it("reports the next round's statistics over the next round's votes alone", () => {
    render(<Room />);
    start();
    selectVoter("Serhii Bondar");
    chooseCard("2d");
    selectVoter("Dmytro Levchenko");
    chooseCard("8d");
    reveal();
    nextTask();

    type(titleField(), "PP-319 Duplicate candidate merge");
    start();
    selectVoter("Serhii Bondar");
    chooseCard("3d");
    selectVoter("Olena Shevchuk");
    chooseCard("5d");
    reveal();

    const results = within(screen.getByRole("region", { name: "Results" }));
    const valuesOf = (label: string) =>
      within(results.getByRole("row", { name: (n) => n.startsWith(label) }))
        .getAllByRole("cell")
        .map((cell) => cell.textContent);

    // 24 and 40 hours: lowest 24, mean 64/2 = 32, highest 40, spread 16.
    expect(valuesOf("Overall")).toEqual(["3d", "4d", "5d", "2d", "2"]);
    expect(valuesOf("QA")).toEqual(["3d", "3d", "3d", "0h", "1"]);
    expect(valuesOf("Frontend")).toEqual(["5d", "5d", "5d", "0h", "1"]);
    // The first round's 64 hours from Dmytro Levchenko is not carried over.
    expect(valuesOf("Backend")).toEqual(["—", "—", "—", "—", "0"]);
  });
});
