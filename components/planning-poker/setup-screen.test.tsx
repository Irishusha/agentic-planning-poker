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

    expect(screen.getByText("Estimate the CSV import")).toBeInTheDocument();
    expect(screen.getByText("Rows are matched by email.")).toBeInTheDocument();
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

describe("the operator builds the roster", () => {
  it("adds a participant with a name and a role", () => {
    render(<Room />);

    addParticipant();
    type(nameField(""), "Ivan Petrenko");
    fireEvent.change(partSelect("Ivan Petrenko"), { target: { value: "frontend" } });
    start();

    expect(rowFor("Ivan Petrenko")).toHaveTextContent("Waiting");
    expect(groupHeadings()).toContain("Frontend");
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

    expect(rowFor("Ivan Petrenko")).toBeInTheDocument();
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
    start();

    expect(screen.getByText(/\d+ of \d+ voted/)).toHaveTextContent("0 of 2 voted");
    expect(screen.getByLabelText("Acting as")).toHaveDisplayValue("Serhii Bondar");
    expect(groupHeadings()).toEqual(["QA", "Backend"]);

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
