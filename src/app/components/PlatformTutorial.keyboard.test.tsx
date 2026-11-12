import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlatformTutorial } from "./PlatformTutorial";

const mocks = vi.hoisted(() => ({
  user: { id: "1", nombre: "Ana", correo: "ana@example.com", rol: "visitor" as const, iniciales: "AN" } as unknown,
  target: { ready: true, rect: null as null | { top: number; left: number; width: number; height: number } },
  targetArgs: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: mocks.user }) }));
vi.mock("./tutorial/useTourTarget", () => ({
  useTourTarget: (...args: unknown[]) => { mocks.targetArgs(...args); return mocks.target; },
}));

function renderTour(props: { open?: boolean; mandatory?: boolean; path?: string } = {}) {
  const onClose = vi.fn();
  const utils = render(
    <MemoryRouter initialEntries={[props.path ?? "/proyectos"]}>
      <PlatformTutorial open={props.open ?? true} mandatory={props.mandatory} onClose={onClose} />
    </MemoryRouter>,
  );
  return { onClose, ...utils };
}

describe("PlatformTutorial keyboard and layout", () => {
  beforeEach(() => {
    mocks.user = { id: "1", nombre: "Ana", correo: "ana@example.com", rol: "visitor", iniciales: "AN" };
    mocks.target = { ready: true, rect: null };
    mocks.targetArgs.mockClear();
  });

  it("wraps focus from the last button to the first and from the first back to the last", () => {
    renderTour();
    const dialog = screen.getByRole("dialog");
    const buttons = screen.getAllByRole("button").filter((button) => !button.hasAttribute("disabled"));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    last.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();

    dialog.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("leaves Tab alone in the middle of the card and ignores other keys", () => {
    renderTour();
    const dialog = screen.getByRole("dialog");
    const buttons = screen.getAllByRole("button");
    buttons[0].focus();
    const prevented = !fireEvent.keyDown(dialog, { key: "Tab" });
    expect(prevented).toBe(false);
    fireEvent.keyDown(dialog, { key: "a" });
  });

  it("highlights the target with a spotlight around its box", () => {
    mocks.target = { ready: true, rect: { top: 100, left: 50, width: 200, height: 30 } };
    renderTour();
    const spotlight = Array.from(document.body.querySelectorAll<HTMLElement>("[aria-hidden='true'].pointer-events-none"))[0];
    expect(spotlight.style.top).toBe("94px");
    expect(spotlight.style.left).toBe("44px");
    expect(spotlight.style.width).toBe("212px");
  });

  it("follows viewport resizes", () => {
    mocks.target = { ready: true, rect: { top: 10, left: 10, width: 20, height: 20 } };
    renderTour();
    const dialog = screen.getByRole("dialog");
    const before = dialog.style.left;
    act(() => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 400 });
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(before).toBeDefined();
  });

  it("shows nothing while closed and does not track a target", () => {
    renderTour({ open: false });
    expect(screen.queryByTestId("guided-tour")).not.toBeInTheDocument();
    expect(mocks.targetArgs.mock.calls[0][1]).toBe(false);
  });

  it("hides the card until the target search finishes", () => {
    mocks.target = { ready: false, rect: null };
    renderTour();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("guided-tour")).toBeInTheDocument();
  });

  it("still offers a tour without a signed-in user", () => {
    mocks.user = null;
    renderTour();
    expect(screen.getByTestId("guided-tour")).toBeInTheDocument();
  });

  it("restarts from the first step when reopened", () => {
    const onClose = vi.fn();
    const tree = (open: boolean) => (
      <MemoryRouter initialEntries={["/proyectos"]}><PlatformTutorial open={open} onClose={onClose} /></MemoryRouter>
    );
    const { rerender } = render(tree(true));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText(/^Paso 2 de/)).toBeInTheDocument();
    rerender(tree(false));
    rerender(tree(true));
    expect(screen.getByText(/^Paso 1 de/)).toBeInTheDocument();
  });
});
