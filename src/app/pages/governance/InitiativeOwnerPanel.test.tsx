import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InitiativeOwnerPanel } from "./InitiativeOwnerPanel";
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../../services/governanceApi", async importOriginal => ({ ...await importOriginal<typeof import("../../services/governanceApi")>(), v2Request: request }));
beforeEach(() => {
  request.mockReset();
  request.mockImplementation(async (url: string, options?: RequestInit) => {
    if (options) throw new Error("VERSION_CONFLICT");
    return { items: [{ id: 1, professorId: 1, name: url.includes("page=1") ? "Responsable anterior" : "Responsable vigente", actorName: "Gestor", startedAt: "2026-01-01T12:00:00Z", endedAt: url.includes("page=1") ? "2026-01-02T12:00:00Z" : null }], totalElements: 21, totalPages: 2, currentPage: url.includes("page=1") ? 1 : 0, pageSize: 20 };
  });
});
it("keeps the reassignment draft while paging and excludes the current owner on old pages", async () => {
  const changed = vi.fn(); const user = userEvent.setup();
  render(<InitiativeOwnerPanel id={7} version={4} departmentId={10} currentResponsibleId={1} canWrite responsibles={[{ id: 1, name: "Actual", departmentId: 10 }, { id: 2, name: "Nueva", departmentId: 10 }, { id: 3, name: "Ajena", departmentId: 20 }]} onChanged={changed} />);
  await screen.findByText("Responsable vigente · Vigente");
  await user.selectOptions(screen.getByLabelText("Nuevo responsable de iniciativa"), "2");
  await user.type(screen.getByLabelText("Motivo de reasignación"), "Cambio de equipo");
  await user.click(screen.getByRole("button", { name: "Asignaciones siguientes" }));
  await screen.findByText("Responsable anterior · Anterior");
  expect(screen.queryByRole("option", { name: "Actual" })).not.toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "Ajena" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Motivo de reasignación")).toHaveValue("Cambio de equipo");
  await user.click(screen.getByRole("button", { name: "Reasignar iniciativa" }));
  await screen.findByRole("alert");
  await waitFor(() => expect(request).toHaveBeenLastCalledWith("/initiatives/7/assignee", expect.objectContaining({ method: "PUT", headers: { "If-Match": "4" }, body: JSON.stringify({ newProfessorId: 2, reason: "Cambio de equipo" }) })));
  expect(screen.getByLabelText("Motivo de reasignación")).toHaveValue("Cambio de equipo");
  expect(changed).not.toHaveBeenCalled();
});
it("returns to the first history page after a successful reassignment", async () => {
  const page = { items: [], totalElements: 21, totalPages: 2, currentPage: 0, pageSize: 20 };
  request.mockImplementation(async (_url: string, options?: RequestInit) => options ? {} : page);
  const changed = vi.fn().mockResolvedValue(undefined); const user = userEvent.setup();
  render(<InitiativeOwnerPanel id={7} version={4} departmentId={10} currentResponsibleId={1} canWrite responsibles={[{ id: 2, name: "Nueva", departmentId: 10 }]} onChanged={changed} />);
  await user.click(await screen.findByRole("button", { name: "Asignaciones siguientes" }));
  await waitFor(() => expect(request).toHaveBeenLastCalledWith("/initiatives/7/assignments/search?page=1&size=20"));
  await user.selectOptions(screen.getByLabelText("Nuevo responsable de iniciativa"), "2");
  await user.type(screen.getByLabelText("Motivo de reasignación"), "Cambio");
  await user.click(screen.getByRole("button", { name: "Reasignar iniciativa" }));
  await waitFor(() => expect(changed).toHaveBeenCalledOnce());
  await waitFor(() => expect(request).toHaveBeenLastCalledWith("/initiatives/7/assignments/search?page=0&size=20"));
  expect(screen.getByLabelText("Motivo de reasignación")).toHaveValue("");
});
