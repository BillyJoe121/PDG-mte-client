import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PresentationHeader } from "./PresentationHeader";

function setup(props: Partial<React.ComponentProps<typeof PresentationHeader>> = {}) {
  const handlers = { onBack: vi.fn(), onModeChange: vi.fn(), onPeriodChange: vi.fn(), getExportItems: vi.fn(() => []) };
  render(
    <PresentationHeader
      title="Presentacion"
      activeMode="general"
      periodValue="2026-1"
      periods={[{ id: 1, name: "2026-1" }, { id: "b", name: "2025-2" }]}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

describe("PresentationHeader", () => {
  it("marks the active mode and reports mode, period and back actions", async () => {
    const user = userEvent.setup();
    const handlers = setup();
    expect(screen.getByRole("button", { name: "Informe" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Comparar" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "Presentar" }));
    expect(handlers.onModeChange).toHaveBeenCalledWith("slides");

    await user.selectOptions(screen.getByLabelText("Periodo académico"), "2025-2");
    expect(handlers.onPeriodChange).toHaveBeenCalledWith("2025-2");

    await user.click(screen.getByRole("button", { name: "Volver al dashboard" }));
    expect(handlers.onBack).toHaveBeenCalled();
    expect(screen.getByRole("banner", { name: "Presentacion" })).not.toHaveAttribute("data-presentation-controls");
  });

  it("floats over the stage when immersive and fades while concealed", () => {
    setup({ immersive: true, concealed: true });
    const header = screen.getByRole("banner", { name: "Presentacion" });
    expect(header).toHaveAttribute("data-presentation-controls");
    expect(header.className).toContain("opacity-0");
  });

  it("stays visible when immersive and not concealed", () => {
    setup({ immersive: true });
    expect(screen.getByRole("banner", { name: "Presentacion" }).className).toContain("opacity-100");
  });
});
