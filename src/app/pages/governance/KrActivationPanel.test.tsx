import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { KrActivationPanel } from "./KrActivationPanel";
const mocks = vi.hoisted(() => ({ activationCheck: vi.fn(), activate: vi.fn() }));
vi.mock("../../services/keyResultsV2Api", () => ({ keyResultsV2Api: mocks }));
beforeEach(() => { vi.clearAllMocks(); });
it("blocks activation while the policy is unset", async () => {
  mocks.activationCheck.mockResolvedValue({ ready: false, checks: [{ code: "POLICY", passed: false, actual: 0, required: 1 }] });
  render(<MemoryRouter><KrActivationPanel id={8} version={4} status="DRAFT" canWrite onChanged={vi.fn()} /></MemoryRouter>);
  expect(await screen.findByRole("button", { name: "Activar KR" })).toBeDisabled(); expect(mocks.activate).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Consultar políticas" })).toHaveAttribute("href", "/politicas");
});
it("retains the reason when a concurrent mutation prevents activation", async () => {
  mocks.activationCheck.mockResolvedValue({ ready: true, policyVersion: 2, checks: [] }); mocks.activate.mockRejectedValue(new Error("Versión obsoleta"));
  const changed = vi.fn(); render(<MemoryRouter><KrActivationPanel id={8} version={4} status="DRAFT" canWrite onChanged={changed} /></MemoryRouter>); const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Motivo de activación"), "Inicio de ciclo"); await user.click(screen.getByRole("button", { name: "Activar KR" }));
  await waitFor(() => expect(mocks.activate).toHaveBeenCalledWith(8, 4, "Inicio de ciclo"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Versión obsoleta"); expect(screen.getByLabelText("Motivo de activación")).toHaveValue("Inicio de ciclo"); expect(changed).not.toHaveBeenCalled();
});
