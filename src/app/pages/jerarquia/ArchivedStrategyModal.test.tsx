import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArchivedStrategyModal } from "./ArchivedStrategyModal";

const api = vi.hoisted(() => ({ listBets: vi.fn(), listGoals: vi.fn(), setBetActive: vi.fn(), setGoalActive: vi.fn() }));

vi.mock("../../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../services/strategicApi")>();
  return {
    ...original,
    strategicBetsApi: { ...original.strategicBetsApi, list: api.listBets, setActive: api.setBetActive },
    goalsApi: { ...original.goalsApi, list: api.listGoals, setActive: api.setGoalActive },
  };
});

const archivedBet = { id: 4, name: "Apuesta archivada", description: "Descripcion de apuesta", status: "INACTIVA" };
const archivedGoal = { id: 7, name: "Meta archivada", description: "Descripcion de meta", status: "INACTIVA" };

describe("ArchivedStrategyModal", () => {
  beforeEach(() => {
    api.listBets.mockReset().mockResolvedValue([archivedBet, { ...archivedBet, id: 5, name: "Apuesta activa", status: "ACTIVA" }]);
    api.listGoals.mockReset().mockResolvedValue([archivedGoal]);
    api.setBetActive.mockReset().mockResolvedValue({});
    api.setGoalActive.mockReset().mockResolvedValue({});
  });

  it("lists only archived items and restores one, keeping the dialog open", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn().mockResolvedValue(undefined);
    render(<ArchivedStrategyModal canManageStrategy onClose={() => undefined} onChanged={onChanged} />);

    const dialog = await screen.findByRole("dialog", { name: "Elementos archivados" });
    expect(await within(dialog).findByText("Apuesta archivada")).toBeInTheDocument();
    expect(within(dialog).getByText("Meta archivada")).toBeInTheDocument();
    expect(within(dialog).queryByText("Apuesta activa")).not.toBeInTheDocument();

    const [restoreBet] = within(dialog).getAllByRole("button", { name: "Restaurar" });
    await user.click(restoreBet);

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(api.setBetActive).toHaveBeenCalledWith(4, true);
    expect(within(dialog).queryByText("Apuesta archivada")).not.toBeInTheDocument();
    expect(within(dialog).getByText("Meta archivada")).toBeInTheDocument();
  });

  it("hides the restore action without permission and closes from the header", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ArchivedStrategyModal canManageStrategy={false} onClose={onClose} onChanged={vi.fn()} />);

    expect(await screen.findByText("Meta archivada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Restaurar" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar archivo" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows the empty state when nothing is archived", async () => {
    api.listBets.mockResolvedValue([]);
    api.listGoals.mockResolvedValue([]);
    render(<ArchivedStrategyModal canManageStrategy onClose={() => undefined} onChanged={vi.fn()} />);

    expect(await screen.findByText("No hay elementos archivados.")).toBeInTheDocument();
  });
});
