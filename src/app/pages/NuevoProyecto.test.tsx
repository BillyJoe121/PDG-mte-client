import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NuevoProyecto } from "./NuevoProyecto";

const api = vi.hoisted(() => ({
  departments: vi.fn(),
  keyResults: vi.fn(),
  periods: vi.fn(),
  create: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { id: "U1", rol: "manager" } }) }));

vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return {
    ...original,
    departmentsApi: { ...original.departmentsApi, list: api.departments },
    keyResultsApi: { ...original.keyResultsApi, list: api.keyResults },
  };
});

vi.mock("../services/catalogsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/catalogsApi")>();
  return { ...original, academicPeriodsApi: { ...original.academicPeriodsApi, list: api.periods } };
});

vi.mock("../services/projectsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/projectsApi")>();
  return { ...original, projectsApi: { ...original.projectsApi, create: api.create } };
});

async function fillRequiredFields() {
  const user = userEvent.setup();
  await screen.findByText("KR de cobertura");
  await user.type(screen.getByPlaceholderText("Iniciativa de analitica curricular"), "Iniciativa de prueba");
  await user.type(screen.getByPlaceholderText(/Describe alcance/), "Alcance de prueba");
  await user.type(screen.getByPlaceholderText("Tutora A, Tutor B"), "Tutora A");
  return user;
}

describe("NuevoProyecto", () => {
  afterEach(cleanup);
  beforeEach(() => {
    api.departments.mockReset().mockResolvedValue([{ id: 1, name: "Sistemas" }]);
    api.periods.mockReset().mockResolvedValue([{ id: 1, name: "2026-1" }]);
    api.keyResults.mockReset().mockResolvedValue([
      { id: 11, name: "KR de cobertura", metric: "Cobertura", goals: [], strategicBets: [] },
    ]);
    api.create.mockReset().mockResolvedValue({ id: 99 });
  });

  it("does not create an initiative without a Key Result", async () => {
    render(<MemoryRouter><NuevoProyecto /></MemoryRouter>);
    const user = await fillRequiredFields();

    await user.click(screen.getByRole("button", { name: /Crear iniciativa/ }));

    expect(await screen.findByText("Selecciona al menos un Key Result.")).toBeTruthy();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("sends the selected Key Result as the first link", async () => {
    render(<MemoryRouter><NuevoProyecto /></MemoryRouter>);
    const user = await fillRequiredFields();

    await user.click(screen.getByRole("button", { name: "Seleccionar KR 11" }));
    await user.click(screen.getByRole("button", { name: /Crear iniciativa/ }));

    await waitFor(() => expect(api.create).toHaveBeenCalledTimes(1));
    expect(api.create.mock.calls[0][0].keyResultLinks[0].keyResultId).toBe(11);
  });
});
