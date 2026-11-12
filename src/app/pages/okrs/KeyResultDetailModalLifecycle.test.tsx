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

describe("KeyResultDetailModal loading and saving failures", () => {
  it("closes and reports why the KR could not be loaded", async () => {
    mocks.get.mockRejectedValueOnce(new Error("Servidor caído"));
    const first = renderModal();
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Servidor caído"));
    expect(first.onClose).toHaveBeenCalled();
  });

  it("uses a default message when the load failure has no text", async () => {
    mocks.get.mockRejectedValueOnce("falla");
    const { onClose } = renderModal();
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("No se pudo cargar el Key Result"));
    expect(onClose).toHaveBeenCalled();
  });

  it("reports a failed update with the message or a default and stays in edit mode", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(await screen.findByRole("button", { name: "Editar KR" }));
    await screen.findByRole("textbox", { name: "Nombre" });

    mocks.update.mockRejectedValueOnce(new Error("Nombre repetido"));
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Nombre repetido"));

    mocks.update.mockRejectedValueOnce("falla");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("No se pudo actualizar el Key Result"));
    expect(screen.getByRole("textbox", { name: "Nombre" })).toBeInTheDocument();
  });
});

describe("KeyResultDetailModal data summary", () => {
  it("sums the declared weights when the API gives no total and warns above 100", async () => {
    mocks.links.mockResolvedValue([
      { id: 1, projectId: 7, projectName: "Laboratorio abierto", active: true, contributionWeight: 70 },
      { id: 2, projectId: null, active: true, contributionWeight: 60 },
      { id: 3, projectId: 9, projectName: "Retirado", active: false, contributionWeight: 90 },
    ]);
    renderModal();

    expect(await screen.findByText(/suman más de 100 %/)).toBeInTheDocument();
    expect(screen.getByText(/Laboratorio abierto/)).toBeInTheDocument();
    expect(screen.queryByText(/Retirado/)).not.toBeInTheDocument();
  });

  it("omits the archive date when it is missing or invalid", async () => {
    mocks.get.mockResolvedValueOnce({ ...activeKr, archived: true, archivedAt: null });
    const { onClose } = renderModal();
    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Este KR está archivado. No admite cambios");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("omits an unreadable archive date", async () => {
    mocks.get.mockResolvedValueOnce({ ...activeKr, archived: true, archivedAt: "no-es-fecha" });
    renderModal();
    expect(await screen.findByRole("status")).toHaveTextContent("Este KR está archivado. No admite cambios");
  });

  it("shows a closed KR as read only", async () => {
    mocks.get.mockResolvedValue({ ...activeKr, status: "CERRADO" });
    renderModal();
    expect(await screen.findByText(/está cerrado: su avance ya no se puede modificar/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar KR" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Vincular iniciativas" })).not.toBeInTheDocument();
  });
});

describe("KeyResultDetailModal lifecycle and archive", () => {
  it("activates a draft KR", async () => {
    const user = userEvent.setup();
    mocks.get.mockResolvedValue({ ...activeKr, status: "BORRADOR" });
    const { onChanged } = renderModal();

    await user.click(await screen.findByRole("button", { name: "Activar KR" }));
    await waitFor(() => expect(mocks.setStatus).toHaveBeenCalledWith(5, "ACTIVO"));
    expect(mocks.success).toHaveBeenCalledWith("Key Result activado");
    expect(onChanged).toHaveBeenCalled();
  });

  it("closes an active KR only after confirming", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByRole("button", { name: "Cerrar KR" }));
    const dialog = await screen.findByRole("dialog", { name: "Cerrar Key Result" });
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(mocks.setStatus).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cerrar KR" }));
    await user.click(within(await screen.findByRole("dialog", { name: "Cerrar Key Result" })).getByRole("button", { name: "Cerrar KR" }));
    await waitFor(() => expect(mocks.setStatus).toHaveBeenCalledWith(5, "CERRADO"));
    expect(mocks.success).toHaveBeenCalledWith("Key Result cerrado");
  });

  it("reports a status change failure with the message or a default", async () => {
    const user = userEvent.setup();
    mocks.get.mockResolvedValue({ ...activeKr, status: "BORRADOR" });
    renderModal();
    const button = await screen.findByRole("button", { name: "Activar KR" });

    mocks.setStatus.mockRejectedValueOnce(new Error("Faltan datos"));
    await user.click(button);
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Faltan datos"));

    mocks.setStatus.mockRejectedValueOnce("falla");
    await user.click(screen.getByRole("button", { name: "Activar KR" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("No se pudo cambiar el estado del Key Result"));
  });

  it("closes the archive confirmation with Cancelar and falls back to a default archive error", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(await screen.findByRole("button", { name: "Archivar" }));
    await user.click(within(await screen.findByRole("dialog", { name: "Archivar Key Result" })).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Archivar Key Result" })).not.toBeInTheDocument());

    mocks.setActive.mockRejectedValueOnce("falla");
    await user.click(screen.getByRole("button", { name: "Archivar" }));
    const dialog = await screen.findByRole("dialog", { name: "Archivar Key Result" });
    await user.click(within(dialog).getByRole("button", { name: "Archivar" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("No se pudo archivar el Key Result");
  });

  it("reports restore failures with the message or a default", async () => {
    const user = userEvent.setup();
    mocks.get.mockResolvedValue({ ...activeKr, archived: true, archivedAt: "2026-10-30T15:00:00Z" });
    renderModal();
    const restore = await screen.findByRole("button", { name: "Restaurar" });

    mocks.setActive.mockRejectedValueOnce(new Error("Sin permiso"));
    await user.click(restore);
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Sin permiso"));

    mocks.setActive.mockRejectedValueOnce("falla");
    await user.click(screen.getByRole("button", { name: "Restaurar" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("No se pudo restaurar el Key Result"));
  });

  it("leaves the initiative picker with Cancelar", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(await screen.findByRole("button", { name: "Vincular iniciativas" }));
    expect(await screen.findByRole("textbox", { name: "Buscar iniciativa" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByRole("button", { name: "Editar KR" })).toBeInTheDocument();
  });
});
