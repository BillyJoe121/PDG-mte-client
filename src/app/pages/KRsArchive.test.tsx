import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyResult, KeyResultListParams } from "../services/strategicApi";

const mocks = vi.hoisted(() => ({
  loadKeyResults: vi.fn(),
  setActive: vi.fn(),
  role: "manager",
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { rol: mocks.role } }) }));
vi.mock("../hooks/useStrategicDataRefresh", () => ({ useStrategicDataRefresh: () => undefined }));
vi.mock("../services/screenDataCache", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/screenDataCache")>();
  return { ...original, loadKeyResults: mocks.loadKeyResults };
});
vi.mock("../services/strategicApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/strategicApi")>();
  return { ...actual, keyResultsApi: { ...actual.keyResultsApi, setActive: mocks.setActive } };
});

import { KRs } from "./KRs";

function kr(id: number, name: string, extra: Partial<KeyResult> = {}): KeyResult {
  return { id, name, description: "", status: "ACTIVO", progressPercentage: 0, goals: [], strategicBets: [], archived: false, ...extra } as KeyResult;
}

const current = [kr(1, "Retención"), kr(2, "Graduación")];
const archived = kr(3, "Movilidad antigua", { archived: true, archivedAt: "2026-10-30T15:00:00Z" });

function renderKrs() {
  return render(<MemoryRouter initialEntries={["/krs"]}><KRs /></MemoryRouter>);
}

describe("KRs archive", () => {
  beforeEach(() => {
    mocks.role = "manager";
    mocks.setActive.mockReset().mockResolvedValue({ ...archived, archived: false, archivedAt: null });
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    mocks.loadKeyResults.mockReset().mockImplementation(async (params?: KeyResultListParams) =>
      params?.includeArchived ? [...current, archived] : current);
  });

  it("lists without archived KRs until the toggle is switched on", async () => {
    const user = userEvent.setup();
    renderKrs();

    expect(await screen.findByText("Retención")).toBeInTheDocument();
    expect(screen.queryByText("Movilidad antigua")).not.toBeInTheDocument();
    expect(mocks.loadKeyResults).toHaveBeenLastCalledWith(undefined, expect.anything());

    const toggle = screen.getByRole("button", { name: /Archivados/ });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);

    expect(await screen.findByText("Movilidad antigua")).toBeInTheDocument();
    expect(mocks.loadKeyResults).toHaveBeenLastCalledWith({ includeArchived: true }, expect.anything());
    expect(screen.getByRole("button", { name: /Archivados/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Archivado")).toBeInTheDocument();
  });

  it("restores an archived KR and reloads the list", async () => {
    const user = userEvent.setup();
    renderKrs();
    await screen.findByText("Retención");
    await user.click(screen.getByRole("button", { name: /Archivados/ }));
    await screen.findByText("Movilidad antigua");

    mocks.loadKeyResults.mockImplementation(async () => [...current, { ...archived, archived: false, archivedAt: null }]);
    await user.click(screen.getByRole("button", { name: "Restaurar Movilidad antigua" }));

    await waitFor(() => expect(mocks.setActive).toHaveBeenCalledWith(3, true));
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("Key Result restaurado"));
    await waitFor(() => expect(screen.queryByText("Archivado")).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /^Restaurar/ })).not.toBeInTheDocument();
  });

  it("does not offer Restaurar to read-only users", async () => {
    mocks.role = "visitor";
    const user = userEvent.setup();
    renderKrs();
    await screen.findByText("Retención");

    await user.click(screen.getByRole("button", { name: /Archivados/ }));

    expect(await screen.findByText("Movilidad antigua")).toBeInTheDocument();
    expect(screen.getByText("Archivado")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Restaurar/ })).not.toBeInTheDocument();
  });
});
