import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";

const mocks = vi.hoisted(() => ({
  role: "admin",
  get: vi.fn(),
  records: vi.fn(),
  links: vi.fn(),
  createLink: vi.fn(),
  projects: vi.fn(),
  units: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError, warning: mocks.toastWarning },
}));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ usuario: { rol: mocks.role } }),
}));
vi.mock("../../services/catalogsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/catalogsApi")>();
  return { ...actual, measurementUnitsApi: { ...actual.measurementUnitsApi, list: mocks.units } };
});
vi.mock("../../services/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/projectsApi")>();
  return {
    ...actual,
    projectsApi: { ...actual.projectsApi, list: mocks.projects },
    projectKeyResultLinksApi: { ...actual.projectKeyResultLinksApi, list: mocks.links, create: mocks.createLink },
  };
});
vi.mock("../../services/strategicApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/strategicApi")>();
  return { ...actual, keyResultsApi: { ...actual.keyResultsApi, get: mocks.get, progressRecords: mocks.records } };
});

import { KeyResultDetailModal } from "./KeyResultDetailModal";

const kr: KeyResult = {
  id: 5,
  name: "Elevar permanencia",
  description: "Mide la permanencia estudiantil.",
  metric: "Tasa de permanencia",
  baseValue: 70,
  targetValue: 90,
  currentValue: 75,
  progressPercentage: 25,
  measurementUnitId: 1,
  measurementUnitName: "Porcentaje",
  academicPeriodName: "2026-1",
  goals: [],
  strategicBets: [],
  status: "ACTIVO",
  createdAt: "2026-01-10",
  archived: false,
  archivedAt: null,
};

const project = (id: number, name: string, status = "ACTIVO") => ({ id, name, status, departmentName: "Ingeniería", startPeriod: "2026-1", linkedKeyResults: [] });

describe("KeyResultDetailModal initiatives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = "admin";
    mocks.get.mockResolvedValue(kr);
    mocks.records.mockResolvedValue([]);
    mocks.units.mockResolvedValue([]);
    mocks.links.mockResolvedValue([{ id: 1, projectId: 7, projectName: "Laboratorio abierto", active: true, contributionWeight: 40, totalWeightForKeyResult: 40 }]);
    mocks.projects.mockResolvedValue([
      project(7, "Laboratorio abierto"),
      project(8, "Semillero de datos"),
      project(9, "Mentorías de primer año"),
      project(10, "Programa archivado", "ARCHIVADO"),
    ]);
    mocks.createLink.mockImplementation(async (body) => ({ id: 100 + body.projectId, ...body, overweightWarning: false, totalWeightForKeyResult: 70 }));
  });

  it("links several initiatives at once, offering only the ones not linked or archived", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    render(<KeyResultDetailModal keyResultId={5} canEdit onClose={vi.fn()} onChanged={onChanged} />);

    await user.click(await screen.findByRole("button", { name: "Vincular iniciativas" }));
    const list = await screen.findByRole("group", { name: "Iniciativas" });
    await within(list).findByText("Semillero de datos");
    expect(within(list).queryByText("Laboratorio abierto")).not.toBeInTheDocument();
    expect(within(list).queryByText("Programa archivado")).not.toBeInTheDocument();

    await user.click(within(list).getByRole("checkbox", { name: /Semillero de datos/ }));
    await user.click(within(list).getByRole("checkbox", { name: /Mentorías de primer año/ }));
    await user.click(screen.getByRole("button", { name: "Vincular 2 iniciativas" }));

    await waitFor(() => expect(mocks.createLink).toHaveBeenCalledTimes(2));
    expect(mocks.createLink).toHaveBeenCalledWith({ projectId: 8, keyResultId: 5, contributionWeight: 30, contributionType: "DIRECTA" });
    expect(mocks.createLink).toHaveBeenCalledWith({ projectId: 9, keyResultId: 5, contributionWeight: 30, contributionType: "DIRECTA" });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("2 iniciativas vinculadas.");
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(await screen.findByRole("button", { name: "Vincular iniciativas" })).toBeInTheDocument();
  });

  it("filters the initiatives with the search box", async () => {
    const user = userEvent.setup();
    render(<KeyResultDetailModal keyResultId={5} canEdit onClose={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: "Vincular iniciativas" }));
    const list = await screen.findByRole("group", { name: "Iniciativas" });
    await within(list).findByText("Semillero de datos");
    await user.type(screen.getByRole("textbox", { name: "Buscar iniciativa" }), "mentor");
    expect(within(list).queryByText("Semillero de datos")).not.toBeInTheDocument();
    expect(within(list).getByText("Mentorías de primer año")).toBeInTheDocument();
  });

  it("hides the action from roles that cannot link initiatives", async () => {
    mocks.role = "visitor";
    render(<KeyResultDetailModal keyResultId={5} canEdit={false} onClose={vi.fn()} />);

    await screen.findByText("Elevar permanencia");
    expect(screen.queryByRole("button", { name: "Vincular iniciativas" })).not.toBeInTheDocument();
  });
});
