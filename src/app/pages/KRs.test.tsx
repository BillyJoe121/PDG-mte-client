import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../services/strategicApi";
import { KRs } from "./KRs";

const mocks = vi.hoisted(() => ({ loadKeyResults: vi.fn() }));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { rol: "visitor" } }) }));
vi.mock("../hooks/useStrategicDataRefresh", () => ({ useStrategicDataRefresh: () => undefined }));
vi.mock("../services/screenDataCache", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/screenDataCache")>();
  return { ...original, loadKeyResults: mocks.loadKeyResults };
});

function kr(id: number, name: string, status: KeyResult["status"], extra: Partial<KeyResult> = {}): KeyResult {
  return { id, name, description: "", status, progressPercentage: 0, goals: [], strategicBets: [], ...extra } as KeyResult;
}

const items = [
  kr(1, "Retención", "ACTIVO", { academicPeriodName: "2026-1", goals: [{ id: 1, name: "Meta 1" }] }),
  kr(2, "Graduación", "CERRADO", { academicPeriodName: "2026-1", goals: [{ id: 2, name: "Meta 10" }] }),
  kr(3, "Movilidad", "BORRADOR", { academicPeriodName: "2026-2" }),
  kr(4, "Investigación", "CERRADO", { academicPeriodName: "2026-2" }),
];

function renderAt(url: string) {
  return render(<MemoryRouter initialEntries={[url]}><KRs /></MemoryRouter>);
}

function summaryCard(label: string) {
  return screen.getByText(label, { selector: "p" }).previousElementSibling?.textContent;
}

describe("KRs", () => {
  beforeEach(() => {
    mocks.loadKeyResults.mockReset().mockResolvedValue(items);
  });

  it("counts every loaded KR in the summary cards while the list is filtered by status", async () => {
    renderAt("/krs?status=CERRADO");

    expect(await screen.findByText("Graduación")).toBeInTheDocument();
    expect(screen.queryByText("Retención")).not.toBeInTheDocument();
    expect(summaryCard("Total")).toBe("4");
    expect(summaryCard("Borrador")).toBe("1");
    expect(summaryCard("Activos")).toBe("1");
    expect(summaryCard("Cerrados")).toBe("2");
  });

  it("shows an explicit error state with a retry instead of the empty message", async () => {
    const user = userEvent.setup();
    mocks.loadKeyResults.mockRejectedValueOnce(new Error("Sin conexión con el servidor"));
    renderAt("/krs");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Sin conexión con el servidor");
    expect(screen.queryByText("No se encontraron Key Results.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Reintentar/ }));
    expect(await screen.findByText("Retención")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("honors dashboard drill-down filters, shows them and lets the user clear them", async () => {
    const user = userEvent.setup();
    renderAt("/krs?status=CERRADO&period=2026-2&goal=Meta%201");

    expect(await screen.findByText("No se encontraron Key Results.")).toBeInTheDocument();
    expect(screen.getByText(/Periodo: 2026-2/)).toBeInTheDocument();
    expect(screen.getByText(/Meta: Meta 1/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quitar filtros" }));
    expect(await screen.findByText("Investigación")).toBeInTheDocument();
    expect(screen.getByText("Graduación")).toBeInTheDocument();
    expect(screen.queryByText(/Periodo: 2026-2/)).not.toBeInTheDocument();
  });

  it("reads the department from the dashboard link and explains that it does not filter the list", async () => {
    renderAt("/krs?period=2026-2&department=Ingenier%C3%ADa");

    expect(await screen.findByText("Movilidad")).toBeInTheDocument();
    expect(screen.queryByText("Retención")).not.toBeInTheDocument();
    expect(screen.getByText(/Departamento: Ingeniería/)).toBeInTheDocument();
    expect(screen.getByText(/no tienen departamento propio/)).toBeInTheDocument();
  });

  it("finds a KR by its code and does not treat the code as a substring of other ids", async () => {
    const user = userEvent.setup();
    renderAt("/krs");
    await screen.findByText("Retención");

    await user.type(screen.getByRole("textbox", { name: "Buscar Key Results" }), "kr-3");
    expect(screen.getByText("Movilidad")).toBeInTheDocument();
    expect(screen.queryByText("Retención")).not.toBeInTheDocument();
  });
});
