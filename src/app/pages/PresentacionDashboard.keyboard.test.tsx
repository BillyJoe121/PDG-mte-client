import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
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

async function renderSlides() {
  render(
    <MemoryRouter initialEntries={["/presentacion?modo=slides"]}>
      <PresentacionDashboard />
    </MemoryRouter>
  );
  expect(await screen.findByRole("heading", { name: "Seguimiento estratégico" })).toBeInTheDocument();
  expect(screen.getByText("1 / 3")).toBeInTheDocument();
}

async function press(target: Element, key: string) {
  await act(async () => {
    fireEvent.keyDown(target, { key });
  });
}

describe("PresentacionDashboard keyboard navigation", () => {
  beforeEach(() => {
    mocks.loadPresentationScreen.mockReset();
    mocks.loadPresentationScreen.mockResolvedValue(response);
  });

  afterEach(() => {
    document.querySelectorAll("[data-test-field]").forEach((field) => field.remove());
  });

  it("changes slides with the arrow keys while a button has focus", async () => {
    await renderSlides();
    const modeButton = within(screen.getByRole("navigation", { name: "Modos de presentación" })).getByRole("button", { name: "Presentar" });
    modeButton.focus();
    expect(modeButton).toHaveFocus();

    await press(modeButton, "ArrowRight");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    await press(modeButton, "ArrowRight");
    expect(await screen.findByRole("heading", { name: "Cierre" })).toBeInTheDocument();
    expect(screen.getByText("3 / 3")).toBeInTheDocument();

    await press(modeButton, "ArrowLeft");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(modeButton).toHaveFocus();
  });

  it("leaves Space to the focused button instead of changing slides", async () => {
    await renderSlides();
    const modeButton = within(screen.getByRole("navigation", { name: "Modos de presentación" })).getByRole("button", { name: "Presentar" });
    modeButton.focus();

    await press(modeButton, " ");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it.each(["input", "textarea", "select"])("ignores the arrow keys while typing in a %s", async (tag) => {
    await renderSlides();
    const field = document.createElement(tag);
    field.setAttribute("data-test-field", "");
    if (field instanceof HTMLSelectElement) field.append(new Option("2026-1"), new Option("2025-2"));
    document.body.append(field);
    field.focus();
    expect(field).toHaveFocus();

    await press(field, "ArrowRight");
    await press(field, "ArrowRight");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    await press(field, "ArrowLeft");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("ignores the arrow keys inside an editable region", async () => {
    await renderSlides();
    const editable = document.createElement("div");
    editable.setAttribute("data-test-field", "");
    editable.setAttribute("contenteditable", "true");
    editable.tabIndex = 0;
    document.body.append(editable);
    editable.focus();

    await press(editable, "ArrowRight");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("also ignores the arrow keys in the period selector of the page", async () => {
    await renderSlides();
    const periodSelect = screen.getByLabelText("Periodo académico");
    periodSelect.focus();

    await press(periodSelect, "ArrowRight");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("closes the detail modal with Escape without leaving the report", async () => {
    const bet = {
      id: 1,
      name: "Transformación Digital",
      description: "Modernización curricular.",
      status: "ACTIVA",
      createdAt: "2026-01-01",
      executionSummary: { summaryText: "", completedKeyResults: 1, inProgressKeyResults: 1, completedProjects: 1, inProgressProjects: 1, periods: [] },
    };
    mocks.loadPresentationScreen.mockResolvedValue({ ...response, bets: [bet] });
    render(
      <MemoryRouter initialEntries={["/presentacion"]}>
        <PresentacionDashboard />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole("button", { name: /abrir informe/i }));
    await screen.findByRole("heading", { name: /todas las metas y apuestas en conjunto/i });
    fireEvent.click(screen.getAllByRole("button", { name: /detalle de/i })[0]);

    fireEvent.keyDown(await screen.findByRole("dialog"), { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /todas las metas y apuestas en conjunto/i })).toBeInTheDocument();
  });
});
