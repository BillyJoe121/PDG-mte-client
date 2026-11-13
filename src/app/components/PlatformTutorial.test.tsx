import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { PlatformTutorial } from "./PlatformTutorial";
import { tourStepsFor } from "./tutorial/tourSteps";

const { VISITOR } = vi.hoisted(() => ({ VISITOR: { id: "1", nombre: "Ana", correo: "ana@example.com", rol: "visitor" as const, iniciales: "AN" } }));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: VISITOR }) }));

// jsdom has no layout, so every step is shown centered right away.
vi.mock("./tutorial/useTourTarget", () => ({ useTourTarget: () => ({ ready: true, rect: null }) }));

function CurrentPath() {
  return <span data-testid="path">{useLocation().pathname}</span>;
}

function renderTour(onboarding = false) {
  const onClose = vi.fn();
  render(
    <MemoryRouter initialEntries={["/proyectos"]}>
      <CurrentPath />
      <PlatformTutorial open onboarding={onboarding} onClose={onClose} />
    </MemoryRouter>,
  );
  return onClose;
}

describe("PlatformTutorial", () => {
  it("moves through the screens until Finalizar", () => {
    const onClose = renderTour();
    expect(screen.getByRole("dialog", { name: "Bienvenido a MTE" })).toBeInTheDocument();
    const total = tourStepsFor(VISITOR).length;
    expect(screen.getByText(`Paso 1 de ${total}`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("dialog", { name: "Elige el periodo" })).toBeInTheDocument();
    expect(screen.getByTestId("path")).toHaveTextContent("/dashboard");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/jerarquia");

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/dashboard");

    // Back on step 2: walk the remaining steps to the last one.
    for (let i = 0; i < total - 2; i += 1) fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("dialog", { name: "Aquí está la ayuda" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("on the first visit shows only the help button card, on the current screen, and cannot be skipped", () => {
    const onClose = renderTour(true);
    const dialog = screen.getByRole("dialog", { name: "Aquí está la ayuda" });
    expect(screen.getByText("Antes de empezar")).toBeInTheDocument();
    expect(screen.getByTestId("path")).toHaveTextContent("/proyectos");
    expect(screen.queryByRole("button", { name: "Cerrar recorrido" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Anterior" })).not.toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("can be closed when opened from the help button", () => {
    const onClose = renderTour();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar recorrido" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
