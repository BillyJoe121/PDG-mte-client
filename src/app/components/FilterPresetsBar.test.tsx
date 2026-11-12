import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const filters = vi.hoisted(() => ({
  ctx: {} as Record<string, unknown>,
}));
const audit = vi.hoisted(() => ({ logAudit: vi.fn() }));

vi.mock("../context/FiltersContext", () => ({ useGlobalFilters: () => filters.ctx }));
vi.mock("../context/AuditContext", () => ({ useAudit: () => audit }));

import { FilterPresetsBar } from "./FilterPresetsBar";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const F = { periodo: "2026", departamento: "todos", estadoProyecto: "todos", avanceProyecto: "todos" };

function setup(presets: unknown[] = []) {
  filters.ctx = {
    filters: F,
    presets,
    applyPreset: vi.fn(),
    savePreset: vi.fn(),
    deletePreset: vi.fn(),
  };
  return filters.ctx as Record<"applyPreset" | "savePreset" | "deletePreset", ReturnType<typeof vi.fn>>;
}

beforeEach(() => audit.logAudit.mockReset());

describe("FilterPresetsBar", () => {
  it("shows the empty state", () => {
    setup();
    render(<FilterPresetsBar />);

    expect(screen.getByText("No hay presets guardados.")).toBeInTheDocument();
  });

  it("saves a named preset, audits it and clears the input", async () => {
    const ctx = setup();
    render(<FilterPresetsBar modulo="Proyectos" />);
    const input = screen.getByPlaceholderText("Nombre del preset");

    await userEvent.type(input, "  Vista A ");
    await userEvent.click(screen.getByRole("button", { name: "Guardar vista" }));

    expect(ctx.savePreset).toHaveBeenCalledWith("Vista A");
    expect(audit.logAudit).toHaveBeenCalledWith(expect.objectContaining({ modulo: "Proyectos", entidad: "Vista A" }));
    expect(input).toHaveValue("");
  });

  it("does not audit an empty name", async () => {
    const ctx = setup();
    render(<FilterPresetsBar />);

    await userEvent.click(screen.getByRole("button", { name: "Guardar vista" }));

    expect(ctx.savePreset).toHaveBeenCalledWith("");
    expect(audit.logAudit).not.toHaveBeenCalled();
  });

  it("applies and deletes presets, notifying the caller only for known ones", async () => {
    const preset = { id: "p1", nombre: "Mi vista", filters: F, creadoEn: "2026-01-01" };
    const ctx = setup([preset]);
    const onApplied = vi.fn();
    render(<FilterPresetsBar onPresetApplied={onApplied} />);

    await userEvent.click(screen.getByRole("button", { name: "Mi vista" }));
    expect(ctx.applyPreset).toHaveBeenCalledWith("p1");
    expect(onApplied).toHaveBeenCalledWith(F);

    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[buttons.length - 1]);
    expect(ctx.deletePreset).toHaveBeenCalledWith("p1");
  });

  it("applies without a callback", async () => {
    const ctx = setup([{ id: "p1", nombre: "Mi vista", filters: F, creadoEn: "2026-01-01" }]);
    render(<FilterPresetsBar />);

    await userEvent.click(screen.getByRole("button", { name: "Mi vista" }));

    expect(ctx.applyPreset).toHaveBeenCalledWith("p1");
  });
});

describe("ImageWithFallback", () => {
  it("renders the image and swaps to the placeholder on error", () => {
    render(<ImageWithFallback src="https://example.test/a.png" alt="Logo" className="w-4" />);
    const img = screen.getByAltText("Logo");
    expect(img).toHaveAttribute("src", "https://example.test/a.png");

    fireEvent.error(img);

    const fallback = screen.getByAltText("Error loading image");
    expect(fallback).toHaveAttribute("data-original-url", "https://example.test/a.png");
  });

  it("works without a className on the fallback", () => {
    render(<ImageWithFallback src="https://example.test/b.png" alt="B" />);

    fireEvent.error(screen.getByAltText("B"));

    expect(screen.getByAltText("Error loading image")).toBeInTheDocument();
  });
});
