import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ConsolidatedReport, PresentationSlide } from "../../services/reportsApi";
import { attachBetKeyResults } from "./PresentationConsolidatedBuilder";
import { PresentationSlideView } from "./PresentationSlideView";

const kr = (id: number, name: string, bets: string[], progress: string) => ({
  keyResultId: id,
  keyResultName: name,
  goalNames: [],
  strategicBetNames: bets,
  period: "2026-1",
  progressPercentage: progress,
  linkedProjects: 1,
});

const report = {
  general: { totalProjects: 1 },
  departments: [],
  keyResultRanking: [
    kr(1, "KR lento", ["Transformación Educativa"], "20"),
    kr(2, "KR de otra apuesta", ["Otra apuesta"], "90"),
    kr(3, "KR rápido", ["transformacion educativa "], "70"),
  ],
} as unknown as ConsolidatedReport;

const bet: PresentationSlide = {
  order: 2,
  type: "STRATEGIC_BET",
  title: "Transformación educativa",
  subtitle: "Apuesta institucional",
  content: { executionSummary: { completedKeyResults: 3, inProgressKeyResults: 2, completedProjects: 1, inProgressProjects: 4 } },
};

describe("attachBetKeyResults", () => {
  it("links the ranking KRs to the bet by name, ignoring case and accents, ordered by recorded progress", () => {
    const [linked] = attachBetKeyResults([bet], report);
    const names = (linked.content.linkedKeyResults as { keyResultName: string }[]).map((row) => row.keyResultName);
    expect(names).toEqual(["KR rápido", "KR lento"]);
  });

  it("leaves other slides untouched and gives an empty list without a report", () => {
    const cover: PresentationSlide = { order: 1, type: "COVER", title: "Portada", subtitle: "", content: {} };
    const [sameCover, linked] = attachBetKeyResults([cover, bet], null);
    expect(sameCover).toBe(cover);
    expect(linked.content.linkedKeyResults).toEqual([]);
  });
});

describe("PresentationSlideView bodies", () => {
  it("draws the bet with its recorded counts and linked KRs", () => {
    const [linked] = attachBetKeyResults([bet], report);
    render(<PresentationSlideView slide={linked} periodName="2026-1" />);
    expect(screen.getByText("Completados: 3")).toBeInTheDocument();
    expect(screen.getByText("En progreso: 2")).toBeInTheDocument();
    expect(screen.getByText("Completadas: 1")).toBeInTheDocument();
    const section = screen.getByRole("region", { name: "KRs vinculados a la apuesta" });
    expect(within(section).getByText("KR rápido")).toBeInTheDocument();
    expect(within(section).getByText("70%")).toBeInTheDocument();
    expect(within(section).queryByText("KR de otra apuesta")).not.toBeInTheDocument();
  });

  it("says so when the bet has no linked KRs in the report", () => {
    render(<PresentationSlideView slide={{ ...bet, content: { ...bet.content, linkedKeyResults: [] } }} periodName="2026-1" />);
    expect(screen.getByText("Sin KRs vinculados en el informe del corte")).toBeInTheDocument();
  });

  it("shows an empty state for a bet without recorded execution", () => {
    render(<PresentationSlideView slide={{ ...bet, content: {} }} periodName="2026-1" />);
    expect(screen.getByRole("status")).toHaveTextContent("Esta apuesta aún no tiene ejecución registrada");
  });

  it("puts the institution and one main figure on the cover, without inventing missing counts", () => {
    const cover: PresentationSlide = {
      order: 1,
      type: "COVER",
      title: "Seguimiento estratégico",
      subtitle: "",
      content: { institution: "Escuela TDI", strategicBets: 5, completedKeyResults: 4 },
    };
    render(<PresentationSlideView slide={cover} periodName="2026-1" />);
    expect(screen.getByText("Escuela TDI")).toBeInTheDocument();
    expect(screen.getByText("Apuestas estratégicas")).toBeInTheDocument();
    expect(screen.getByText("KRs completados")).toBeInTheDocument();
    expect(screen.queryByText("KRs en progreso")).not.toBeInTheDocument();
  });
});
