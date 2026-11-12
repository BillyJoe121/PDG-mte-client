import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import type { MatrixColumn } from "./hierarchyMatrixModel";
import { MatrixHead } from "./HierarchyMatrixHeader";

function column(key: string): MatrixColumn {
  return { key, label: `Columna ${key}`, node: { id: key } as StrategicHierarchyNode };
}

const search = { indicator: "", initiative: "" };

function renderHead(props: Partial<Parameters<typeof MatrixHead>[0]> = {}) {
  const onToggle = vi.fn();
  const onSearchChange = vi.fn();
  const utils = render(
    <table>
      <MatrixHead goals={[column("g1")]} bets={[column("b1")]} activeKey={null} onToggle={onToggle} search={search} onSearchChange={onSearchChange} {...props} />
    </table>,
  );
  return { onToggle, onSearchChange, ...utils };
}

describe("MatrixHead", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("observes its elements, and ignores a late resize notification after unmounting", () => {
    const callbacks: Array<() => void> = [];
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: () => void) { callbacks.push(callback); }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
    });

    const { unmount } = renderHead();
    // Band, KR header, initiatives header and the two column cells.
    expect(observe).toHaveBeenCalledTimes(5);
    callbacks[0]();

    unmount();
    expect(disconnect).toHaveBeenCalled();
    expect(() => callbacks[0]()).not.toThrow();
  });

  it("filters from a column button or its connector label and emphasizes on hover", async () => {
    const user = userEvent.setup();
    const { onToggle } = renderHead({ activeKey: "g1" });

    await user.click(screen.getByRole("button", { name: "Filtrar por Columna b1" }));
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ key: "b1" }));

    const pressed = screen.getByRole("button", { name: "Filtrar por Columna g1" });
    expect(pressed).toHaveAttribute("aria-pressed", "true");
    await user.hover(pressed);
    await user.unhover(pressed);
  });

  it("reports edits of the indicator and initiative searches", async () => {
    const user = userEvent.setup();
    const { onSearchChange } = renderHead({ search: { indicator: "kr", initiative: "" } });

    await user.type(screen.getByPlaceholderText("Buscar iniciativa"), "a");
    expect(onSearchChange).toHaveBeenLastCalledWith({ indicator: "kr", initiative: "a" });
    await user.type(screen.getByPlaceholderText("Buscar KR o indicador"), "b");
    expect(onSearchChange).toHaveBeenLastCalledWith({ indicator: "krb", initiative: "" });
  });

  it("omits the group titles for an empty side", () => {
    renderHead({ goals: [], bets: [] });
    expect(screen.queryByText("Metas")).not.toBeInTheDocument();
    expect(screen.queryByText("Apuestas")).not.toBeInTheDocument();
  });
});
