import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";

const mocks = vi.hoisted(() => ({
  role: "admin",
  get: vi.fn(),
  setActive: vi.fn(),
  setStatus: vi.fn(),
  update: vi.fn(),
  records: vi.fn(),
  links: vi.fn(),
  units: vi.fn(),
  projects: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  loadAcademicPeriods: vi.fn(),
  loadGoals: vi.fn(),
  loadStrategicBets: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error, warning: mocks.warning } }));
vi.mock("../../context/AuthContext", () => ({ useAuth: () => ({ usuario: { rol: mocks.role } }) }));
vi.mock("../../services/catalogsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/catalogsApi")>();
  return { ...actual, measurementUnitsApi: { ...actual.measurementUnitsApi, list: mocks.units } };
});
vi.mock("../../services/screenDataCache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/screenDataCache")>();
  return { ...actual, loadAcademicPeriods: mocks.loadAcademicPeriods, loadGoals: mocks.loadGoals, loadStrategicBets: mocks.loadStrategicBets };
});
vi.mock("../../services/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/projectsApi")>();
  return {
    ...actual,
    projectsApi: { ...actual.projectsApi, list: mocks.projects },
    projectKeyResultLinksApi: { ...actual.projectKeyResultLinksApi, list: mocks.links },
  };
});
vi.mock("../../services/strategicApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/strategicApi")>();
  return {
    ...actual,
    keyResultsApi: {
      ...actual.keyResultsApi,
      get: mocks.get,
      setActive: mocks.setActive,
      setStatus: mocks.setStatus,
      update: mocks.update,
      progressRecords: mocks.records,
    },
  };
});

import { KeyResultDetailModal } from "./KeyResultDetailModal";

const activeKr: KeyResult = {
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
  academicPeriodId: 4,
  academicPeriodName: "2026-1",
  goals: [{ id: 3, name: "Graduación oportuna" }],
  strategicBets: [],
  status: "ACTIVO",
  createdAt: "2026-01-10",
  archived: false,
  archivedAt: null,
};

function renderModal(props: Partial<Parameters<typeof KeyResultDetailModal>[0]> = {}) {
  const onClose = vi.fn();
  const onChanged = vi.fn().mockResolvedValue(undefined);
  render(<KeyResultDetailModal keyResultId={5} canEdit onClose={onClose} onChanged={onChanged} {...props} />);
  return { onClose, onChanged };
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => typeof mock === "function" && mock.mockReset());
  mocks.role = "admin";
  mocks.get.mockResolvedValue(activeKr);
  mocks.links.mockResolvedValue([]);
  mocks.units.mockResolvedValue([{ id: 1, name: "Porcentaje", type: "PORCENTAJE", active: true }]);
  mocks.records.mockResolvedValue([]);
  mocks.projects.mockResolvedValue([]);
  mocks.setActive.mockResolvedValue(activeKr);
  mocks.setStatus.mockResolvedValue(activeKr);
  mocks.update.mockResolvedValue(activeKr);
  mocks.loadAcademicPeriods.mockResolvedValue([{ id: 4, name: "2026-1", startDate: "2026-01-01", endDate: "2026-06-30", status: "ACTIVO" }]);
  mocks.loadGoals.mockResolvedValue([{ id: 3, name: "Graduación oportuna" }]);
  mocks.loadStrategicBets.mockResolvedValue([]);
});

describe("KeyResultDetailModal missing data and archive edge cases", () => {
  it("treats a KR without status or period as active and unscheduled", async () => {
    mocks.get.mockResolvedValue({ ...activeKr, status: undefined, academicPeriodName: undefined });
    renderModal();
    expect(await screen.findByText("Sin periodo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar KR" })).toBeInTheDocument();
  });

  it("shows the server message when archiving fails", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(await screen.findByRole("button", { name: "Archivar" }));
    mocks.setActive.mockRejectedValueOnce(new Error("Tiene iniciativas vinculadas"));
    const dialog = await screen.findByRole("dialog", { name: "Archivar Key Result" });
    await user.click(within(dialog).getByRole("button", { name: "Archivar" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Tiene iniciativas vinculadas");
  });

  it("keeps the archive confirmation open while the request is running", async () => {
    const user = userEvent.setup();
    let finish!: (value: KeyResult) => void;
    mocks.setActive.mockReturnValueOnce(new Promise<KeyResult>((resolve) => { finish = resolve; }));
    const { onClose } = renderModal();
    await user.click(await screen.findByRole("button", { name: "Archivar" }));
    const dialog = await screen.findByRole("dialog", { name: "Archivar Key Result" });
    await user.click(within(dialog).getByRole("button", { name: "Archivar" }));

    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Archivar Key Result" })).toBeInTheDocument();

    finish(activeKr);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("restores an archived KR and reloads it", async () => {
    const user = userEvent.setup();
    mocks.get.mockResolvedValueOnce({ ...activeKr, archived: true, archivedAt: "2026-10-30T15:00:00Z" });
    const { onChanged } = renderModal();
    await user.click(await screen.findByRole("button", { name: "Restaurar" }));
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Key Result restaurado"));
    expect(onChanged).toHaveBeenCalled();
  });

  it("ignores links without an initiative when offering initiatives to link", async () => {
    const user = userEvent.setup();
    mocks.links.mockResolvedValue([{ id: 2, projectId: null, active: true, contributionWeight: 10 }]);
    mocks.projects.mockResolvedValue([{ id: 8, name: "Semillero", status: "ACTIVO", departmentName: "Ing", startPeriod: "2026-1", linkedKeyResults: [] }]);
    renderModal();
    await user.click(await screen.findByRole("button", { name: "Vincular iniciativas" }));
    expect(await screen.findByText("Semillero")).toBeInTheDocument();
  });
});
