import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { HierarchyMatrix } from "./HierarchyMatrix";

type Node = StrategicHierarchyNode;

const kr1: Node = {
  nodeType: "KEY_RESULT",
  id: "1",
  label: "Retención anual",
  children: [
    { nodeType: "PROJECT", id: "10", label: "Tutorías", children: [] },
    { nodeType: "PROJECT", id: "11", label: "Becas", children: [] },
  ],
};
const kr2: Node = { nodeType: "KEY_RESULT", id: "2", label: "Graduación", description: "Cohortes", children: [] };

const goal: Node = { nodeType: "GOAL", id: "5", label: "Meta de permanencia larga", children: [kr1, kr2] };
const bet: Node = { nodeType: "STRATEGIC_BET", id: "7", label: "Apuesta", children: [kr1] };
const tree = [goal, bet];

afterEach(() => vi.unstubAllGlobals());

function setup(props: Partial<Parameters<typeof HierarchyMatrix>[0]> = {}) {
  const onOpenNode = vi.fn();
  const onOpenRoot = vi.fn();
  const utils = render(<HierarchyMatrix tree={tree} view="arbol" onOpenNode={onOpenNode} onOpenRoot={onOpenRoot} {...props} />);
  return { onOpenNode, onOpenRoot, ...utils };
}

describe("HierarchyMatrix", () => {
  it("lists key results with their initiatives and the links to goals and bets", () => {
    setup();
    const region = screen.getByRole("region", { name: /Matriz de Metas/ });
    expect(within(region).getByText("KR-01")).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: "Retención anual" })).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: /PROY-10 Tutorías/ })).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: /PROY-11 Becas/ })).toBeInTheDocument();
    expect(within(region).getByText("Sin iniciativas")).toBeInTheDocument();
    expect(within(region).getAllByText("Vinculado a Apuesta")).toHaveLength(1);
    expect(within(region).getAllByText("Vinculado a Meta de permanencia larga")).toHaveLength(2);
  });

  it("marks for the tour the first initiative of the table, even below key results without any", () => {
    const empty: Node = { nodeType: "KEY_RESULT", id: "0", label: "Sin iniciativas aún", children: [] };
    const { container } = setup({ tree: [{ ...goal, children: [empty, kr1] }] });
    expect(container.querySelector('[data-tour="jerarquia-kr"]')).toHaveTextContent("Sin iniciativas aún");
    const marked = container.querySelectorAll('[data-tour="jerarquia-initiative"]');
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveTextContent("Tutorías");
  });

  it("opens key results and initiatives", async () => {
    const user = userEvent.setup();
    const { onOpenNode } = setup();
    await user.click(screen.getByRole("button", { name: "Retención anual" }));
    await user.click(screen.getByRole("button", { name: /PROY-11 Becas/ }));
    expect(onOpenNode).toHaveBeenNthCalledWith(1, kr1);
    expect(onOpenNode).toHaveBeenNthCalledWith(2, kr1.children[1]);
  });

  it("filters by a column, offers its detail and clears the filter", async () => {
    const user = userEvent.setup();
    const { onOpenRoot } = setup();

    await user.click(screen.getByRole("button", { name: "Filtrar por Apuesta" }));
    expect(screen.getByText("Filtrando por: Apuesta")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Graduación" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver detalle" }));
    expect(onOpenRoot).toHaveBeenCalledWith(bet);

    await user.click(screen.getByRole("button", { name: "Quitar filtro" }));
    expect(screen.queryByText(/Filtrando por/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Graduación" })).toBeInTheDocument();

    // Pressing the same column twice toggles the filter off again.
    await user.click(screen.getByRole("button", { name: "Filtrar por Apuesta" }));
    await user.click(screen.getByRole("button", { name: "Filtrar por Apuesta" }));
    expect(screen.queryByText(/Filtrando por/)).not.toBeInTheDocument();
  });

  it("highlights the goals and bets of the hovered key result row, and the hovered column", async () => {
    const user = userEvent.setup();
    setup();
    const stroke = (name: string) => screen.getByRole("button", { name }).querySelector("svg")?.getAttribute("stroke-width");

    // Graduación is linked only to the goal.
    await user.hover(screen.getByRole("button", { name: "Graduación" }));
    expect(stroke("Filtrar por Meta de permanencia larga")).toBe("2.6");
    expect(stroke("Filtrar por Apuesta")).toBe("2");

    // An initiative row belongs to its key result, linked to both.
    await user.hover(screen.getByRole("button", { name: /PROY-11 Becas/ }));
    expect(stroke("Filtrar por Apuesta")).toBe("2.6");

    await user.unhover(screen.getByRole("button", { name: /PROY-11 Becas/ }));
    await user.hover(screen.getByRole("button", { name: "Filtrar por Apuesta" }));
    expect(stroke("Filtrar por Apuesta")).toBe("2.6");
    expect(stroke("Filtrar por Meta de permanencia larga")).toBe("2");
  });

  it("filters from the diagonal label buttons too", async () => {
    const user = userEvent.setup();
    setup();
    const label = screen.getAllByTitle("Apuesta").find((el) => el.getAttribute("tabindex") === "-1")!;
    await user.hover(label);
    await user.click(label);
    expect(screen.getByText("Filtrando por: Apuesta")).toBeInTheDocument();
    await user.unhover(label);
  });

  it("searches key results and initiatives, and clears with the button and Escape", async () => {
    const user = userEvent.setup();
    setup();

    const indicator = screen.getByRole("searchbox", { name: "Buscar en Indicador" });
    await user.type(indicator, "gradu");
    expect(screen.queryByRole("button", { name: "Retención anual" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Graduación" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda en Indicador" }));
    expect(indicator).toHaveValue("");

    const initiatives = screen.getByRole("searchbox", { name: "Buscar en Iniciativas" });
    await user.type(initiatives, "becas");
    expect(screen.queryByRole("button", { name: /Tutorías/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Becas/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(initiatives).toHaveValue("");

    await user.type(indicator, "zzz");
    expect(screen.getByText("No hay KR ni iniciativas que coincidan con la búsqueda.")).toBeInTheDocument();
  });

  it("starts from the given focus", () => {
    setup({ initialFocus: { columnKey: "STRATEGIC_BET:7", search: { indicator: "", initiative: "tutor" } } });
    expect(screen.getByText("Filtrando por: Apuesta")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Buscar en Iniciativas" })).toHaveValue("tutor");
    expect(screen.queryByRole("button", { name: /Becas/ })).not.toBeInTheDocument();
  });

  it("shows only goal columns in the goals view and only bets in the bets view", () => {
    const { unmount } = setup({ view: "metas" });
    expect(screen.queryByRole("button", { name: "Filtrar por Apuesta" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filtrar por Meta de permanencia larga" })).toBeInTheDocument();
    unmount();
    setup({ view: "apuestas" });
    expect(screen.getByRole("button", { name: "Filtrar por Apuesta" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Filtrar por Meta/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Graduación" })).not.toBeInTheDocument();
  });

  it("shows an empty message when nothing matches the filters", () => {
    setup({ tree: [{ nodeType: "GOAL", id: "1", label: "Meta vacía", children: [] }] });
    expect(screen.getByText("No hay KR que coincidan con los filtros.")).toBeInTheDocument();
  });

  it("ignores non-root nodes and non key-result children", () => {
    setup({
      tree: [
        { nodeType: "PROJECT", id: "1", label: "Suelta", children: [] },
        { nodeType: "GOAL", id: "2", label: "Meta", children: [{ nodeType: "PROJECT", id: "3", label: "No KR", children: [] }, kr2] },
      ],
    });
    expect(screen.queryByText("Suelta")).not.toBeInTheDocument();
    expect(screen.queryByText("No KR")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Graduación" })).toBeInTheDocument();
  });

  it("renders the header when ResizeObserver is unavailable", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    setup();
    expect(screen.getByRole("region", { name: /Matriz de Metas/ })).toBeInTheDocument();
  });
});
