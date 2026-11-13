import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  setActive: vi.fn(),
  update: vi.fn(),
  records: vi.fn(),
  updateProgress: vi.fn(),
  links: vi.fn(),
  units: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
  loadAcademicPeriods: vi.fn(),
  loadGoals: vi.fn(),
  loadStrategicBets: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError, warning: mocks.toastWarning },
}));
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
  return { ...actual, projectKeyResultLinksApi: { ...actual.projectKeyResultLinksApi, list: mocks.links } };
});
vi.mock("../../services/strategicApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/strategicApi")>();
  return {
    ...actual,
    keyResultsApi: { ...actual.keyResultsApi, get: mocks.get, setActive: mocks.setActive, update: mocks.update, progressRecords: mocks.records },
    updateKeyResultProgress: mocks.updateProgress,
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
  academicPeriodName: "2026-1",
  goals: [],
  strategicBets: [],
  status: "ACTIVO",
  createdAt: "2026-01-10",
  archived: false,
  archivedAt: null,
};

function renderWithJump(onOpenInHierarchy = vi.fn()) {
  render(<KeyResultDetailModal keyResultId={5} canEdit onClose={vi.fn()} onChanged={vi.fn()} onOpenInHierarchy={onOpenInHierarchy} />);
  return onOpenInHierarchy;
}

describe("KeyResultDetailModal links", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.get.mockResolvedValue({ ...activeKr, goals: [{ id: 3, name: "Graduación oportuna" }] });
    mocks.links.mockResolvedValue([
      { id: 1, projectId: 7, projectName: "Laboratorio abierto", active: true },
    ]);
    mocks.units.mockResolvedValue([]);
    mocks.records.mockResolvedValue([]);
  });

  it("opens the goal in the hierarchy table searching this KR and grays out the missing bet", async () => {
    const user = userEvent.setup();
    const onOpenInHierarchy = renderWithJump();

    const goal = await screen.findByRole("button", { name: "Ver en Meta" });
    expect(goal).toHaveClass("bg-[#4CB979]");
    await user.click(goal);
    expect(onOpenInHierarchy).toHaveBeenCalledWith({ rootType: "GOAL", rootId: 3, field: "indicator", text: "Elevar permanencia" });
    expect(screen.getByRole("button", { name: /Ver en Apuesta/ })).toBeDisabled();
  });

  it("lists the names of the linked initiatives next to their count", async () => {
    renderWithJump();

    expect(await screen.findByText("Laboratorio abierto")).toBeInTheDocument();
  });

  it("hides the jump buttons when no handler is given", async () => {
    render(<KeyResultDetailModal keyResultId={5} canEdit onClose={vi.fn()} onChanged={vi.fn()} />);

    await screen.findByText("Elevar permanencia");
    expect(screen.queryByRole("button", { name: /Ver en Meta/ })).not.toBeInTheDocument();
  });
});
