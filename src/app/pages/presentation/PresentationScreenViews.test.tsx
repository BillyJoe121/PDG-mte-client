import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StrategicBet } from "../../services/strategicApi";
import { EntitySummaryTable, sortEntities } from "./PresentationEntitySummaryTable";
import { buildComparisonBars, comparisonDifference } from "./PresentationComparisonData";
import { ComparisonTable } from "./PresentationComparisonParts";

const bet = (id: number, name: string, completed: number, inProgress: number, projects: number, status = "ACTIVA"): StrategicBet =>
  ({
    id,
    name,
    description: "",
    status,
    createdAt: "2026-01-01",
    executionSummary: {
      summaryText: "",
      completedKeyResults: completed,
      inProgressKeyResults: inProgress,
      completedProjects: projects,
      inProgressProjects: 0,
      periods: [],
    },
  }) as StrategicBet;

const bets = [bet(1, "Transformación", 2, 1, 3), bet(2, "Bienestar", 5, 0, 1, "INACTIVA"), bet(3, "Acreditación", 1, 4, 2)];

describe("sortEntities", () => {
  it("keeps the API order without a sort and orders by the chosen column", () => {
    expect(sortEntities(bets, null)).toBe(bets);
    expect(sortEntities(bets, { key: "name", direction: "asc" }).map((b) => b.id)).toEqual([3, 2, 1]);
    expect(sortEntities(bets, { key: "completedKrs", direction: "desc" }).map((b) => b.id)).toEqual([2, 1, 3]);
    expect(sortEntities(bets, { key: "totalProjects", direction: "asc" }).map((b) => b.id)).toEqual([2, 3, 1]);
    expect(sortEntities(bets, { key: "status", direction: "asc" }).map((b) => b.id)).toEqual([1, 3, 2]);
  });
});

describe("EntitySummaryTable", () => {
  const renderTable = (onSelect = vi.fn()) =>
    render(
      <EntitySummaryTable
        items={bets}
        onSelect={onSelect}
        summaryCardClass="summary"
        accent="#5454E9"
        tableTitle="Resumen de prueba"
        tableColumnLabel="Apuesta"
        itemLabel="Apuesta"
        pluralLabel="apuestas"
        cardDetail={(item) => item.description}
      />,
    );
  const rowNames = () =>
    within(screen.getByRole("table", { name: "Resumen de prueba" }))
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[0].textContent);

  it("sorts with the header buttons, announces it with aria-sort and goes back to the API order", () => {
    renderTable();
    expect(rowNames()).toEqual(["Transformación", "Bienestar", "Acreditación"]);
    const header = screen.getByRole("columnheader", { name: /KRs completados/ });
    expect(header).toHaveAttribute("aria-sort", "none");

    fireEvent.click(screen.getByRole("button", { name: "Ordenar por KRs completados" }));
    expect(header).toHaveAttribute("aria-sort", "descending");
    expect(rowNames()).toEqual(["Bienestar", "Transformación", "Acreditación"]);

    fireEvent.click(screen.getByRole("button", { name: "Ordenar por KRs completados" }));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(rowNames()).toEqual(["Acreditación", "Transformación", "Bienestar"]);

    fireEvent.click(screen.getByRole("button", { name: /orden de registro/i }));
    expect(header).toHaveAttribute("aria-sort", "none");
    expect(rowNames()).toEqual(["Transformación", "Bienestar", "Acreditación"]);
  });

  it("opens the detail from the row and from its button", () => {
    const onSelect = vi.fn();
    renderTable(onSelect);
    fireEvent.click(screen.getByRole("button", { name: "Detalle de Bienestar" }));
    expect(onSelect).toHaveBeenLastCalledWith(bets[1]);
    fireEvent.click(screen.getByText("Acreditación"));
    expect(onSelect).toHaveBeenLastCalledWith(bets[2]);
    expect(onSelect).toHaveBeenCalledTimes(2);
  });
});

describe("comparison difference", () => {
  it("computes B − A only for numeric rows", () => {
    expect(comparisonDifference({ metric: "KRs", valA: 2, valB: 5 })).toMatchObject({ value: 3, text: "▲ +3" });
    expect(comparisonDifference({ metric: "KRs", valA: 5, valB: 2 })).toMatchObject({ value: -3, text: "▼ −3" });
    expect(comparisonDifference({ metric: "KRs", valA: 4, valB: 4 })).toMatchObject({ value: 0, text: "= 0" });
    expect(comparisonDifference({ metric: "Estado", valA: "ACTIVA", valB: "INACTIVA" })).toMatchObject({ value: null, text: "—" });
  });

  it("builds the bars from the numeric table rows, in the same order", () => {
    const rows = [
      { metric: "Estado", valA: "ACTIVA", valB: "ACTIVA" },
      { metric: "KRs completados", valA: 2, valB: 3 },
      { metric: "Iniciativas totales", valA: 4, valB: 1 },
    ];
    expect(buildComparisonBars(rows)).toEqual([
      { metric: "KRs completados", a: 2, b: 3 },
      { metric: "Iniciativas totales", a: 4, b: 1 },
    ]);
  });

  it("shows the difference column with a spoken description", () => {
    render(
      <ComparisonTable
        headerA="Apuesta A"
        headerB="Apuesta B"
        rows={[
          { metric: "Estado", valA: "ACTIVA", valB: "INACTIVA" },
          { metric: "KRs completados", valA: 2, valB: 5 },
          { metric: "Iniciativas totales", valA: 4, valB: 1 },
        ]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Diferencia (B − A)" })).toBeInTheDocument();
    const krRow = screen.getByRole("row", { name: /KRs completados/ });
    expect(within(krRow).getByText("▲ +3")).toBeInTheDocument();
    expect(within(krRow).getByText("B tiene 3 más que A")).toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /Iniciativas totales/ })).getByText("▼ −3")).toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /Estado/ })).getByText("—")).toBeInTheDocument();
  });
});
