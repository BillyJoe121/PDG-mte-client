import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), departments: vi.fn(), keyResults: vi.fn(), periods: vi.fn(), create: vi.fn(),
}));

vi.mock("react-router", async (importOriginal) => ({ ...(await importOriginal<typeof import("react-router")>()), useNavigate: () => mocks.navigate }));
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { id: "U1", rol: "manager" } }) }));
vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return { ...original, departmentsApi: { ...original.departmentsApi, list: mocks.departments }, keyResultsApi: { ...original.keyResultsApi, list: mocks.keyResults } };
});
vi.mock("../services/catalogsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/catalogsApi")>();
  return { ...original, academicPeriodsApi: { ...original.academicPeriodsApi, list: mocks.periods } };
});
vi.mock("../services/projectsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/projectsApi")>();
  return { ...original, projectsApi: { ...original.projectsApi, create: mocks.create } };
});

import { NuevoProyecto } from "./NuevoProyecto";

describe("NuevoProyecto key result links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.departments.mockResolvedValue([{ id: 1, name: "Sistemas" }]);
    mocks.periods.mockResolvedValue([{ id: 1, name: "2026-1" }]);
    mocks.keyResults.mockResolvedValue([
      { id: 11, name: "KR uno", description: "", metric: "M1", goals: [], strategicBets: [] },
      { id: 12, name: "KR dos", description: "", metric: "M2", goals: [], strategicBets: [] },
    ]);
    mocks.create.mockResolvedValue({ id: 99 });
  });

  it("sends only the key result of each selected link", async () => {
    render(<MemoryRouter><NuevoProyecto /></MemoryRouter>);
    const user = userEvent.setup();
    await screen.findByText("KR uno");

    await user.type(screen.getByPlaceholderText("Iniciativa de analitica curricular"), "Iniciativa");
    await user.type(screen.getByPlaceholderText(/Describe alcance/), "Alcance");
    await user.type(screen.getByPlaceholderText("Tutora A, Tutor B"), "Ana");
    await user.click(screen.getByRole("button", { name: "Seleccionar KR 11" }));
    await user.click(screen.getByRole("button", { name: "Seleccionar KR 12" }));

    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Crear iniciativa/ }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(mocks.create.mock.calls[0][0].keyResultLinks).toEqual([{ keyResultId: 11 }, { keyResultId: 12 }]);
  });
});
