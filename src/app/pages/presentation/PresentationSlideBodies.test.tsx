import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ConsolidatedReport, PresentationSlide } from "../../services/reportsApi";
import { attachBetKeyResults, insertGoalSlides } from "./PresentationConsolidatedBuilder";
import type { Goal } from "../../services/strategicApi";
import { SlideInteractiveContext } from "./PresentationSlidePager";
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
    const section = screen.getByRole("region", { name: "KRs vinculados a esta apuesta" });
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

  it("scrolls a long KR list inside the card instead of paging it", () => {
    const many = Array.from({ length: 8 }, (_, index) => kr(10 + index, `KR número ${index + 1}`, ["Transformación educativa"], String(90 - index)));
    const [linked] = attachBetKeyResults([bet], { ...report, keyResultRanking: many } as ConsolidatedReport);
    render(<PresentationSlideView slide={linked} periodName="2026-1" />);
    const section = screen.getByRole("region", { name: "KRs vinculados a esta apuesta" });
    const list = within(section).getByRole("region", { name: "Lista de KRs vinculados" });
    expect(within(list).getAllByText(/^KR número/)).toHaveLength(8);
    expect(list).toHaveClass("overflow-y-auto");
    expect(within(section).queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not scroll inside the miniatures", () => {
    const many = Array.from({ length: 6 }, (_, index) => kr(10 + index, `KR ${index}`, ["Transformación educativa"], "50"));
    const [linked] = attachBetKeyResults([bet], { ...report, keyResultRanking: many } as ConsolidatedReport);
    render(
      <SlideInteractiveContext.Provider value={false}>
        <PresentationSlideView slide={linked} periodName="2026-1" />
      </SlideInteractiveContext.Provider>
    );
    expect(screen.queryByRole("region", { name: "Lista de KRs vinculados" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("initiatives of bet and goal slides", () => {
  const withItems = (id: number, name: string, progress: string, items: { id: number; name: string; globalProgress: number | null; status: string }[]) => ({
    ...kr(id, name, ["Transformación educativa"], progress),
    linkedProjectItems: items,
  });
  const itemsReport = {
    ...report,
    keyResultRanking: [
      withItems(1, "KR uno", "30", [{ id: 11, name: "Iniciativa media", globalProgress: 50, status: "ACTIVO" }, { id: 12, name: "Iniciativa sin dato", globalProgress: null, status: "BORRADOR" }]),
      withItems(2, "KR dos", "80", [{ id: 11, name: "Iniciativa media", globalProgress: 50, status: "ACTIVO" }, { id: 13, name: "Iniciativa alta", globalProgress: 95, status: "FINALIZADO" }]),
    ],
  } as unknown as ConsolidatedReport;

  it("lists the initiatives of the bet once each, ordered by their recorded progress", () => {
    const [linked] = attachBetKeyResults([bet], itemsReport);
    render(<PresentationSlideView slide={linked} periodName="2026-1" />);
    expect(screen.getByText("La apuesta Transformación educativa tiene 2 KRs")).toBeInTheDocument();
    const section = screen.getByRole("region", { name: "Iniciativas vinculadas a esta apuesta" });
    const names = within(section).getAllByRole("listitem").map((row) => within(row).getByText(/^Iniciativa/).textContent);
    expect(names).toEqual(["Iniciativa alta", "Iniciativa media", "Iniciativa sin dato"]);
    expect(within(section).getByText("95%")).toBeInTheDocument();
    expect(within(section).getByText("Sin registro")).toBeInTheDocument();
    expect(within(section).getAllByText(/^Avance registrado/)).toHaveLength(3);
    const krs = within(screen.getByRole("region", { name: "KRs vinculados a esta apuesta" })).getAllByRole("listitem");
    expect(krs.map((row) => within(row).getByText(/^KR /).textContent)).toEqual(["KR dos", "KR uno"]);
  });

  it("never shows an aggregated progress for the bet or the goal", () => {
    const goal = { id: 9, name: "O1", executionSummary: { summaryText: "", completedKeyResults: 1, inProgressKeyResults: 1, completedProjects: 0, inProgressProjects: 2, periods: [] } } as unknown as Goal;
    const goalReport = { ...itemsReport, keyResultRanking: itemsReport.keyResultRanking.map((row) => ({ ...row, goalNames: ["O1"] })) } as ConsolidatedReport;
    const [betSlide] = attachBetKeyResults([bet], itemsReport);
    const [goalSlide] = insertGoalSlides([], [goal], goalReport);
    for (const slide of [betSlide, goalSlide]) {
      const { container, unmount } = render(<PresentationSlideView slide={slide} periodName="2026-1" />);
      expect(container.textContent).not.toMatch(/avanzad/i);
      // The only percentages are the ones recorded on each KR (80, 30) and each initiative (95, 50).
      expect(container.textContent?.match(/\d+(\.\d+)?\s?%/g)).toEqual(["80%", "30%", "95%", "50%"]);
      unmount();
    }
    render(<PresentationSlideView slide={goalSlide} periodName="2026-1" />);
    expect(screen.getByText("La meta O1 tiene 2 KRs")).toBeInTheDocument();
  });

  it("says so when the KRs have no linked initiatives", () => {
    const [linked] = attachBetKeyResults([bet], report);
    render(<PresentationSlideView slide={linked} periodName="2026-1" />);
    expect(screen.getByText("Sin iniciativas vinculadas en el informe del corte")).toBeInTheDocument();
  });
});

describe("goal slides", () => {
  const goal = {
    id: 4,
    name: "Graduación oportuna",
    description: "Retención y titulación a tiempo.",
    referenceIndicator: "Tasa de graduación",
    expectedValue: 85,
    measurementUnitName: "%",
    executionSummary: { summaryText: "", completedKeyResults: 2, inProgressKeyResults: 1, completedProjects: 1, inProgressProjects: 0, periods: [] },
  } as unknown as Goal;
  const goalReport = {
    ...report,
    keyResultRanking: [{ ...kr(7, "KR de la meta", [], "40"), goalNames: ["Graduacion Oportuna"] }, kr(8, "KR sin meta", [], "90")],
  } as unknown as ConsolidatedReport;

  it("adds one slide per goal after the bets and before the closing slide", () => {
    const closing: PresentationSlide = { order: 3, type: "CLOSING", title: "Cierre", subtitle: "", content: {} };
    const slides = insertGoalSlides([bet, closing], [goal], goalReport);
    expect(slides.map((slide) => slide.type)).toEqual(["STRATEGIC_BET", "GOAL", "CLOSING"]);
    const names = (slides[1].content.linkedKeyResults as { keyResultName: string }[]).map((row) => row.keyResultName);
    expect(names).toEqual(["KR de la meta"]);
  });

  it("draws the goal with its expected value, counts and linked KRs", () => {
    const [slide] = insertGoalSlides([], [goal], goalReport);
    render(<PresentationSlideView slide={slide} periodName="2026-1" />);
    expect(screen.getByText("Meta institucional")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Graduación oportuna" })).toBeInTheDocument();
    expect(screen.getByText("Valor esperado")).toBeInTheDocument();
    expect(screen.getByText("Tasa de graduación")).toBeInTheDocument();
    expect(screen.getByText("Completados: 2")).toBeInTheDocument();
    const section = screen.getByRole("region", { name: "KRs vinculados a esta meta" });
    expect(within(section).getByText("KR de la meta")).toBeInTheDocument();
  });
});
