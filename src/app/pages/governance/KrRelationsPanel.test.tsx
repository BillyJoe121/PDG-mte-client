import { render as testingRender, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { ReactElement } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { KrRelationsPanel } from "./KrRelationsPanel";
const mocks = vi.hoisted(() => ({ get: vi.fn(), relationPage: vi.fn(), addLink: vi.fn(), removeLink: vi.fn(), reassign: vi.fn(), classify: vi.fn(), deactivate: vi.fn(), activationCheck: vi.fn(), activate: vi.fn() }));
function render(element: ReactElement) { return testingRender(<MemoryRouter>{element}</MemoryRouter>); }
vi.mock("../../services/keyResultsV2Api", () => ({ keyResultsV2Api: mocks }));
const choices = { goals: [{ id: 1, name: "Permanencia" }], bets: [{ id: 2, name: "Bienestar" }] };
const responsibles = [{ id: 1, name: "Anterior", departmentId: 10 }, { id: 2, name: "Nueva", departmentId: 10 }, { id: 3, name: "Ajeno", departmentId: 20 }];
beforeEach(() => {
  vi.clearAllMocks(); mocks.get.mockResolvedValue({ id: 8, name: "Retención", version: 4, departmentId: 10, responsibleId: 1, active: true, status: "DRAFT", type: "COMMITTED" });
  mocks.relationPage.mockResolvedValue({ items: [], totalElements: 0, totalPages: 0 });
  mocks.activationCheck.mockResolvedValue({ ready: false, checks: [{ code: "POLICY", passed: false, actual: 0, required: 1 }] });
});
it("submits a versioned reassignment and retains reason when version conflicts", async () => {
  mocks.reassign.mockRejectedValue(new Error("Otra persona modificó el registro")); const changed = vi.fn();
  render(<KrRelationsPanel id={8} choices={choices} responsibles={responsibles} canWrite onChanged={changed} />);
  const user = userEvent.setup(); await user.selectOptions(await screen.findByLabelText("Nuevo responsable"), "2");
  expect(screen.queryByRole("option", { name: "Ajeno" })).not.toBeInTheDocument();
  await user.type(screen.getByLabelText("Motivo del cambio"), "Nueva responsabilidad"); await user.click(screen.getByRole("button", { name: "Reasignar responsable" }));
  await waitFor(() => expect(mocks.reassign).toHaveBeenCalledWith(8, 4, 2, "Nueva responsabilidad"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Otra persona modificó"); expect(screen.getByLabelText("Motivo del cambio")).toHaveValue("Nueva responsabilidad"); expect(changed).not.toHaveBeenCalled();
});
it("adds a bet independently of goals", async () => {
  mocks.addLink.mockResolvedValue({ id: 8 }); const changed = vi.fn().mockResolvedValue(undefined);
  render(<KrRelationsPanel id={8} choices={choices} responsibles={responsibles} canWrite onChanged={changed} />); const user = userEvent.setup();
  await user.selectOptions(await screen.findByLabelText("Clase de vínculo"), "bets"); await user.selectOptions(screen.getByLabelText("Nuevo vínculo"), "2");
  await user.type(screen.getByLabelText("Motivo del cambio"), "Alineación"); await user.click(screen.getByRole("button", { name: "Agregar vínculo" }));
  await waitFor(() => expect(mocks.addLink).toHaveBeenCalledWith(8, "bets", 4, 2, "Alineación")); expect(mocks.reassign).not.toHaveBeenCalled();
});
it("requires an explicit confirmation and reason before deactivating a KR", async () => {
  mocks.deactivate.mockResolvedValue({ id: 8 }); const changed = vi.fn().mockResolvedValue(undefined);
  render(<KrRelationsPanel id={8} choices={choices} responsibles={responsibles} canWrite onChanged={changed} />); const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Desactivar KR", exact: true }));
  const confirm = screen.getByRole("button", { name: "Confirmar desactivación del KR" }); expect(confirm).toBeDisabled();
  await user.type(screen.getByLabelText("Motivo del cambio"), "Fin de vigencia"); expect(confirm).toBeDisabled();
  expect(mocks.deactivate).not.toHaveBeenCalled(); await user.click(screen.getByLabelText("Confirmo la desactivación del KR")); await user.click(confirm);
  await waitFor(() => expect(mocks.deactivate).toHaveBeenCalledWith(8, 4, "Fin de vigencia", true));
});
