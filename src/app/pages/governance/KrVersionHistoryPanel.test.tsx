import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KrVersionHistoryPanel } from "./KrVersionHistoryPanel";
const mocks = vi.hoisted(() => ({ versionPage: vi.fn() }));
vi.mock("../../services/keyResultsV2Api", () => ({ keyResultsV2Api: mocks }));
beforeEach(() => vi.clearAllMocks());
it("shows historical field changes including zero, status and links, and reaches the initial snapshot", async () => {
  mocks.versionPage.mockImplementation(async (_id: number, page: number) => ({ items: [{ id: page ? 101 : 1, version: page ? 0 : 20, reason: page ? "Alta original" : "Cambios acordados", actorName: "Gestor", occurredAt: "2026-01-01T12:00:00Z", snapshot: page ? { after: { baseValue: 0 } } : { before: { baseValue: 0, status: "DRAFT", linkedGoalIds: [] }, after: { baseValue: 1, status: "ACTIVE", linkedGoalIds: [9] } } }], totalElements: 21, totalPages: 2 }));
  const user = userEvent.setup(); const { rerender } = render(<KrVersionHistoryPanel id={7} refreshVersion={0} disabled={false} />);
  await user.click(await screen.findByText("Ver cambios registrados"));
  expect(screen.getByText("Antes: 0")).toBeVisible();expect(screen.getByText("Después: Activo")).toBeVisible();expect(screen.getByText("Después: #9")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Versiones siguientes" }));
  await screen.findByText("Alta original");await user.click(screen.getByText("Ver definición inicial"));expect(screen.getByText("Registrado: 0")).toBeVisible();
  expect(mocks.versionPage).toHaveBeenLastCalledWith(7, 1);
  rerender(<KrVersionHistoryPanel id={7} refreshVersion={1} disabled={false} />);
  await waitFor(() => expect(mocks.versionPage).toHaveBeenLastCalledWith(7, 0));
});
it("offers retry for a denied history without displaying stale snapshots", async () => {
  mocks.versionPage.mockRejectedValueOnce(new Error("Fuera de tu ámbito")).mockResolvedValue({ items: [], totalElements: 0, totalPages: 0 });
  render(<KrVersionHistoryPanel id={7} refreshVersion={0} disabled={false} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Fuera de tu ámbito");
  await userEvent.click(screen.getByRole("button", { name: "Reintentar historial" }));
  expect(await screen.findByText("Sin versiones en esta página.")).toBeInTheDocument();
});
