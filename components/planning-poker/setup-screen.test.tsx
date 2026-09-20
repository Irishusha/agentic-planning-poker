import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
