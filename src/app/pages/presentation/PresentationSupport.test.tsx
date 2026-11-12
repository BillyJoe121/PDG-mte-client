import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeBet, makeGoal, makeSlide } from "../../../test/presentationFixtures";
import * as exportUtils from "../../utils/exportUtils";
import { toPeriodComparisonStats } from "./PresentationComparisonData";
import { PresentationPageHeader, PresentationPanel, PresentationStatusBadge } from "./PresentationLayout";
import { PresentationProgress, PresentationStage } from "./PresentationStageView";
import { PresentationStageControls } from "./PresentationStageControls";
import { entityCounts } from "./presentationEntityCounts";
import {
  buildConsolidatedCsvRows,
  exportComparisonCsv,
  exportDetailModalCsv,
  exportGeneralReportCsv,
  exportSlideDeckCsv,
} from "./presentationExportUtils";
import { useStageFit } from "./presentationStage";
import { controlsInUse } from "./useAutoHideControls";

describe("toPeriodComparisonStats and entityCounts", () => {
  it("fills missing report fields with zero", () => {
    expect(toPeriodComparisonStats("2026-1", {} as never)).toEqual({
      periodName: "2026-1",
      totalKeyResults: 0,
      activeKeyResults: 0,
      closedKeyResults: 0,
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
    });
  });

  it("sums the recorded counts and defaults to zero without a summary", () => {
    expect(entityCounts(makeBet(1, "A"))).toEqual({ completedKrs: 2, inProgressKrs: 1, totalProjects: 4 });
    expect(entityCounts(makeGoal(1, "G", { executionSummary: undefined }))).toEqual({ completedKrs: 0, inProgressKrs: 0, totalProjects: 0 });
    expect(entityCounts(makeBet(2, "B", { executionSummary: { completedProjects: 1 } })).totalProjects).toBe(1);
  });
});

describe("export fallbacks", () => {
  let csv: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    csv = vi.spyOn(exportUtils, "downloadCSV").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  const rowsOf = () => csv.mock.calls[0][0] as Record<string, unknown>[];

  it("exports empty strings and zeros for entities without optional data", () => {
    const bare = makeBet(1, "Bare", { description: undefined, executionSummary: undefined });
    const goal = makeGoal(2, "Goal", { expectedValue: undefined, measurementUnitName: undefined, referenceIndicator: undefined, description: undefined, executionSummary: undefined });
    exportGeneralReportCsv([bare], [goal], "2026-1");
    expect(rowsOf()[0]).toMatchObject({ descripcion: "", krs_completados: 0, iniciativas_en_progreso: 0 });
    expect(rowsOf()[1]).toMatchObject({ valor_esperado: "", unidad_medida: "", indicador_referencia: "", descripcion: "" });
  });

  it("uses the raw comparison type when it has no label", () => {
    exportComparisonCsv({ compType: "other-kind" as never, periodName: "2026-1", nameA: "A", nameB: "B", rows: [{ metric: "KRs", valA: 1, valB: 2 }] });
    expect(rowsOf()[0]).toMatchObject({ modalidad: "other-kind" });
  });

  it("falls back across the slide content fields", () => {
    exportSlideDeckCsv(
      [
        makeSlide("COVER", "Portada", { institution: "Universidad", totalKeyResults: 7, totalProjects: 3 }),
        makeSlide("CLOSING", "Cierre", { summaryText: "Fin", status: "OK", executionSummary: { completedKeyResults: 1, completedProjects: 2 } }),
        makeSlide("OTHER", "Otra"),
      ],
      "2026-1"
    );
    expect(rowsOf()).toMatchObject([
      { resumen_texto: "Universidad", krs_completados: 7, iniciativas_totales: 3, estado: "" },
      { resumen_texto: "Fin", estado: "OK", krs_completados: 1, iniciativas_totales: 2 },
      { resumen_texto: "", krs_completados: "", iniciativas_totales: "" },
    ]);
  });

  it("joins linked names and tolerates rows without them", () => {
    const rows = buildConsolidatedCsvRows([
      makeSlide("CONSOLIDATED_RANKING", "r", {
        keyResults: [
          { keyResultName: "KR", goalNames: null, strategicBetNames: undefined, period: "2026-1", linkedProjects: 1, progressPercentage: "5" },
          { keyResultName: "KR2", goalNames: ["A", "B"], strategicBetNames: ["C"], period: "2026-1", linkedProjects: 2, progressPercentage: "9" },
        ],
      }),
      makeSlide("CONSOLIDATED_DEPTS_SUMMARY", "d", { departments: "none" }),
    ]);
    expect(rows).toMatchObject([{ metas: "", apuestas: "" }, { metas: "A; B", apuestas: "C" }]);
    expect(buildConsolidatedCsvRows([])).toEqual([]);
  });

  it("exports a detail sheet without creation date", () => {
    exportDetailModalCsv({ type: "bet", data: makeBet(1, "Una apuesta con nombre largo", { createdAt: undefined }) }, "Vigente");
    expect(rowsOf()[0]).toMatchObject({ fecha_creacion: "" });
  });
});

describe("PresentationLayout", () => {
  it("renders the page header with and without eyebrow, subtitle, actions and children", () => {
    const { rerender } = render(
      <PresentationPageHeader eyebrow="Seccion" title="Titulo" subtitle="Detalle" actions={<button type="button">Accion</button>}>
        <p>Contenido extra</p>
      </PresentationPageHeader>
    );
    expect(screen.getByText("Seccion")).toBeInTheDocument();
    expect(screen.getByText("Detalle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accion" })).toBeInTheDocument();
    expect(screen.getByText("Contenido extra")).toBeInTheDocument();
    rerender(<PresentationPageHeader title="Solo titulo" />);
    expect(screen.queryByText("Seccion")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("labels the known statuses and shows an unknown one as is", () => {
    const { container, rerender } = render(<PresentationStatusBadge status="activa" />);
    expect(screen.getByText("Activa")).toBeInTheDocument();
    rerender(<PresentationStatusBadge status="INACTIVA" />);
    expect(screen.getByText("Inactiva")).toBeInTheDocument();
    rerender(<PresentationStatusBadge status="BORRADOR" />);
    expect(screen.getByText("BORRADOR")).toBeInTheDocument();
    rerender(<PresentationStatusBadge status={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders panels with and without icon, subtitle, actions, children and a custom heading level", () => {
    const { rerender } = render(
      <PresentationPanel title="Panel" subtitle="Sub" icon={<i data-testid="icon" />} actions={<span>Acciones</span>} headingLevel="h3">
        <p>Cuerpo</p>
      </PresentationPanel>
    );
    expect(screen.getByRole("heading", { level: 3, name: "Panel" })).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Acciones")).toBeInTheDocument();
    rerender(<PresentationPanel title="Vacio" />);
    expect(screen.getByRole("heading", { level: 2, name: "Vacio" })).toBeInTheDocument();
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });
});

describe("stage controls and progress", () => {
  const handlers = { onPrevious: vi.fn(), onNext: vi.fn(), onToggleOverview: vi.fn(), onExit: vi.fn() };

  it("offers fullscreen toggling with the label of the current state", () => {
    const onToggleFullscreen = vi.fn();
    const { rerender } = render(
      <PresentationStageControls {...handlers} index={1} total={3} concealed={false} overviewOpen={false} fullscreen={false} onToggleFullscreen={onToggleFullscreen} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Pantalla completa" }));
    expect(onToggleFullscreen).toHaveBeenCalled();
    rerender(
      <PresentationStageControls {...handlers} index={1} total={3} concealed={false} overviewOpen={false} fullscreen onToggleFullscreen={onToggleFullscreen} />
    );
    expect(screen.getByRole("button", { name: "Salir de pantalla completa" })).toBeInTheDocument();
  });

  it("omits the fullscreen button when it is not available", () => {
    render(<PresentationStageControls {...handlers} index={0} total={3} concealed={false} overviewOpen={false} fullscreen={false} />);
    expect(screen.queryByRole("button", { name: /pantalla completa/i })).not.toBeInTheDocument();
  });

  it("shows an empty progress when there are no slides", () => {
    render(<PresentationProgress index={0} total={0} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("hides the cursor over the stage when asked to", () => {
    const { container } = render(<PresentationStage slide={makeSlide("COVER", "Portada")} index={0} total={1} periodName="2026-1" hideCursor />);
    expect(container.querySelector(".presentation-stage-frame")).toHaveStyle({ cursor: "none" });
  });
});

describe("useStageFit", () => {
  it("does nothing without an element and refits when the window resizes", () => {
    const empty = renderHook(() => useStageFit({ current: null }));
    expect(empty.result.current.scale).toBe(1);

    const element = document.createElement("div");
    Object.defineProperty(element, "clientWidth", { value: 960, configurable: true });
    Object.defineProperty(element, "clientHeight", { value: 540, configurable: true });
    const { result, unmount } = renderHook(() => useStageFit({ current: element }));
    expect(result.current.scale).toBe(0.5);
    // Same size again keeps the same state object.
    const before = result.current;
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(before);
    Object.defineProperty(element, "clientWidth", { value: 1920, configurable: true });
    Object.defineProperty(element, "clientHeight", { value: 1080, configurable: true });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current.scale).toBe(1);
    unmount();
  });
});

describe("controlsInUse", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is false with nothing focused, in use with focus inside the controls or an open menu", () => {
    expect(controlsInUse()).toBe(false);

    document.body.innerHTML = '<div data-presentation-controls><button id="inside">x</button></div><button id="outside">y</button>';
    const inside = document.getElementById("inside")!;
    inside.focus();
    vi.spyOn(inside, "matches").mockReturnValue(true);
    expect(controlsInUse()).toBe(true);
    vi.spyOn(inside, "matches").mockReturnValue(false);
    expect(controlsInUse()).toBe(false);

    document.getElementById("outside")!.focus();
    expect(controlsInUse()).toBe(false);
  });

  it("treats focus as visible on engines without :focus-visible", () => {
    document.body.innerHTML = '<div data-presentation-controls><button id="inside">x</button></div>';
    const inside = document.getElementById("inside")!;
    inside.focus();
    vi.spyOn(inside, "matches").mockImplementation(() => {
      throw new SyntaxError("unsupported selector");
    });
    expect(controlsInUse()).toBe(true);
  });

  it("is in use while a menu of the controls is expanded or the guided tour is open", () => {
    document.body.innerHTML = '<div data-presentation-controls><button aria-expanded="true">m</button></div>';
    expect(controlsInUse()).toBe(true);
    document.body.innerHTML = "<div data-guided-tour></div>";
    expect(controlsInUse()).toBe(true);
  });
});
