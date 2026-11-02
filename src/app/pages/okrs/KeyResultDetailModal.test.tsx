import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  setActive: vi.fn(),
  links: vi.fn(),
  units: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError, warning: mocks.toastWarning },
}));
vi.mock("../../services/catalogsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/catalogsApi")>();
  return { ...actual, measurementUnitsApi: { ...actual.measurementUnitsApi, list: mocks.units } };
});
vi.mock("../../services/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/projectsApi")>();
  return { ...actual, projectKeyResultLinksApi: { ...actual.projectKeyResultLinksApi, list: mocks.links } };
});
vi.mock("../../services/strategicApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/strategicApi")>();
  return { ...actual, keyResultsApi: { ...actual.keyResultsApi, get: mocks.get, setActive: mocks.setActive } };
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

describe("KeyResultDetailModal archive", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.get.mockResolvedValue(activeKr);
    mocks.links.mockResolvedValue([]);
    mocks.units.mockResolvedValue([]);
    mocks.setActive.mockResolvedValue(archivedKr);
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
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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
