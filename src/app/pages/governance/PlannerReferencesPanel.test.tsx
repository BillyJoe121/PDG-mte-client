import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { PlannerReferencesPanel } from "./PlannerReferencesPanel";

const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("../../services/plannerReferencesV2Api", () => ({ plannerReferencesV2Api: mocks }));
beforeEach(() => vi.clearAllMocks());
it("keeps revoked reference snapshots visible and rejects unsafe links", async () => {
  mocks.list.mockResolvedValue({ items: [{ id: 1, titleSnapshot: "Tarea capturada", externalPlanId: "p", externalTaskId: "t", externalUrl: "javascript:alert(1)", statusSnapshot: "completed", connectionState: "REVOKED", lastSyncedAt: "2026-10-01T12:00:00Z" }], totalElements: 1, totalPages: 1 });
  render(<PlannerReferencesPanel id={703} />);
  expect(await screen.findByText("Tarea capturada")).toBeInTheDocument();
  expect(screen.getByText("Conexión revocada")).toBeInTheDocument();
  expect(screen.getByText(/no sincroniza con Microsoft/)).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByText(/Sin fecha registrada/)).toBeInTheDocument();
});
it("requests the next page and preserves navigation through an empty page", async () => {
  mocks.list.mockResolvedValueOnce({ items: [{ id: 1, titleSnapshot: "Primera tarea", externalPlanId: "p", externalTaskId: "t", externalUrl: "https://planner.cloud.microsoft/task/t", connectionState: "ACTIVE", lastSyncedAt: "2026-10-01T12:00:00Z" }], totalElements: 21, totalPages: 2 }).mockResolvedValueOnce({ items: [], totalElements: 20, totalPages: 1 });
  render(<PlannerReferencesPanel id={703} />);
  await screen.findByText("Primera tarea");
  await userEvent.click(screen.getByRole("button", { name: "Referencias siguientes" }));
  expect(await screen.findByText("Sin referencias de tareas en esta página.")).toBeInTheDocument();
  expect(mocks.list).toHaveBeenLastCalledWith(703, 1);
  expect(screen.getByRole("button", { name: "Referencias anteriores" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Referencias siguientes" })).toBeDisabled();
});
