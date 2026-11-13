import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TutorialHost } from "./TutorialHost";
import { useStartTutorial } from "./tutorialContext";
import { markTutorialCompleted, resetTutorialSessionState } from "./tutorialStorage";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ usuario: { id: "1", nombre: "Ana Admin", correo: "ana@example.com", rol: "admin", iniciales: "AA" } }),
}));
vi.mock("../PlatformTutorial", () => ({
  PlatformTutorial: ({ open, onboarding }: { open: boolean; onboarding?: boolean }) =>
    open ? <div data-testid="tour">{onboarding ? "ayuda" : "recorrido"}</div> : null,
}));

function HelpButton() {
  const start = useStartTutorial();
  return <button type="button" onClick={start}>Ayuda</button>;
}

function renderHost(path: string) {
  const router = createMemoryRouter(
    [{ element: <TutorialHost />, children: [{ path: "/dashboard", element: <HelpButton /> }, { path: "/presentacion", element: <p>Presentación</p> }] }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe("TutorialHost", () => {
  afterEach(() => {
    window.localStorage.clear();
    resetTutorialSessionState();
  });

  it("on the user's first visit shows the welcome, then the help button card, on any screen", () => {
    const { unmount } = renderHost("/presentacion");
    expect(screen.getByRole("dialog", { name: "Bienvenido a MTE" })).toBeInTheDocument();
    expect(screen.queryByTestId("tour")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.queryByRole("dialog", { name: "Bienvenido a MTE" })).not.toBeInTheDocument();
    expect(screen.getByTestId("tour")).toHaveTextContent("ayuda");
    unmount();

    markTutorialCompleted("1");
    renderHost("/dashboard");
    expect(screen.queryByTestId("tour")).not.toBeInTheDocument();
  });

  it("opens the full tour from the help button", () => {
    markTutorialCompleted("1");
    renderHost("/dashboard");
    fireEvent.click(screen.getByRole("button", { name: "Ayuda" }));
    expect(screen.getByTestId("tour")).toHaveTextContent("recorrido");
  });
});
