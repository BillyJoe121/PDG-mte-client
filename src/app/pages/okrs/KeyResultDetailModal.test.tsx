import { render, screen, waitFor, within } from "@testing-library/react";
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

import { ApiError } from "../../services/strategicApi";
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

const archivedKr: KeyResult = { ...activeKr, archived: true, archivedAt: "2026-10-30T15:00:00Z" };

function renderModal(canEdit = true) {
  const onClose = vi.fn();
  const onChanged = vi.fn().mockResolvedValue(undefined);
  render(<KeyResultDetailModal keyResultId={5} canEdit={canEdit} onClose={onClose} onChanged={onChanged} />);
  return { onClose, onChanged };
}

describe("KeyResultDetailModal edit mode", () => {
  const linkedKr: KeyResult = { ...activeKr, academicPeriodId: 4, goals: [{ id: 3, name: "Graduación oportuna" }] };

  async function openEditMode() {
    const user = userEvent.setup();
    const handlers = renderModal();
    await user.click(await screen.findByRole("button", { name: "Editar KR" }));
    await screen.findByRole("textbox", { name: "Nombre" });
    return { user, ...handlers };
  }

  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.get.mockResolvedValue(linkedKr);
    mocks.links.mockResolvedValue([]);
    mocks.units.mockResolvedValue([{ id: 1, name: "Porcentaje", type: "PORCENTAJE", active: true }]);
    mocks.records.mockResolvedValue([]);
    mocks.update.mockResolvedValue(linkedKr);
    mocks.loadAcademicPeriods.mockResolvedValue([{ id: 4, name: "2026-1", startDate: "2026-01-01", endDate: "2026-06-30", status: "ACTIVO" }]);
    mocks.loadGoals.mockResolvedValue([{ id: 3, name: "Graduación oportuna" }]);
    mocks.loadStrategicBets.mockResolvedValue([]);
  });

  it("edits inside the same modal, without a second dialog", async () => {
    await openEditMode();

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByText("Key Result #5")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Datos del KR" })).not.toBeInTheDocument();
  });

  it("saves from the top bar and returns to the detail", async () => {
    const { user } = await openEditMode();

    await user.clear(screen.getByRole("textbox", { name: "Nombre" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Nombre nuevo");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(5, expect.objectContaining({ name: "Nombre nuevo" })));
    expect(await screen.findByRole("button", { name: "Editar KR" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar detalle de KR" }));
    expect(screen.queryByRole("dialog", { name: "Descartar cambios" })).not.toBeInTheDocument();
  });

  it("leaves at once when nothing changed", async () => {
    const { user } = await openEditMode();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(await screen.findByRole("button", { name: "Editar KR" })).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("asks before losing unsaved changes, on Cancelar and on closing", async () => {
    const { user, onClose } = await openEditMode();
    await user.type(screen.getByRole("textbox", { name: "Nombre" }), " editado");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    const onCancel = await screen.findByRole("dialog", { name: "Descartar cambios" });
    await user.click(within(onCancel).getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("Elevar permanencia editado");

    await user.click(screen.getByRole("button", { name: "Cerrar detalle de KR" }));
    const onCloseDialog = await screen.findByRole("dialog", { name: "Descartar cambios" });
    expect(onClose).not.toHaveBeenCalled();
    await user.click(within(onCloseDialog).getByRole("button", { name: "Descartar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("KeyResultDetailModal archive", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.get.mockResolvedValue(activeKr);
    mocks.links.mockResolvedValue([]);
    mocks.units.mockResolvedValue([]);
    mocks.setActive.mockResolvedValue(archivedKr);
    mocks.records.mockResolvedValue([]);
  });

  it("offers Archivar instead of Eliminar and archives after confirmation", async () => {
    const user = userEvent.setup();
    const { onClose, onChanged } = renderModal();

    await screen.findByRole("button", { name: "Archivar" });
    expect(screen.queryByRole("button", { name: /Eliminar/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Archivar" }));
    const dialog = await screen.findByRole("dialog", { name: "Archivar Key Result" });
    expect(mocks.setActive).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Archivar" }));

    await waitFor(() => expect(mocks.setActive).toHaveBeenCalledWith(5, false));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Key Result archivado");
  });

  it("keeps the dialog open and shows the API message when archiving is refused", async () => {
    const user = userEvent.setup();
    mocks.setActive.mockRejectedValue(new ApiError("El Key Result tiene iniciativas vinculadas activas.", 409));
    const { onClose } = renderModal();

    await user.click(await screen.findByRole("button", { name: "Archivar" }));
    const dialog = await screen.findByRole("dialog", { name: "Archivar Key Result" });
    await user.click(within(dialog).getByRole("button", { name: "Archivar" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("El Key Result tiene iniciativas vinculadas activas.");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("warns instead of opening the dialog when the KR still has linked initiatives", async () => {
    const user = userEvent.setup();
    mocks.links.mockResolvedValue([{ id: 1, active: true, contributionWeight: 40, totalWeightForKeyResult: 40 }]);
    renderModal();

    await user.click(await screen.findByRole("button", { name: "Archivar" }));

    expect(mocks.toastWarning).toHaveBeenCalledWith(expect.stringContaining("No se puede archivar"));
    expect(screen.queryByRole("dialog", { name: "Archivar Key Result" })).not.toBeInTheDocument();
    expect(mocks.setActive).not.toHaveBeenCalled();
  });

  it("does not offer Archivar on a closed KR", async () => {
    mocks.get.mockResolvedValue({ ...activeKr, status: "CERRADO" });
    renderModal();

    await screen.findByText("Elevar permanencia");
    expect(screen.queryByRole("button", { name: "Archivar" })).not.toBeInTheDocument();
  });

  it("hides every write action from read-only users", async () => {
    mocks.get.mockResolvedValue(archivedKr);
    renderModal(false);

    await screen.findByRole("status");
    expect(screen.queryByRole("button", { name: "Restaurar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archivar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar KR" })).not.toBeInTheDocument();
  });

  it("marks an archived KR, blocks edit and progress, and restores it", async () => {
    const user = userEvent.setup();
    mocks.get.mockResolvedValueOnce(archivedKr).mockResolvedValue(activeKr);
    const { onChanged } = renderModal();

    expect(await screen.findByRole("status")).toHaveTextContent(/archivado/i);
    expect(screen.queryByRole("button", { name: "Archivar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar KR" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Valor actual \(/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Restaurar" }));

    await waitFor(() => expect(mocks.setActive).toHaveBeenCalledWith(5, true));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Restaurar" })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Archivar" })).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Key Result restaurado");
  });
});

const olderRecord = {
  id: 1,
  keyResultId: 5,
  previousValue: null,
  currentValue: 72,
  previousPercentage: null,
  progressPercentage: 10,
  authorName: "Ana Gómez",
  authorEmail: "ana@icesi.edu.co",
  recordedAt: "2026-10-01T14:00:00Z",
};
const newerRecord = {
  ...olderRecord,
  id: 2,
  previousValue: 72,
  currentValue: 75,
  previousPercentage: 10,
  progressPercentage: 25,
  authorName: null,
  authorEmail: "luis@icesi.edu.co",
  recordedAt: "2026-11-01T14:00:00Z",
};

describe("KeyResultDetailModal progress history", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.get.mockResolvedValue(activeKr);
    mocks.links.mockResolvedValue([]);
    mocks.units.mockResolvedValue([]);
    mocks.records.mockResolvedValue([newerRecord, olderRecord]);
  });

  it("lists the progress records newest first under Historial de avance", async () => {
    renderModal();

    const section = (await screen.findByRole("heading", { name: "Historial de avance" })).closest("section") as HTMLElement;
    const items = await within(section).findAllByRole("listitem");
    expect(mocks.records).toHaveBeenCalledWith(5);
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("luis@icesi.edu.co");
    expect(items[0]).toHaveTextContent("72% → 75%");
    expect(items[0]).toHaveTextContent("10% → 25%");
    expect(items[1]).toHaveTextContent("Ana Gómez");
    expect(items[1]).toHaveTextContent("— → 72%");
  });

  it("shows the empty state and keeps the history visible to read-only users", async () => {
    mocks.records.mockResolvedValue([]);
    renderModal(false);

    expect(await screen.findByText("Sin registros de avance")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Valor actual \(/)).not.toBeInTheDocument();
  });

  it("shows the history of an archived KR", async () => {
    mocks.get.mockResolvedValue(archivedKr);
    renderModal();

    expect(await screen.findAllByRole("listitem")).toHaveLength(2);
  });

  it("shows a history error without breaking the rest of the detail", async () => {
    mocks.records.mockRejectedValue(new Error("boom"));
    renderModal();

    expect(await screen.findByText("Elevar permanencia")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar el historial de avance.");
  });

  it("reloads the history after recording progress", async () => {
    const user = userEvent.setup();
    mocks.records.mockResolvedValueOnce([olderRecord]);
    mocks.updateProgress.mockResolvedValue({ ...activeKr, currentValue: 80, progressPercentage: 40 });
    renderModal();
    expect(await screen.findAllByRole("listitem")).toHaveLength(1);

    await user.type(screen.getByLabelText(/^Valor actual \(/), "80");
    await user.type(screen.getByLabelText("Avance registrado (%)"), "40");
    await user.click(screen.getByRole("button", { name: "Registrar avance" }));

    await waitFor(() => expect(mocks.updateProgress).toHaveBeenCalledWith(5, { currentValue: 80, progressPercentage: 40 }));
    await waitFor(() => expect(mocks.records).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(2));
  });
});
