import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Room } from "./room";

// Vitest runs without `globals`, so React Testing Library's automatic cleanup
// never registers. Unmounting between tests keeps each render isolated.
afterEach(cleanup);

/** The participant list, the only place a revealed value may appear. */
const participants = () =>
  within(screen.getByRole("region", { name: "Participants" }));

/** The row for one person, so a status assertion cannot match someone else. */
const rowFor = (name: string) => participants().getByText(name).closest("li");

const selectVoter = (name: string) => {
  const select = screen.getByLabelText("Acting as");
  const option = within(select).getByRole<HTMLOptionElement>("option", { name });

  fireEvent.change(select, { target: { value: option.value } });
};

const chooseCard = (label: string) =>
  fireEvent.click(screen.getByRole("button", { name: label }));

const toggleAway = () =>
  fireEvent.click(screen.getByRole("button", { name: /coffee|back soon/i }));

const revealButton = () => screen.getByRole("button", { name: /reveal/i });

const status = () => screen.getByText(/\d+ of \d+ voted/);

describe("the room opens on a fixed task and a seeded roster", () => {
  it("shows the task, the six voters, the Observer and an untouched counter", () => {
    render(<Room />);

    expect(screen.getByText(/Bulk import of candidates from CSV/)).toBeInTheDocument();
    expect(screen.getByText(/Recruiter uploads a CSV/)).toBeInTheDocument();

    for (const name of [
      "Serhii Bondar",
      "Dmytro Levchenko",
      "Maksym Tkachuk",
      "Olena Shevchuk",
      "Iryna Marchenko",
      "Anna Kovalenko",
    ]) {
      expect(rowFor(name)).toHaveTextContent("Waiting");
    }

    expect(rowFor("Kateryna H.")).toHaveTextContent("Observer");
    expect(status()).toHaveTextContent("0 of 6 voted");
  });

  it("groups the voters by role in the canonical order", () => {
    render(<Room />);

    expect(
      participants()
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["QA", "Backend", "Frontend", "Business Analyst", "PM", "Observers"]);
  });

  it("offers no way to edit the task", () => {
    render(<Room />);

    expect(screen.queryByRole("button", { name: /edit|compose|clear task/i })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});

describe("the operator chooses which voter is acting", () => {
  it("offers every voter and never the Observer", () => {
    render(<Room />);

    expect(
      within(screen.getByLabelText("Acting as"))
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      "Serhii Bondar",
      "Dmytro Levchenko",
      "Maksym Tkachuk",
      "Olena Shevchuk",
      "Iryna Marchenko",
      "Anna Kovalenko",
    ]);
  });

  it("changes no round state when the acting voter switches", () => {
    render(<Room />);

    selectVoter("Dmytro Levchenko");
    chooseCard("5d");
    selectVoter("Olena Shevchuk");

    expect(status()).toHaveTextContent("1 of 6 voted");
    expect(rowFor("Dmytro Levchenko")).toHaveTextContent("Voted");
  });
});

describe("a voter's choice replaces the previous one", () => {
  it("replaces an earlier card with the newer one", () => {
    render(<Room />);

    selectVoter("Dmytro Levchenko");
    chooseCard("5d");
    chooseCard("8d");

    expect(screen.getByRole("button", { name: "8d" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "5d" })).toHaveAttribute("aria-pressed", "false");
    expect(status()).toHaveTextContent("1 of 6 voted");
  });

  it("clears the chosen card when Away is switched on", () => {
    render(<Room />);

    selectVoter("Anna Kovalenko");
    chooseCard("3d");
    toggleAway();

    expect(rowFor("Anna Kovalenko")).toHaveTextContent("Away");
    expect(screen.getByRole("button", { name: "3d" })).toHaveAttribute("aria-pressed", "false");
    expect(status()).toHaveTextContent("1 of 6 voted");
  });

  it("clears Away when a card is chosen", () => {
    render(<Room />);

    selectVoter("Serhii Bondar");
    toggleAway();
    chooseCard("2d");

    expect(screen.getByRole("button", { name: "2d" })).toHaveAttribute("aria-pressed", "true");
    expect(rowFor("Serhii Bondar")).not.toHaveTextContent("Away");
  });

  it("returns the voter to Waiting when Away is switched off", () => {
    render(<Room />);

    selectVoter("Serhii Bondar");
    toggleAway();
    toggleAway();

    expect(rowFor("Serhii Bondar")).toHaveTextContent("Waiting");
    expect(status()).toHaveTextContent("0 of 6 voted");
  });
});

describe("estimates stay hidden until Reveal", () => {
  it("shows a status instead of any chosen value", () => {
    render(<Room />);

    selectVoter("Dmytro Levchenko");
    chooseCard("5d");
    selectVoter("Serhii Bondar");
    chooseCard("?");

    expect(rowFor("Dmytro Levchenko")).toHaveTextContent("Voted");
    expect(rowFor("Serhii Bondar")).toHaveTextContent("Voted");
    expect(participants().queryByText("5d")).toBeNull();
    expect(participants().queryByText("?")).toBeNull();

    for (const measure of ["Lowest", "Average", "Highest", "Spread", "Votes"]) {
      expect(screen.queryByText(measure)).toBeNull();
    }
  });
});

describe("the progress status reports N of M", () => {
  it("counts an estimate, an unsure choice and Away, but not the Observer", () => {
    render(<Room />);

    selectVoter("Serhii Bondar");
    chooseCard("2d");
    selectVoter("Iryna Marchenko");
    chooseCard("?");
    selectVoter("Anna Kovalenko");
    toggleAway();

    expect(status()).toHaveTextContent("3 of 6 voted");
  });
});

describe("Reveal becomes available after the first completed action", () => {
  it("stays disabled while every voter is waiting", () => {
    render(<Room />);

    expect(revealButton()).toBeDisabled();
  });

  it("is enabled by an Away voter alone", () => {
    render(<Room />);

    selectVoter("Anna Kovalenko");
    toggleAway();

    expect(revealButton()).toBeEnabled();
    expect(status()).toHaveTextContent("1 of 6 voted");
  });

  it("is enabled by an unsure choice alone", () => {
    render(<Room />);

    selectVoter("Iryna Marchenko");
    chooseCard("?");

    expect(revealButton()).toBeEnabled();
  });

  it("is disabled again once the cards are shown", () => {
    render(<Room />);

    selectVoter("Serhii Bondar");
    chooseCard("2d");
    expect(revealButton()).toBeEnabled();

    reveal();

    expect(revealButton()).toBeInTheDocument();
    expect(revealButton()).toBeDisabled();
  });
});

const reveal = () => fireEvent.click(revealButton());
const reset = () => fireEvent.click(screen.getByRole("button", { name: /reset/i }));

/** The revealed results table. */
const results = () => within(screen.getByRole("region", { name: "Results" }));

/** One group row, matched on the label its row header carries. */
const resultsRow = (label: string) =>
  results().getByRole("row", { name: (accessibleName) => accessibleName.startsWith(label) });

const valuesOf = (label: string) =>
  within(resultsRow(label))
    .getAllByRole("cell")
    .map((cell) => cell.textContent);

/**
 * The fixture every revealed scenario uses: eligible estimates of 16, 40, 64
 * and 24 hours, plus one unsure choice, one Away voter and the Observer.
 */
const revealMixedRound = () => {
  selectVoter("Serhii Bondar");
  chooseCard("2d");
  selectVoter("Dmytro Levchenko");
  chooseCard("5d");
  selectVoter("Maksym Tkachuk");
  chooseCard("8d");
  selectVoter("Olena Shevchuk");
  chooseCard("3d");
  selectVoter("Iryna Marchenko");
  chooseCard("?");
  selectVoter("Anna Kovalenko");
  toggleAway();
  reveal();
};

describe("revealed Overall statistics", () => {
  it("reports the five measures over every eligible estimate", () => {
    render(<Room />);
    revealMixedRound();

    // 16, 40, 64 and 24 hours: lowest 16, mean 144/4 = 36, highest 64, spread 48.
    expect(valuesOf("Overall")).toEqual(["2d", "4.5d", "8d", "6d", "4"]);
  });

  it("is not the unweighted mean of the role averages", () => {
    render(<Room />);
    revealMixedRound();

    // (16 + 52 + 24) / 3 = 92/3 hours, which would display as 3.8d.
    expect(screen.queryByText("3.8d")).toBeNull();
  });

  it("reports no sum of the estimates", () => {
    render(<Room />);
    revealMixedRound();

    // 16 + 40 + 64 + 24 = 144 hours, which would display as 18d.
    expect(screen.queryByText("18d")).toBeNull();
    expect(screen.queryByText("144")).toBeNull();
  });

  it("reveals a round in which no estimate is eligible", () => {
    render(<Room />);

    selectVoter("Iryna Marchenko");
    chooseCard("?");
    selectVoter("Anna Kovalenko");
    toggleAway();
    expect(status()).toHaveTextContent("2 of 6 voted");
    reveal();

    for (const group of ["Overall", "QA", "Backend", "Frontend", "Business Analyst", "PM"]) {
      expect(valuesOf(group)).toEqual(["—", "—", "—", "—", "0"]);
    }
  });
});

describe("revealed per-role statistics", () => {
  it("reports a role that holds two estimates", () => {
    render(<Room />);
    revealMixedRound();

    // 40 and 64 hours: lowest 40, mean 104/2 = 52, highest 64, spread 24.
    expect(valuesOf("Backend")).toEqual(["5d", "6.5d", "8d", "3d", "2"]);
  });

  it("reports a role that holds one estimate", () => {
    render(<Room />);
    revealMixedRound();

    expect(valuesOf("QA")).toEqual(["2d", "2d", "2d", "0h", "1"]);
  });

  it("keeps a role whose only entries are excluded, with no placeholder number", () => {
    render(<Room />);
    revealMixedRound();

    expect(valuesOf("Business Analyst")).toEqual(["—", "—", "—", "—", "0"]);
    expect(valuesOf("PM")).toEqual(["—", "—", "—", "—", "0"]);
  });

  it("lists Overall and the five roles in canonical order", () => {
    render(<Room />);
    revealMixedRound();

    expect(
      results()
        .getAllByRole("rowheader")
        .map((header) => header.textContent),
    ).toEqual(["Overall", "QA", "Backend", "Frontend", "Business Analyst", "PM"]);
  });
});

describe("revealed participant values", () => {
  it("shows each participant their own state", () => {
    render(<Room />);
    revealMixedRound();

    expect(rowFor("Serhii Bondar")).toHaveTextContent("2d");
    expect(rowFor("Dmytro Levchenko")).toHaveTextContent("5d");
    expect(rowFor("Maksym Tkachuk")).toHaveTextContent("8d");
    expect(rowFor("Olena Shevchuk")).toHaveTextContent("3d");
    expect(rowFor("Iryna Marchenko")).toHaveTextContent("?");
    expect(rowFor("Anna Kovalenko")).toHaveTextContent("Away");
    expect(rowFor("Kateryna H.")).toHaveTextContent("Observer");
  });
});

describe("Reset returns the round to hidden", () => {
  it("clears the results and every voter back to Waiting", () => {
    render(<Room />);
    revealMixedRound();
    reset();

    expect(screen.queryByRole("region", { name: "Results" })).toBeNull();

    for (const name of [
      "Serhii Bondar",
      "Dmytro Levchenko",
      "Maksym Tkachuk",
      "Olena Shevchuk",
      "Iryna Marchenko",
      "Anna Kovalenko",
    ]) {
      expect(rowFor(name)).toHaveTextContent("Waiting");
    }

    expect(rowFor("Kateryna H.")).toHaveTextContent("Observer");
    expect(status()).toHaveTextContent("0 of 6 voted");
    expect(screen.getByText(/Bulk import of candidates from CSV/)).toBeInTheDocument();
    expect(revealButton()).toBeDisabled();
  });

  it("keeps the acting voter selected so the next round starts at once", () => {
    render(<Room />);
    revealMixedRound();
    reset();

    selectVoter("Serhii Bondar");
    chooseCard("2d");

    expect(status()).toHaveTextContent("1 of 6 voted");
    expect(revealButton()).toBeEnabled();
  });
});
