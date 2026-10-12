import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KrRelationHistoryPanel } from "./KrRelationHistoryPanel";
const mocks = vi.hoisted(() => ({ relationPage: vi.fn() }));
vi.mock("../../services/keyResultsV2Api", () => ({ keyResultsV2Api: mocks }));
beforeEach(() => vi.clearAllMocks());
it("pages old links independently and only offers removal of active links", async () => {
  const active = { id: 1, targetId: 9, name: "Meta vigente", startedAt: "2026-01-02T12:00:00Z", endedAt: null, actorName: "Gestor" };
  mocks.relationPage.mockImplementation(async (_id: number, _kind: string, page: number) => ({ items: [page ? { ...active, id: 101, name: "Meta anterior", endedAt: "2026-01-03T12:00:00Z" } : active], totalElements: 21, totalPages: 2 }));
  const onRemove = vi.fn();const user = userEvent.setup();const { rerender } = render(<KrRelationHistoryPanel id={7} kind="goals" version={0} disabled={false} onRemove={onRemove} />);
  await user.click(await screen.findByRole("button", { name: "Finalizar vínculo con Meta vigente" }));expect(onRemove).toHaveBeenCalledWith(active);
  await user.click(screen.getByRole("button", { name: "Página siguiente de metas" }));await screen.findByText("Meta anterior · Finalizado");expect(screen.queryByRole("button", { name: /Finalizar vínculo/ })).not.toBeInTheDocument();expect(mocks.relationPage).toHaveBeenLastCalledWith(7, "goals", 1);
  rerender(<KrRelationHistoryPanel id={7} kind="goals" version={1} disabled={false} onRemove={onRemove} />);await waitFor(() => expect(mocks.relationPage).toHaveBeenLastCalledWith(7, "goals", 0));
});
