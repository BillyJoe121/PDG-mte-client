import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { PoliticasInstitucionales } from "./PoliticasInstitucionales";
const mocks = vi.hoisted(() => ({ history: vi.fn(), record: vi.fn(), role: "admin" }));
vi.mock("../services/policiesV2Api", () => ({ policiesV2Api: mocks }));
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { rol: mocks.role } }) }));
beforeEach(() => { vi.clearAllMocks(); mocks.role = "admin"; mocks.history.mockResolvedValue([]); });
it("requires explicit minimums and confirmation and submits against version zero", async () => {
  mocks.record.mockResolvedValue({ id: 1, version: 1 }); render(<PoliticasInstitucionales />); const user = userEvent.setup();
  const goals = await screen.findByLabelText("Mínimo de Metas vinculadas"); const bets = screen.getByLabelText("Mínimo de Apuestas vinculadas");
  expect(goals).toHaveValue(null); expect(bets).toHaveValue(null);
  await user.type(goals, "1"); await user.type(bets, "0"); await user.type(screen.getByLabelText("Referencia de la decisión aprobada"), "https://example.org/decision");
  await user.type(screen.getByLabelText("Motivo y contexto de la decisión"), "Decisión aprobada");
  const save = screen.getByRole("button", { name: "Registrar decisión" }); expect(save).toBeDisabled();
  await user.click(screen.getByLabelText(/Confirmo que estos mínimos/)); await user.click(save);
  await waitFor(() => expect(mocks.record).toHaveBeenCalledWith({ minGoals: 1, minBets: 0, decisionRef: "https://example.org/decision", reason: "Decisión aprobada", confirmed: true }, 0));
});
it("lets managers read policies while withholding the registration form", async () => {
  mocks.role = "manager"; render(<PoliticasInstitucionales />);
  expect(await screen.findByText(/La política de mínimos no está registrada/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Registrar decisión" })).not.toBeInTheDocument();
});
