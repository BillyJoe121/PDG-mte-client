import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScreenToolbar, ToolbarButton, ToolbarCreateButton, ToolbarSearch, ToolbarSegmented } from "./ScreenToolbar";

const ACCENT = { color: "#5454E9", background: "#EEF2FF" };

describe("ScreenToolbar", () => {
  it("places search, then actions, then filters and summary", () => {
    render(
      <ScreenToolbar
        search={<span>buscar</span>}
        actions={<span>acciones</span>}
        filters={<span>filtros</span>}
        summary="12 KRs"
      />,
    );

    const order = screen.getAllByText(/buscar|acciones|filtros|12 KRs/).map((element) => element.textContent);
    expect(order).toEqual(["buscar", "acciones", "filtros", "12 KRs"]);
  });

  it("leaves out the filter row when the screen has neither filters nor summary", () => {
    const { container } = render(<ScreenToolbar actions={<span>acciones</span>} />);

    expect(container.querySelectorAll(".mt-2")).toHaveLength(0);
  });

  it("reports the search text and names the field", () => {
    const onChange = vi.fn();
    render(<ToolbarSearch value="" onChange={onChange} placeholder="Buscar..." ariaLabel="Buscar iniciativas" />);

    fireEvent.change(screen.getByRole("textbox", { name: "Buscar iniciativas" }), { target: { value: "becas" } });

    expect(onChange).toHaveBeenCalledWith("becas");
  });

  it("marks the selected segment and reports a new choice", () => {
    const onChange = vi.fn();
    const options = [{ value: "a", label: "Todas" }, { value: "b", label: "Metas" }] as const;
    render(<ToolbarSegmented ariaLabel="Filtrar" options={options} value="a" onChange={onChange} accent={ACCENT} />);

    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Metas" }));

    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("forwards button state and create clicks", () => {
    const onCreate = vi.fn();
    render(
      <>
        <ToolbarButton aria-pressed={true} active={ACCENT}>Archivados</ToolbarButton>
        <ToolbarCreateButton tone="green" onClick={onCreate}>Nueva iniciativa</ToolbarCreateButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "Archivados" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Nueva iniciativa" }));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
