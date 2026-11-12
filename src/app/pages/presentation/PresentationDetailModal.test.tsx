import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { executionSummary, makeBet, makeGoal } from "../../../test/presentationFixtures";
import { PresentationDetailModal } from "./PresentationDetailModal";
import * as utils from "./presentationExportUtils";

vi.mock("./presentationExportUtils", () => ({
  exportDetailModalCsv: vi.fn(),
  printPresentationView: vi.fn(),
}));

type Entity = Parameters<typeof PresentationDetailModal>[0]["entity"];

function renderModal(entity: Entity, onClose = vi.fn()) {
  render(
    <MemoryRouter initialEntries={["/presentacion"]}>
      <Routes>
        <Route path="/presentacion" element={<PresentationDetailModal entity={entity} onClose={onClose} />} />
        <Route path="/apuestas/:id" element={<h1>Detalle de apuesta</h1>} />
        <Route path="/metas/:id" element={<h1>Detalle de meta</h1>} />
      </Routes>
    </MemoryRouter>
  );
  return onClose;
}

describe("PresentationDetailModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders nothing without an entity", () => {
    renderModal(null);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a bet with its dates, counts and period history", () => {
    const bet = makeBet(7, "Apuesta uno", {
      startDate: "2026-01-10",
      endDate: "2026-06-30",
      executionSummary: executionSummary({
        periods: [{ period: "2026-1", completedKeyResults: 1, inProgressKeyResults: 2, completedProjects: 3, inProgressProjects: 4 }],
      }),
    });
    renderModal({ type: "bet", data: bet });

    expect(screen.getByText("Apuesta Estratégica")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Apuesta uno" })).toBeInTheDocument();
    expect(screen.getByText("Descripcion de Apuesta uno")).toBeInTheDocument();
    expect(screen.getByText(/2026-01-10/)).toHaveTextContent("2026-06-30");
    expect(screen.queryByText("Indicador de Referencia")).not.toBeInTheDocument();
    expect(screen.getByText("Historial de Ejecución por Periodo")).toBeInTheDocument();
    const row = screen.getByRole("cell", { name: "2026-1" }).closest("tr")!;
    expect(within(row).getAllByRole("cell")).toHaveLength(3);
    expect(row).toHaveTextContent("1 / 3");
    expect(row).toHaveTextContent("3 / 7");
  });

  it("falls back to placeholders when the entity has no data recorded", () => {
    const bet = makeBet(8, "Sin datos", { description: "", executionSummary: undefined });
    renderModal({ type: "bet", data: bet });

    expect(screen.getByText("Sin descripción registrada para esta entidad estratégica.")).toBeInTheDocument();
    expect(screen.getByText(/Inicio abierto/)).toHaveTextContent("Continuo");
    expect(screen.getByText("Resultados Clave (KRs)").parentElement).toHaveTextContent("0 completados · 0 en progreso");
    expect(screen.queryByText("Historial de Ejecución por Periodo")).not.toBeInTheDocument();
  });

  it("hides the history when the summary has no periods", () => {
    renderModal({ type: "bet", data: makeBet(9, "Vacia", { executionSummary: executionSummary({ periods: undefined }) }) });
    expect(screen.queryByText("Historial de Ejecución por Periodo")).not.toBeInTheDocument();
  });

  it("shows the goal indicator and expected value", () => {
    renderModal({ type: "goal", data: makeGoal(3, "Meta uno") });
    expect(screen.getByText("Meta Institucional")).toBeInTheDocument();
    expect(screen.getByText("Indicador de Referencia")).toBeInTheDocument();
    expect(screen.getByText("Indicador")).toBeInTheDocument();
    expect(screen.queryByText("Sin registro")).not.toBeInTheDocument();
  });

  it("uses fallbacks for a goal without indicator or expected value", () => {
    const goal = makeGoal(4, "Meta vacia", { referenceIndicator: "", expectedValue: null, measurementUnitName: null });
    renderModal({ type: "goal", data: goal });
    expect(screen.getByText("No especificado")).toBeInTheDocument();
    expect(screen.getByText("Sin registro")).toBeInTheDocument();
  });

  it("prints the sheet and exports its CSV with the entity data", () => {
    const bet = makeBet(7, "Apuesta uno");
    renderModal({ type: "bet", data: bet });

    fireEvent.click(screen.getByRole("button", { name: "Exportar ficha técnica a PDF" }));
    expect(utils.printPresentationView).toHaveBeenCalledWith(
      "Ficha Técnica - Apuesta uno",
      expect.objectContaining({ subtitle: "Apuesta Estratégica | Estado: ACTIVA", printableSelector: ".presentation-detail-modal-content" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Descargar ficha técnica en CSV" }));
    expect(utils.exportDetailModalCsv).toHaveBeenCalledWith({ type: "bet", data: bet }, "Vigente");
  });

  it("labels the goal print subtitle as an institutional goal", () => {
    renderModal({ type: "goal", data: makeGoal(3, "Meta uno") });
    fireEvent.click(screen.getByRole("button", { name: "Exportar ficha técnica a PDF" }));
    expect(utils.printPresentationView).toHaveBeenCalledWith("Ficha Técnica - Meta uno", expect.objectContaining({ subtitle: "Meta Institucional | Estado: ACTIVA" }));
  });

  it("closes from the header button and the footer button", () => {
    const onClose = renderModal({ type: "bet", data: makeBet(1, "Apuesta uno") });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar ventana modal" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("opens the management screen of a bet", () => {
    renderModal({ type: "bet", data: makeBet(7, "Apuesta uno") });
    fireEvent.click(screen.getByRole("button", { name: /Ir a la gestión detallada/ }));
    expect(screen.getByRole("heading", { name: "Detalle de apuesta" })).toBeInTheDocument();
  });

  it("navigates to the goal management route", () => {
    renderModal({ type: "goal", data: makeGoal(3, "Meta uno") });
    fireEvent.click(screen.getByRole("button", { name: /Ir a la gestión detallada/ }));
    expect(screen.getByRole("heading", { name: "Detalle de meta" })).toBeInTheDocument();
  });
});
