import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadPresentationScreen: vi.fn(),
}));

vi.mock("../services/screenDataCache", () => ({
  loadPresentationScreen: mocks.loadPresentationScreen,
}));

import { PresentacionDashboard } from "./PresentacionDashboard";

const response = {
  periods: [{ id: 1, name: "2026-1", status: "ACTIVO", startDate: "2026-01-01", endDate: "2026-06-30" }],
  presentation: {
    period: "2026-1",
    title: "Modo presentación MTE",
    controls: {
      fullscreenEnabled: true,
      keyboardNavigationEnabled: true,
      nextKeys: ["ArrowRight", "Space"],
      previousKeys: ["ArrowLeft"],
      exitKeys: ["Escape"],
    },
    slides: [
      { order: 1, type: "COVER", title: "Seguimiento estratégico", subtitle: "Periodo 2026-1", content: {} },
      { order: 2, type: "CLOSING", title: "Cierre", subtitle: "Resumen", content: { summaryText: "Cierre del periodo" } },
    ],
  },
  bets: [],
  goals: [],
};

async function renderPresenter() {
  render(
    <MemoryRouter initialEntries={["/presentacion?modo=slides"]}>
      <Routes>
        <Route path="/presentacion" element={<PresentacionDashboard />} />
        <Route path="/dashboard" element={<h1>Dashboard</h1>} />
      </Routes>
    </MemoryRouter>
  );
  expect(await screen.findByRole("heading", { name: "Seguimiento estratégico" })).toBeInTheDocument();
  expect(screen.getByText("1 / 3")).toBeInTheDocument();
}

async function press(key: string, target: Element | Window = window) {
  await act(async () => {
    fireEvent.keyDown(target, { key });
  });
}

describe("PresentacionDashboard presenter stage", () => {
  const requestFullscreen = vi.fn(async () => undefined);
  const original = document.documentElement.requestFullscreen;

  beforeEach(() => {
    mocks.loadPresentationScreen.mockReset();
    mocks.loadPresentationScreen.mockResolvedValue(response);
    requestFullscreen.mockClear();
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: requestFullscreen });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: original });
  });

  it("draws the slide on a fixed 1920×1080 stage", async () => {
    await renderPresenter();
    const stage = screen.getByRole("region", { name: "Diapositiva 1 de 3" });
    expect(stage).toHaveStyle({ width: "1920px", height: "1080px" });
    // jsdom measures nothing, so the stage keeps its natural scale.
    expect(stage.style.transform).toBe("scale(1)");
    expect(screen.getByRole("progressbar", { name: "Progreso de la presentación" })).toHaveAttribute("aria-valuenow", "1");
  });

  it("jumps to the first and last slide with Home and End", async () => {
    await renderPresenter();
    await press("End");
    expect(await screen.findByText("3 / 3")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cierre" })).toBeInTheDocument();
    await press("Home");
    expect(await screen.findByText("1 / 3")).toBeInTheDocument();
  });

  it("opens the thumbnails with G, jumps to a slide and returns focus", async () => {
    await renderPresenter();
    await press("g");
    const overview = screen.getByRole("dialog", { name: "Vista de miniaturas" });
    const thumbs = within(overview).getAllByRole("button", { name: /ir a la diapositiva/i });
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0]).toHaveAttribute("aria-current", "true");
    expect(thumbs[0]).toHaveFocus();

    // The arrows move between thumbnails instead of changing the slide.
    await press("ArrowRight", thumbs[0]);
    expect(thumbs[1]).toHaveFocus();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(within(overview).getByRole("button", { name: /ir a la diapositiva 3: cierre/i }));
    });
    expect(screen.queryByRole("dialog", { name: "Vista de miniaturas" })).not.toBeInTheDocument();
    expect(await screen.findByText("3 / 3")).toBeInTheDocument();
  });

  it("opens the thumbnails from the controls and marks the toggle as pressed", async () => {
    await renderPresenter();
    const toolbar = screen.getByRole("toolbar", { name: "Controles de la presentación" });
    const toggle = within(toolbar).getByRole("button", { name: "Vista de miniaturas" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(screen.getByRole("dialog", { name: "Vista de miniaturas" })).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cerrar miniaturas" }));
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes layers one at a time with Escape: thumbnails, then Presentar back to Informe, then the page", async () => {
    await renderPresenter();
    await press("g");
    expect(screen.getByRole("dialog", { name: "Vista de miniaturas" })).toBeInTheDocument();

    await press("Escape");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    await press("Escape");
    expect(screen.queryByRole("toolbar", { name: "Controles de la presentación" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Informe" })).toHaveAttribute("aria-pressed", "true");

    await press("Escape");
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("toggles fullscreen with F but not with Ctrl+F", async () => {
    await renderPresenter();
    await act(async () => {
      fireEvent.keyDown(window, { key: "f", ctrlKey: true });
    });
    expect(requestFullscreen).not.toHaveBeenCalled();
    await press("f");
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("goes back to Informe from the exit control", async () => {
    await renderPresenter();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Salir de la presentación" }));
    });
    expect(screen.getByRole("button", { name: "Informe" })).toHaveAttribute("aria-pressed", "true");
  });

  it("hides the controls after a pause and keeps them reachable by keyboard", async () => {
    await renderPresenter();
    vi.useFakeTimers();
    act(() => void fireEvent.mouseMove(window, { clientX: 40, clientY: 40 }));
    const toolbar = screen.getByRole("toolbar", { name: "Controles de la presentación" });
    expect(toolbar).toHaveClass("opacity-100");

    act(() => void vi.advanceTimersByTime(1500));
    expect(toolbar).toHaveClass("opacity-0");
    const next = within(toolbar).getByRole("button", { name: "Siguiente diapositiva" });
    expect(next).not.toHaveAttribute("tabindex", "-1");

    act(() => next.focus());
    expect(toolbar).toHaveClass("opacity-100");
  });
});
