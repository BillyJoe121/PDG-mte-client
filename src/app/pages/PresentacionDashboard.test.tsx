import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ loadPresentationScreen: vi.fn() }));

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
      { order: 1, type: "COVER", title: "Seguimiento estratégico", subtitle: "Periodo 2026-1", content: { institution: "Escuela TDI", completedObjectives: 4, inProgressObjectives: 2 } },
      { order: 2, type: "STRATEGIC_BET", title: "Transformación educativa", subtitle: "Apuesta institucional", content: { status: "ACTIVO", executionSummary: { completedObjectives: 2, inProgressObjectives: 1, completedKeyResults: 3, inProgressKeyResults: 2 } } },
      { order: 3, type: "CLOSING", title: "Cierre", subtitle: "Resumen", content: { summaryText: "4 objetivos completos" } },
    ],
  },
};

function renderPage() {
  return render(<MemoryRouter><PresentacionDashboard /></MemoryRouter>);
}

describe("PresentacionDashboard", () => {
  beforeEach(() => {
    mocks.loadPresentationScreen.mockReset();
  });

  it("shows a real loading state while presentation data is pending", () => {
    mocks.loadPresentationScreen.mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect(screen.getByRole("status", { name: /cargando presentaci[oó]n/i })).toBeInTheDocument();
  });

  it("renders slides and navigates with the configured keyboard controls", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    renderPage();

    expect(await screen.findByRole("heading", { name: "Seguimiento estratégico" })).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(await screen.findByRole("heading", { name: "Transformación educativa" })).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("offers a retry after the API fails", async () => {
    mocks.loadPresentationScreen
      .mockRejectedValueOnce(new Error("Servicio no disponible"))
      .mockResolvedValueOnce(response);
    renderPage();

    expect(await screen.findByText("Servicio no disponible")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));

    await waitFor(() => expect(mocks.loadPresentationScreen).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Seguimiento estratégico" })).toBeInTheDocument();
  });

  it("requests browser fullscreen when the control is available", async () => {
    mocks.loadPresentationScreen.mockResolvedValue(response);
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: requestFullscreen });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /pantalla completa/i }));

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });
});
