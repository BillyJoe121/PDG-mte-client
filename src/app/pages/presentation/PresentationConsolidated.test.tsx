import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ConsolidatedReport } from "../../services/reportsApi";
import { makeConsolidatedReport, makeGoal, makeKeyResultRow, makeSlide } from "../../../test/presentationFixtures";
import {
  attachBetKeyResults,
  boundedPercent,
  buildConsolidatedSlides,
  buildGoalSlides,
  formatPercent,
  insertGoalSlides,
  numericPercent,
} from "./PresentationConsolidatedBuilder";
import { PresentationConsolidatedSlideContent } from "./PresentationConsolidatedSlideContent";
import { ProgressBarRow, SlideEmptyState, SplitBar, StatTile, strategyText } from "./PresentationConsolidatedSlideParts";
import { PresentationSlideView, slideTypeLabel } from "./PresentationSlideView";

describe("percent helpers", () => {
  it("parses numbers, percent strings and empty values", () => {
    expect(numericPercent(null)).toBe(0);
    expect(numericPercent(undefined)).toBe(0);
    expect(numericPercent("")).toBe(0);
    expect(numericPercent("45%")).toBe(45);
    expect(numericPercent("abc")).toBe(0);
    expect(numericPercent(12.5)).toBe(12.5);
  });

  it("formats with at most two decimals and falls back to zero", () => {
    expect(formatPercent(null)).toBe("0%");
    expect(formatPercent(undefined)).toBe("0%");
    expect(formatPercent("")).toBe("0%");
    expect(formatPercent("abc")).toBe("0%");
    expect(formatPercent("12.3456%")).toBe("12.35%");
    expect(formatPercent(50)).toBe("50%");
  });

  it("keeps the bar width between 0 and 100", () => {
    expect(boundedPercent(150)).toBe(100);
    expect(boundedPercent(-5)).toBe(0);
    expect(boundedPercent("33")).toBe(33);
  });
});

describe("buildConsolidatedSlides", () => {
  it("returns one empty-state slide without a report", () => {
    expect(buildConsolidatedSlides(null, "2026-1")).toEqual([
      expect.objectContaining({ type: "CONSOLIDATED_EMPTY", subtitle: "Periodo 2026-1" }),
    ]);
    expect(buildConsolidatedSlides(undefined)[0]).toMatchObject({ subtitle: "Periodo vigente", content: { periodName: "" } });
    expect(buildConsolidatedSlides({ departments: [] } as unknown as ConsolidatedReport)[0].type).toBe("CONSOLIDATED_EMPTY");
  });

  it("builds summary, ranking and departments sorted by recorded progress", () => {
    const report = makeConsolidatedReport({
      departments: [{ departmentId: 1, departmentName: "Sistemas" }],
      keyResultRanking: [makeKeyResultRow(1, "Bajo", "10"), makeKeyResultRow(2, "Alto", "90%")],
    });
    const slides = buildConsolidatedSlides(report, "2026-1");
    expect(slides.map((slide) => slide.type)).toEqual(["CONSOLIDATED_SUMMARY", "CONSOLIDATED_RANKING", "CONSOLIDATED_DEPTS_SUMMARY"]);
    expect((slides[1].content.keyResults as { keyResultName: string }[]).map((row) => row.keyResultName)).toEqual(["Alto", "Bajo"]);
    expect(slides[2].content.departments).toHaveLength(1);
  });

  it("uses empty lists when departments or ranking are not arrays", () => {
    const report = makeConsolidatedReport({ departments: null, keyResultRanking: undefined });
    const slides = buildConsolidatedSlides(report);
    expect(slides[1].content.keyResults).toEqual([]);
    expect(slides[2].content.departments).toEqual([]);
  });
});

describe("linking KRs to bets and goals", () => {
  const report = makeConsolidatedReport({
    keyResultRanking: [
      makeKeyResultRow(1, "Con meta", "20", { goalNames: ["Meta A", null] }),
      makeKeyResultRow(2, "Sin vinculos", "90", { goalNames: null, strategicBetNames: null }),
    ],
  });

  it("gives an empty list to slides without a title and ignores other slide types", () => {
    const untitled = { ...makeSlide("STRATEGIC_BET", ""), title: undefined } as never;
    const [bet, cover] = attachBetKeyResults([untitled, makeSlide("COVER", "Portada")], report);
    expect(bet.content.linkedKeyResults).toEqual([]);
    expect(cover.content.linkedKeyResults).toBeUndefined();
  });

  it("builds goal slides with the KRs linked by name", () => {
    const goals = [makeGoal(1, "Meta A"), makeGoal(2, "Otra", { description: null })];
    const slides = buildGoalSlides(goals, report);
    expect(slides[0]).toMatchObject({ type: "GOAL", title: "Meta A", subtitle: "Descripcion de Meta A" });
    expect((slides[0].content.linkedKeyResults as unknown[]).length).toBe(1);
    expect(slides[1].subtitle).toBe("");
    expect(slides[1].content.linkedKeyResults).toEqual([]);
  });

  it("works without a report", () => {
    expect(buildGoalSlides([makeGoal(1, "Meta A")], null)[0].content.linkedKeyResults).toEqual([]);
  });

  it("places goal slides before the closing slide or at the end", () => {
    const goals = [makeGoal(1, "Meta A")];
    const withClosing = insertGoalSlides([makeSlide("COVER", "c"), makeSlide("CLOSING", "z")], goals, report);
    expect(withClosing.map((slide) => slide.type)).toEqual(["COVER", "GOAL", "CLOSING"]);
    const withoutClosing = insertGoalSlides([makeSlide("COVER", "c")], goals, report);
    expect(withoutClosing.map((slide) => slide.type)).toEqual(["COVER", "GOAL"]);
    const slides = [makeSlide("COVER", "c")];
    expect(insertGoalSlides(slides, [], report)).toBe(slides);
  });
});

describe("slide building blocks", () => {
  it("joins the linked names or says there are none", () => {
    expect(strategyText({ goalNames: ["A"], strategicBetNames: ["B", ""] })).toBe("A, B");
    expect(strategyText({ goalNames: undefined, strategicBetNames: undefined } as never)).toBe("Sin Meta ni Apuesta");
  });

  it("renders tiles with and without icon, note and numeric value", () => {
    const { rerender } = render(<StatTile label="Total" value={1234} note="nota" color="#111111" icon={<i data-testid="icon" />} size="lg" />);
    expect(screen.getByText("nota")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    rerender(<StatTile label="Total" value="n/d" color="#111111" />);
    expect(screen.getByText("n/d")).toBeInTheDocument();
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  it("renders progress rows with optional rank, detail and colour", () => {
    const { container, rerender } = render(<ol><ProgressBarRow rank={2} label="KR" detail="detalle" value="40%" color="#ff0000" /></ol>);
    expect(screen.getByText("detalle")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(container.querySelector('div[style*="width: 40%"]')).toHaveStyle({ backgroundColor: "#ff0000" });
    rerender(<ol><ProgressBarRow label="KR" value={0} /></ol>);
    expect(screen.queryByText("detalle")).not.toBeInTheDocument();
  });

  it("draws the split bar only when there is something to split", () => {
    const parts = [{ label: "A", value: 0, color: "#111" }, { label: "B", value: 0, color: "#222" }];
    const { container, rerender } = render(<SplitBar label="Reparto" parts={parts} />);
    expect(container.querySelectorAll("[aria-hidden='true'] > div")).toHaveLength(0);
    rerender(<SplitBar label="Reparto" parts={[{ ...parts[0], value: 1 }, { ...parts[1], value: 3 }]} />);
    expect(container.querySelectorAll("[aria-hidden='true'] > div")).toHaveLength(2);
    expect(screen.getByText(/B: 3/)).toBeInTheDocument();
  });

  it("renders an empty state with its explanation", () => {
    render(<SlideEmptyState title="Nada" text="Registra datos" />);
    expect(screen.getByRole("status")).toHaveTextContent("NadaRegistra datos");
  });
});

describe("PresentationConsolidatedSlideContent", () => {
  const view = (slide: ReturnType<typeof makeSlide>) => render(<PresentationConsolidatedSlideContent slide={slide} />);

  it("names the period in the empty slide, or falls back", () => {
    const { unmount } = view(makeSlide("CONSOLIDATED_EMPTY", "x", { periodName: "2026-1" }));
    expect(screen.getByText("No hay reporte consolidado para el periodo 2026-1")).toBeInTheDocument();
    unmount();
    view(makeSlide("CONSOLIDATED_EMPTY", "x", {}));
    expect(screen.getByText("No hay reporte consolidado para el periodo seleccionado")).toBeInTheDocument();
  });

  it("treats a missing content as empty", () => {
    const { container } = view({ ...makeSlide("CONSOLIDATED_SUMMARY", "x"), content: undefined } as never);
    expect(container.querySelectorAll("article")).toHaveLength(4);
    expect(screen.getByText("0 activas")).toBeInTheDocument();
    expect(screen.getByText("0 activos")).toBeInTheDocument();
  });

  it("shows the summary counts", () => {
    view(makeSlide("CONSOLIDATED_SUMMARY", "x", { general: makeConsolidatedReport().general }));
    expect(screen.getByText("3 activas")).toBeInTheDocument();
    expect(screen.getByText("5 activos")).toBeInTheDocument();
  });

  it("lists the ranking, with fallbacks for missing counts and ids", () => {
    view(makeSlide("CONSOLIDATED_RANKING", "x", {
      keyResults: [makeKeyResultRow(0, "Sin id", "30", { linkedProjects: undefined }), makeKeyResultRow(5, "Con id", 80)],
    }));
    expect(screen.getByText("Sin id")).toBeInTheDocument();
    expect(screen.getByText("Sin Meta ni Apuesta · 0 iniciativas")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("explains an empty ranking, also when the content has no list", () => {
    view(makeSlide("CONSOLIDATED_RANKING", "x", {}));
    expect(screen.getByText("No hay KRs con avance registrado en este corte")).toBeInTheDocument();
  });

  it("renders the departments table with bars relative to the largest value", () => {
    view(makeSlide("CONSOLIDATED_DEPTS_SUMMARY", "x", {
      departments: [
        { departmentId: 1, departmentName: "Sistemas", projects: 4, keyResults: 2, closedKeyResults: 1 },
        { departmentId: 0, departmentName: "Bienestar", projects: 2 },
      ],
    }));
    expect(screen.getByRole("table", { name: "Resumen por departamento" })).toBeInTheDocument();
    expect(screen.getByText("Bienestar")).toBeInTheDocument();
    expect(screen.getByText("Sistemas")).toBeInTheDocument();
  });

  it("explains empty departments, also when the content has no list", () => {
    view(makeSlide("CONSOLIDATED_DEPTS_SUMMARY", "x", {}));
    expect(screen.getByText("No hay departamentos con registros en este corte")).toBeInTheDocument();
  });

  it("renders nothing for an unknown consolidated type", () => {
    const { container } = view(makeSlide("CONSOLIDATED_OTHER", "x"));
    expect(container).toBeEmptyDOMElement();
  });
});

describe("PresentationSlideView", () => {
  it("labels known and unknown slide types", () => {
    expect(slideTypeLabel("CONSOLIDATED_SUMMARY")).toBe("Informe consolidado");
    expect(slideTypeLabel("GOAL")).toBe("Meta institucional");
    expect(slideTypeLabel("SOME_NEW_TYPE")).toBe("some new type");
  });

  it("draws the frame of each kind of slide and nothing in the body of an unknown one", () => {
    const { rerender } = render(<PresentationSlideView slide={makeSlide("CONSOLIDATED_EMPTY", "Consolidado", {})} periodName="2026-1" />);
    expect(screen.getByRole("heading", { name: "Consolidado" })).toBeInTheDocument();
    rerender(<PresentationSlideView slide={makeSlide("GOAL", "Meta", { executionSummary: undefined })} periodName="2026-1" />);
    expect(screen.getByText("Periodo 2026-1")).toBeInTheDocument();
    rerender(<PresentationSlideView slide={{ ...makeSlide("MYSTERY", "Raro"), subtitle: "con subtitulo" }} periodName="2026-1" />);
    expect(screen.getByText("con subtitulo")).toBeInTheDocument();
    expect(screen.getByText("mystery")).toBeInTheDocument();
  });
});
