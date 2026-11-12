import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ContextualHelp } from "./ContextualHelp";

function renderHelp(onStartTutorial?: () => void, path = "/krs") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ContextualHelp onStartTutorial={onStartTutorial} />
    </MemoryRouter>,
  );
}

describe("ContextualHelp rendering", () => {
  it("opens the help dialog directly when there is no tutorial and closes it", async () => {
    const user = userEvent.setup();
    renderHelp();

    await user.click(screen.getByRole("button", { name: "Ayuda sobre Key Results" }));
    expect(await screen.findByText("Ayuda: Key Results")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Iniciar recorrido guiado" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar ayuda" }));
    expect(screen.queryByText("Ayuda: Key Results")).not.toBeInTheDocument();
  });

  it("offers a menu with the tour and the screen help when a tutorial exists", async () => {
    const user = userEvent.setup();
    const onStartTutorial = vi.fn();
    renderHelp(onStartTutorial);

    await user.click(screen.getByRole("button", { name: "Ayuda sobre Key Results" }));
    await user.click(await screen.findByText("Recorrido guiado"));
    expect(onStartTutorial).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Ayuda sobre Key Results" }));
    await user.click(await screen.findByText("Ayuda de esta pantalla"));
    expect(await screen.findByText("Ayuda: Key Results")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Iniciar recorrido guiado" }));
    expect(onStartTutorial).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Ayuda: Key Results")).not.toBeInTheDocument();
  });

  it("falls back to the default help on an unknown route", async () => {
    const user = userEvent.setup();
    renderHelp(undefined, "/otra-ruta");
    await user.click(screen.getByRole("button", { name: /Ayuda sobre/ }));
    expect(await screen.findByRole("note")).toBeInTheDocument();
  });
});
