import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Goal } from "../../services/strategicApi";
import { EntitySummaryTable, sortEntities } from "./PresentationEntitySummaryTable";

function goal(id: number, name: string, status: string, completed?: number): Goal {
  return {
    id,
    name,
    status,
    ...(completed === undefined
      ? {}
      : { executionSummary: { completedKeyResults: completed, inProgressKeyResults: 1, completedProjects: 1, inProgressProjects: 0 } }),
  } as unknown as Goal;
}

const items = [goal(1, "Beta", "INACTIVA", 2), goal(2, "Alfa", "ACTIVA", 5), goal(3, "Gamma", "ACTIVA")];

function names() {
  return within(screen.getByRole("table")).getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0].querySelector("p")?.textContent);
}

describe("sortEntities", () => {
  it("keeps the given order without a sort and keeps ties in that order", () => {
    expect(sortEntities(items, null)).toBe(items);
    expect(sortEntities(items, { key: "status", direction: "asc" }).map((i) => i.id)).toEqual([2, 3, 1]);
    expect(sortEntities(items, { key: "status", direction: "desc" }).map((i) => i.id)).toEqual([1, 2, 3]);
  });
});

describe("EntitySummaryTable", () => {
  function setup(onSelect = vi.fn(), withExtra = false) {
    render(
      <EntitySummaryTable
        items={items}
        onSelect={onSelect}
        summaryCardClass="card"
        accent="#000"
        tableTitle="Resumen de metas"
        tableColumnLabel="Meta"
        itemLabel="meta"
        pluralLabel="metas"
        cardDetail={(item) => `Detalle ${item.name}`}
        cardExtra={withExtra ? (item) => <span>Extra {item.name}</span> : undefined}
      />,
    );
    return onSelect;
  }

  it("toggles numeric columns from descending to ascending and resets the order", () => {
    setup();
    expect(names()).toEqual(["Beta", "Alfa", "Gamma"]);
    const header = screen.getByRole("columnheader", { name: /KRs completados/ });
    fireEvent.click(screen.getByRole("button", { name: "Ordenar por KRs completados" }));
    expect(header).toHaveAttribute("aria-sort", "descending");
    expect(names()).toEqual(["Alfa", "Beta", "Gamma"]);

    fireEvent.click(screen.getByRole("button", { name: "Ordenar por KRs completados" }));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(names()).toEqual(["Gamma", "Beta", "Alfa"]);

    fireEvent.click(screen.getByRole("button", { name: "Orden de registro" }));
    expect(header).toHaveAttribute("aria-sort", "none");
    expect(names()).toEqual(["Beta", "Alfa", "Gamma"]);
  });

  it("sorts text columns ascending first, then descending", () => {
    setup();
    const header = screen.getByRole("columnheader", { name: /^Meta/ });
    fireEvent.click(screen.getByRole("button", { name: "Ordenar por Meta" }));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(names()).toEqual(["Alfa", "Beta", "Gamma"]);
    fireEvent.click(screen.getByRole("button", { name: "Ordenar por Meta" }));
    expect(header).toHaveAttribute("aria-sort", "descending");
    expect(names()).toEqual(["Gamma", "Beta", "Alfa"]);
    fireEvent.click(screen.getByRole("button", { name: "Ordenar por Estado" }));
    expect(screen.getByRole("columnheader", { name: /^Estado/ })).toHaveAttribute("aria-sort", "ascending");
  });

  it("selects a row from the row and from its action button, with optional extra content", () => {
    const onSelect = setup(vi.fn(), true);
    expect(screen.getByText("Extra Alfa")).toBeInTheDocument();
    expect(screen.getByText("Detalle Beta")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Beta"));
    fireEvent.click(screen.getByRole("button", { name: "Detalle de Alfa" }));
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenLastCalledWith(items[1]);
  });

  it("omits the extra content when none is provided", () => {
    setup();
    expect(screen.queryByText(/^Extra/)).not.toBeInTheDocument();
  });
});
