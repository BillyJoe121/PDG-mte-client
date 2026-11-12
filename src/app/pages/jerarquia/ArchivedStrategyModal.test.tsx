import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ArchivedStrategyModal } from "./ArchivedStrategyModal";

const api = vi.hoisted(() => ({
  listBets: vi.fn(),
  listGoals: vi.fn(),
  setBet: vi.fn(),
  setGoal: vi.fn(),
}));

vi.mock("../../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../services/strategicApi")>();
  return {
    ...original,
    strategicBetsApi: { ...original.strategicBetsApi, list: api.listBets, setActive: api.setBet },
    goalsApi: { ...original.goalsApi, list: api.listGoals, setActive: api.setGoal },
  };
});

const archivedBet = { id: 1, name: "Apuesta vieja", description: "Ya no aplica", status: "INACTIVA" };
const activeBet = { id: 2, name: "Apuesta vigente", description: "Sigue", status: "ACTIVA" };
const archivedGoal = { id: 3, name: "Meta vieja", description: "Cerrada", status: "INACTIVA" };

function setup(canManageStrategy = true) {
  const onClose = vi.fn();
  const onChanged = vi.fn().mockResolvedValue(undefined);
  render(<ArchivedStrategyModal canManageStrategy={canManageStrategy} onClose={onClose} onChanged={onChanged} />);
  return { onClose, onChanged };
}

describe("ArchivedStrategyModal", () => {
  beforeEach(() => {
    api.listBets.mockReset().mockResolvedValue([archivedBet, activeBet]);
    api.listGoals.mockReset().mockResolvedValue([archivedGoal]);
    api.setBet.mockReset().mockResolvedValue({});
    api.setGoal.mockReset().mockResolvedValue({});
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("lists only archived bets and goals, asking for archived items from the API", async () => {
    setup();
    expect(screen.getByText("Cargando archivo...")).toBeInTheDocument();
    expect(await screen.findByText("Apuesta vieja")).toBeInTheDocument();
    expect(screen.queryByText("Apuesta vigente")).not.toBeInTheDocument();
    expect(screen.getByText("Meta vieja")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Apuestas (1)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Metas (1)" })).toBeInTheDocument();
    expect(api.listBets).toHaveBeenCalledWith(undefined, true);
    expect(api.listGoals).toHaveBeenCalledWith(undefined, true);
  });

  it("says so when nothing is archived and hides empty groups", async () => {
    api.listBets.mockResolvedValue([activeBet]);
    api.listGoals.mockResolvedValue([]);
    setup();
    expect(await screen.findByText("No hay elementos archivados.")).toBeInTheDocument();
  });

  it("hides empty groups while keeping the other", async () => {
    api.listGoals.mockResolvedValue([]);
    setup();
    await screen.findByText("Apuesta vieja");
    expect(screen.queryByRole("heading", { name: /Metas/ })).not.toBeInTheDocument();
  });

  it("does not offer restore to people who cannot manage the strategy", async () => {
    setup(false);
    await screen.findByText("Apuesta vieja");
    expect(screen.queryByRole("button", { name: /Restaurar/ })).not.toBeInTheDocument();
  });

  it("restores a bet and a goal, notifies the screen and removes them from the list", async () => {
    const user = userEvent.setup();
    const { onChanged } = setup();
    await screen.findByText("Apuesta vieja");

    await user.click(screen.getAllByRole("button", { name: /Restaurar/ })[0]);
    await waitFor(() => expect(api.setBet).toHaveBeenCalledWith(1, true));
    await waitFor(() => expect(screen.queryByText("Apuesta vieja")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Restaurar/ }));
    await waitFor(() => expect(api.setGoal).toHaveBeenCalledWith(3, true));
    expect(await screen.findByText("No hay elementos archivados.")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Elemento restaurado");
    expect(onChanged).toHaveBeenCalledTimes(2);
  });

  it("blocks other restores while one is running", async () => {
    let finish: () => void = () => undefined;
    api.setBet.mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    setup();
    await screen.findByText("Apuesta vieja");

    await user.click(screen.getAllByRole("button", { name: /Restaurar/ })[0]);
    await waitFor(() => screen.getAllByRole("button", { name: /Restaurar/ }).forEach((button) => expect(button).toBeDisabled()));
    finish();
    await waitFor(() => expect(screen.queryByText("Apuesta vieja")).not.toBeInTheDocument());
  });

  it("reports restore failures with the message or a default and keeps the item", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Apuesta vieja");

    api.setBet.mockRejectedValueOnce(new Error("Sin permiso"));
    await user.click(screen.getAllByRole("button", { name: /Restaurar/ })[0]);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Sin permiso"));
    expect(screen.getByText("Apuesta vieja")).toBeInTheDocument();

    api.setGoal.mockRejectedValueOnce("falla");
    await user.click(screen.getAllByRole("button", { name: /Restaurar/ })[1]);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo restaurar el elemento"));
    expect(screen.getByText("Meta vieja")).toBeInTheDocument();
  });

  it("reports loading failures with the message or a default", async () => {
    api.listBets.mockRejectedValueOnce(new Error("Servidor caído"));
    const { unmount } = render(<ArchivedStrategyModal canManageStrategy onClose={vi.fn()} onChanged={vi.fn()} />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Servidor caído"));
    expect(await screen.findByText("No hay elementos archivados.")).toBeInTheDocument();
    unmount();

    api.listBets.mockRejectedValueOnce("falla");
    render(<ArchivedStrategyModal canManageStrategy onClose={vi.fn()} onChanged={vi.fn()} />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo cargar el archivo"));
  });

  it("ignores a response that arrives after closing", async () => {
    let resolveBets: (value: unknown[]) => void = () => undefined;
    api.listBets.mockReturnValue(new Promise((resolve) => { resolveBets = resolve; }));
    const { unmount } = render(<ArchivedStrategyModal canManageStrategy onClose={vi.fn()} onChanged={vi.fn()} />);
    unmount();
    resolveBets([archivedBet]);
    await Promise.resolve();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("closes from the header button", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.click(screen.getByRole("button", { name: "Cerrar archivo" }));
    expect(onClose).toHaveBeenCalled();
  });
});
