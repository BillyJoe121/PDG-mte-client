import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { PlatformTutorial } from "./PlatformTutorial";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ usuario: { id: "1", nombre: "Ana", correo: "ana@example.com", rol: "visitor", iniciales: "AN" } }),
}));

// jsdom has no layout, so every step is shown centered right away.
vi.mock("./tutorial/useTourTarget", () => ({ useTourTarget: () => ({ ready: true, rect: null }) }));

function CurrentPath() {
  return <span data-testid="path">{useLocation().pathname}</span>;
}

function renderTour(mandatory: boolean) {
  const onClose = vi.fn();
  render(
    <MemoryRouter initialEntries={["/proyectos"]}>
      <CurrentPath />
      <PlatformTutorial open mandatory={mandatory} onClose={onClose} />
    </MemoryRouter>,
  );
  return onClose;
}

describe("PlatformTutorial", () => {
  it("cannot be skipped the first time and moves through the screens until Finalizar", () => {
    const onClose = renderTour(true);
    const dialog = screen.getByRole("dialog", { name: "Bienvenido a MTE" });

    expect(screen.queryByRole("button", { name: "Cerrar recorrido" })).not.toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Paso 1 de 21")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("dialog", { name: "Elige el periodo" })).toBeInTheDocument();
    expect(screen.getByTestId("path")).toHaveTextContent("/dashboard");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/jerarquia");

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/dashboard");

    for (let i = 0; i < 19; i += 1) fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("dialog", { name: "Vuelve cuando quieras" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("can be closed when opened from the help button", () => {
    const onClose = renderTour(false);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar recorrido" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
