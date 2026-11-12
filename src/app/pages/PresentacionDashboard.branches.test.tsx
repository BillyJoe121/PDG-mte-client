import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ loadPresentationScreen: vi.fn() }));

vi.mock("../services/screenDataCache", () => ({
  loadPresentationScreen: mocks.loadPresentationScreen,
}));

import { PresentacionDashboard } from "./PresentacionDashboard";

const controls = {
  fullscreenEnabled: true,
  keyboardNavigationEnabled: true,
  nextKeys: ["ArrowRight", "Space"],
  previousKeys: ["ArrowLeft"],
  exitKeys: ["Escape"],
};

const summary = { summaryText: "", completedKeyResults: 1, inProgressKeyResults: 1, completedProjects: 1, inProgressProjects: 1, periods: [] };

const baseData = {
  periods: [
    { id: 1, name: "2025-2", status: "CERRADO", startDate: "2025-07-01", endDate: "2025-12-31" },
    { id: 2, name: "2026-1", status: "ACTIVO", startDate: "2026-01-01", endDate: "2026-06-30" },
    { id: 3, name: "2024-1", status: "CERRADO", startDate: undefined, endDate: undefined },
  ],
  presentation: {
    period: "2026-1",
    title: "Presentación de prueba",
    controls,
    slides: [
      { order: 1, type: "COVER", title: "Portada", subtitle: "Periodo", content: {} },
      { order: 2, type: "CLOSING", title: "Cierre", subtitle: "Resumen", content: { summaryText: "Fin" } },
    ],
  },
  bets: [{ id: 1, name: "Apuesta uno", description: "", status: "ACTIVA", createdAt: "2026-01-01", executionSummary: summary }],
  goals: [{ id: 1, name: "Meta uno", description: "", status: "ACTIVA", createdAt: "2026-01-01", periods: [], executionSummary: summary }],
};

function renderPage(entry = "/presentacion") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/presentacion" element={<PresentacionDashboard />} />
        <Route path="/dashboard" element={<h1>Panel principal</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

const REPORT_HEADING = /todas las metas y apuestas en conjunto/i;
const nav = () => screen.getByRole("navigation", { name: "Modos de presentación" });
const press = async (key: string) => {
  await act(async () => {
    fireEvent.keyDown(window, { key });
  });
};

function setFullscreenElement(value: Element | null) {
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value });
}

describe("PresentacionDashboard branches", () => {
  const original = document.documentElement.requestFullscreen;

  beforeEach(() => {
    mocks.loadPresentationScreen.mockReset();
    mocks.loadPresentationScreen.mockResolvedValue(baseData);
  });

  afterEach(() => {
    setFullscreenElement(null);
    Object.defineProperty(document, "exitFullscreen", { configurable: true, value: undefined });
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: original });
  });

  it("uses a generic message when the failure is not an Error and retries with the selected period", async () => {
    mocks.loadPresentationScreen.mockRejectedValueOnce("fallo");
    renderPage();
    expect(await screen.findByText("No fue posible cargar la presentación")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(await screen.findByRole("heading", { name: REPORT_HEADING })).toBeInTheDocument();
    expect(mocks.loadPresentationScreen).toHaveBeenLastCalledWith(undefined, { force: true });
  });

  it("shows an empty state without data and goes back to the dashboard", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(null);
    renderPage();
    expect(await screen.findByText("No hay datos para este periodo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /volver al dashboard/i }));
    expect(await screen.findByRole("heading", { name: "Panel principal" })).toBeInTheDocument();
  });

  it("reloads the selected period, listing periods newest first, and goes back from the header", async () => {
    renderPage();
    await screen.findByRole("heading", { name: REPORT_HEADING });
    const select = screen.getByRole("combobox");
    const options = within(select).getAllByRole("option").map((option) => (option as HTMLOptionElement).value);
    expect(options.indexOf("2026-1")).toBeLessThan(options.indexOf("2025-2"));

    await act(async () => {
      fireEvent.change(select, { target: { value: "2025-2" } });
    });
    expect(mocks.loadPresentationScreen).toHaveBeenLastCalledWith("2025-2", { force: true });
    await screen.findByRole("heading", { name: REPORT_HEADING });

    fireEvent.click(screen.getByRole("button", { name: "Volver al dashboard" }));
    expect(await screen.findByRole("heading", { name: "Panel principal" })).toBeInTheDocument();
  });

  it("copes with a response that has no bets, goals, periods, title or controls", async () => {
    mocks.loadPresentationScreen.mockResolvedValue({
      presentation: { period: "", title: "", slides: [{ order: 1, type: "CLOSING", title: "Cierre", subtitle: "", content: {} }] },
    });
    renderPage("/presentacion?view=slides");
    expect(await screen.findByText(/^1 \/ \d+$/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pantalla completa/i })).not.toBeInTheDocument();
    await press("f");
    await press("ArrowRight");
  });

  it("opens the detail of a goal from the report and from the comparison", async () => {
    renderPage();
    await screen.findByRole("heading", { name: REPORT_HEADING });
    fireEvent.click(screen.getByRole("button", { name: "Detalle de Meta uno" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cerrar ventana modal/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(within(nav()).getByRole("button", { name: "Comparar" }));
    fireEvent.click(await screen.findByRole("button", { name: /meta vs meta/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /^ver detalle de meta uno/i })[0]);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("closes the open detail with Escape before leaving the view", async () => {
    renderPage();
    await screen.findByRole("heading", { name: REPORT_HEADING });
    fireEvent.click(screen.getByRole("button", { name: "Detalle de Apuesta uno" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await press("Escape");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: REPORT_HEADING })).toBeInTheDocument();
  });

  it("leaves Comparar for Informe with Escape and ignores Escape already handled or in fullscreen", async () => {
    renderPage("/presentacion?modo=compare");
    expect(await screen.findByRole("heading", { name: "Comparativa de registros" })).toBeInTheDocument();

    const handled = new KeyboardEvent("keydown", { key: "Escape", cancelable: true, bubbles: true });
    handled.preventDefault();
    await act(async () => {
      window.dispatchEvent(handled);
    });
    expect(screen.getByRole("heading", { name: "Comparativa de registros" })).toBeInTheDocument();

    await press("Escape");
    expect(await screen.findByRole("heading", { name: /todas las metas y apuestas en conjunto/i })).toBeInTheDocument();

    setFullscreenElement(document.body);
    await press("Escape");
    expect(screen.queryByRole("heading", { name: "Panel principal" })).not.toBeInTheDocument();
  });

  it("ignores keys typed in text fields and slide shortcuts outside Presentar", async () => {
    renderPage();
    await screen.findByRole("heading", { name: REPORT_HEADING });
    const input = document.createElement("input");
    document.body.appendChild(input);
    await act(async () => {
      fireEvent.keyDown(input, { key: "Escape" });
    });
    input.remove();
    await press("ArrowRight");
    expect(screen.getByRole("heading", { name: /todas las metas y apuestas en conjunto/i })).toBeInTheDocument();
  });

  it("follows browser fullscreen changes and leaves fullscreen with F", async () => {
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, "exitFullscreen", { configurable: true, value: exitFullscreen });
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
    renderPage("/presentacion?modo=slides");
    await screen.findByRole("heading", { name: "Portada" });

    setFullscreenElement(document.body);
    await act(async () => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    await press("f");
    expect(exitFullscreen).toHaveBeenCalledOnce();

    setFullscreenElement(null);
    await act(async () => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
  });

  it("shows a notice when the browser refuses fullscreen", async () => {
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: vi.fn().mockRejectedValue(new Error("no")) });
    renderPage("/presentacion?modo=slides");
    await screen.findByRole("heading", { name: "Portada" });
    await press("f");
    expect(await screen.findByText("El navegador no permitió activar la pantalla completa.")).toBeInTheDocument();
  });

  it("exits fullscreen when leaving Presentar, even if the browser rejects it", async () => {
    const exitFullscreen = vi.fn().mockRejectedValue(new Error("no"));
    Object.defineProperty(document, "exitFullscreen", { configurable: true, value: exitFullscreen });
    renderPage("/presentacion?modo=slides");
    await screen.findByRole("heading", { name: "Portada" });
    setFullscreenElement(document.body);
    fireEvent.click(within(nav()).getByRole("button", { name: "Informe" }));
    await waitFor(() => expect(exitFullscreen).toHaveBeenCalled());
  });

  it("starts without a cover slide and moves with the shortcuts", async () => {
    mocks.loadPresentationScreen.mockResolvedValue({
      ...baseData,
      presentation: { ...baseData.presentation, slides: [{ order: 1, type: "CLOSING", title: "Cierre", subtitle: "", content: {} }] },
    });
    renderPage("/presentacion?modo=slides");
    expect(await screen.findByText(/^1 \/ \d+$/)).toBeInTheDocument();
    await press("ArrowRight");
    expect(await screen.findByText(/^2 \/ \d+$/)).toBeInTheDocument();
    await press("ArrowLeft");
    expect(await screen.findByText(/^1 \/ \d+$/)).toBeInTheDocument();
    await press("Home");
    await press("g");
  });
});
