import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PresentationExportMenu, type ExportMenuItem } from "./PresentationExportMenu";

function setup(compact = false) {
  const onPdf = vi.fn();
  const onCsv = vi.fn();
  const items: ExportMenuItem[] = [
    { id: "pdf", kind: "pdf", label: "PDF", onSelect: onPdf },
    { id: "off", kind: "csv", label: "CSV apagado", onSelect: vi.fn(), disabled: true },
    { id: "csv", kind: "csv", label: "CSV", onSelect: onCsv },
  ];
  const getItems = vi.fn(() => items);
  render(
    <div>
      <PresentationExportMenu getItems={getItems} compact={compact} />
      <button type="button">outside</button>
    </div>,
  );
  return { getItems, onPdf, onCsv };
}

describe("PresentationExportMenu", () => {
  it("reads the entries only when it opens and focuses the first enabled one", async () => {
    const user = userEvent.setup();
    const { getItems } = setup();
    expect(getItems).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Exportar" }));
    expect(screen.getByRole("menu", { name: "Opciones de exportación" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "PDF" })).toHaveFocus();
    expect(screen.getByRole("menuitem", { name: "CSV apagado" })).toBeDisabled();
  });

  it("runs the chosen entry, closes the menu and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const { onCsv } = setup(true);
    await user.click(screen.getByRole("button", { name: "Exportar" }));
    await user.click(screen.getByRole("menuitem", { name: "CSV" }));
    expect(onCsv).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toHaveFocus();
  });

  it("toggles closed from the trigger and closes on an outside press", async () => {
    const user = userEvent.setup();
    setup();
    const trigger = screen.getByRole("button", { name: "Exportar" });
    await user.click(trigger);
    await user.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    fireEvent.mouseDown(screen.getByRole("menuitem", { name: "PDF" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("moves with the arrow, Home and End keys skipping disabled entries, wrapping around", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Exportar" }));
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "CSV" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "PDF" })).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "CSV" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("menuitem", { name: "PDF" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "CSV" })).toHaveFocus();
    await user.keyboard("a");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes on Escape without leaking the key and on Tab", async () => {
    const user = userEvent.setup();
    setup();
    const outer = vi.fn();
    document.addEventListener("keydown", outer);
    const trigger = screen.getByRole("button", { name: "Exportar" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(outer).not.toHaveBeenCalled();

    await user.click(trigger);
    await user.keyboard("{Tab}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    document.removeEventListener("keydown", outer);
  });

  it("ignores keys while closed and when every entry is disabled", async () => {
    const user = userEvent.setup();
    render(<PresentationExportMenu getItems={() => [{ id: "x", kind: "pdf", label: "Solo", onSelect: vi.fn(), disabled: true }]} />);
    const trigger = screen.getByRole("button", { name: "Exportar" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
