import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithI18n } from "../test/renderWithProviders.jsx";
import Upcoming from "./Upcoming.jsx";

// The component fetches live matches on mount; keep tests on the bundled snapshot.
vi.mock("../api.js", () => ({
  fetchMatches: () => Promise.reject(new Error("offline")),
}));

/**
 * These tests pin the clock. The component splits fixtures by today's date, so
 * without a fixed "now" a passing test would start failing as the tournament
 * moves on - a real bug we hit once already.
 */
const FIXED_NOW = new Date("2026-07-17T12:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Matches tab", () => {
  it("renders the header and both sections", () => {
    renderWithI18n(<Upcoming />);
    expect(screen.getByText(/^Matches$/)).toBeInTheDocument();
    expect(screen.getByText(/^Upcoming$/)).toBeInTheDocument();
    expect(screen.getByText(/^Results$/)).toBeInTheDocument();
  });

  it("puts Upcoming above Results", () => {
    renderWithI18n(<Upcoming />);
    const upcoming = screen.getByText(/^Upcoming$/);
    const results = screen.getByText(/^Results$/);
    expect(
      upcoming.compareDocumentPosition(results) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("tags the winner of completed matches", () => {
    renderWithI18n(<Upcoming />);
    expect(screen.getAllByText("Won").length).toBeGreaterThan(0);
  });

  it("never lists a finished match as upcoming", () => {
    renderWithI18n(<Upcoming />);
    // On 17 Jul the only fixtures left are the third-place match and the final.
    expect(screen.getByText(/^Upcoming$/).parentElement.textContent).toMatch(/2/);
  });

  it("shows win probabilities for upcoming matches", () => {
    renderWithI18n(<Upcoming />);
    expect(screen.getAllByText(/Draw \d/).length).toBeGreaterThan(0);
  });

  it("labels the data source honestly when offline", () => {
    renderWithI18n(<Upcoming />);
    expect(screen.getByText(/Snapshot/i)).toBeInTheDocument();
  });

  it("switches to a past final via the year dropdown", () => {
    renderWithI18n(<Upcoming />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2022" } });
    expect(screen.getByText(/Champions/i)).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
  });
});
