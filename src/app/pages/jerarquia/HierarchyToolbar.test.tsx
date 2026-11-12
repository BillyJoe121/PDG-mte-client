import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { HierarchyOverview } from "./HierarchyOverview";
import { HierarchyToolbar } from "./HierarchyToolbar";
import { StrategyJumpButtons } from "./StrategyJumpButtons";

type ToolbarProps = Parameters<typeof HierarchyToolbar>[0];

function baseProps(overrides: Partial<ToolbarProps> = {}): ToolbarProps {
  return {
    view: "arbol",
    onViewChange: vi.fn(),
    viewMode: "table",
    onViewModeChange: vi.fn(),
    period: "",
    periods: [{ id: 1, name: "2026-1" } as ToolbarProps["periods"][number]],
    onPeriodChange: vi.fn(),
    showSearch: true,
    search: "",
    onSearchChange: vi.fn(),
    canCreate: true,
    canManageKeyResults: true,
    onShowArchived: vi.fn(),
    onCreate: vi.fn(),
    onReload: vi.fn(),
    betsCount: 2,
    goalsCount: 3,
    totalKrs: 4,
    totalProjects: 5,
    ...overrides,
  };
}

describe("HierarchyToolbar", () => {
  beforeAll(() => {
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.releasePointerCapture ??= () => undefined;
    Element.prototype.scrollIntoView ??= () => undefined;
  });

  it("shows the summary, search and actions and reports interactions", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<HierarchyToolbar {...props} />);

    expect(screen.getByText(/2 apuestas/)).toHaveTextContent("2 apuestas · 3 metas · 4 KRs · 5 iniciativas");
    await user.type(screen.getByRole("textbox", { name: "Buscar en la jerarquía" }), "a");
    expect(props.onSearchChange).toHaveBeenCalledWith("a");

    await user.click(screen.getByRole("button", { name: "Archivados" }));
    await user.click(screen.getByRole("button", { name: "Recargar" }));
    await user.click(screen.getByRole("button", { name: "Nueva Meta" }));
    await user.click(screen.getByRole("button", { name: "Nueva Apuesta" }));
    await user.click(screen.getByRole("button", { name: "Tarjetas" }));
    await user.click(screen.getByRole("button", { name: "Metas" }));

    expect(props.onShowArchived).toHaveBeenCalled();
    expect(props.onReload).toHaveBeenCalled();
    expect(props.onCreate).toHaveBeenNthCalledWith(1, "goal");
    expect(props.onCreate).toHaveBeenNthCalledWith(2, "bet");
    expect(props.onViewModeChange).toHaveBeenCalledWith("cards");
    expect(props.onViewChange).toHaveBeenCalledWith("metas");
  });

  it("maps the period select to the empty value for all periods", async () => {
    const user = userEvent.setup();
    const props = baseProps({ period: "2026-1" });
    const { unmount } = render(<HierarchyToolbar {...props} />);

    await user.click(screen.getByRole("combobox", { name: "Filtrar por periodo" }));
    await user.click(await screen.findByRole("option", { name: "Todos: Periodo" }));
    expect(props.onPeriodChange).toHaveBeenCalledWith("");
    unmount();

    const other = baseProps({ period: "" });
    render(<HierarchyToolbar {...other} />);
    await user.click(screen.getByRole("combobox", { name: "Filtrar por periodo" }));
    await user.click(await screen.findByRole("option", { name: "2026-1" }));
    expect(other.onPeriodChange).toHaveBeenCalledWith("2026-1");
  });

  it("hides creation and archive actions without permissions", () => {
    render(<HierarchyToolbar {...baseProps({ canCreate: false, canManageKeyResults: false })} />);
    expect(screen.queryByRole("button", { name: "Nueva Meta" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archivados" })).not.toBeInTheDocument();
  });

  it("keeps Archivados for key result managers who cannot create", () => {
    render(<HierarchyToolbar {...baseProps({ canCreate: false })} />);
    expect(screen.getByRole("button", { name: "Archivados" })).toBeInTheDocument();
  });

  it("puts the filters first in compact mode and omits the search and summary", () => {
    render(<HierarchyToolbar {...baseProps({ compact: true })} />);
    expect(screen.getByRole("combobox", { name: "Filtrar por periodo" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/apuestas/)).not.toBeInTheDocument();
  });

  it("hides search and view mode toggle when searching is not available", () => {
    render(<HierarchyToolbar {...baseProps({ showSearch: false })} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tarjetas" })).not.toBeInTheDocument();
  });
});

describe("HierarchyOverview", () => {
  it("summarises unique elements by type with an accessible description", () => {
    render(
      <HierarchyOverview
        nodes={[
          { nodeType: "STRATEGIC_BET", id: "1", label: "A", children: [{ nodeType: "GOAL", id: "2", label: "G", children: [] }] },
          { nodeType: "GOAL", id: "2", label: "G", children: [] },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Cobertura de la jerarquia" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Apuesta estrategica: 1, Meta institucional: 1, Key Result: 0, Iniciativa: 0/ })).toBeInTheDocument();
  });

  it("renders with an empty hierarchy", () => {
    render(<HierarchyOverview nodes={[]} />);
    expect(screen.getByRole("img", { name: /Apuesta estrategica: 0/ })).toBeInTheDocument();
  });
});

describe("StrategyJumpButtons", () => {
  it("opens the linked goal and bet", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const goal = { id: 3, name: "Meta 3" } as never;
    const bet = { id: 4, name: "Apuesta 4" } as never;
    render(<StrategyJumpButtons goal={goal} bet={bet} onOpen={onOpen} />);

    await user.click(screen.getByRole("button", { name: "Ver en Meta" }));
    await user.click(screen.getByRole("button", { name: "Ver en Apuesta" }));
    expect(onOpen).toHaveBeenNthCalledWith(1, "GOAL", goal);
    expect(onOpen).toHaveBeenNthCalledWith(2, "STRATEGIC_BET", bet);
  });

  it("disables the buttons that have no link", () => {
    render(<StrategyJumpButtons onOpen={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Ver en Meta: sin meta vinculada" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ver en Apuesta: sin apuesta vinculada" })).toBeDisabled();
  });
});
