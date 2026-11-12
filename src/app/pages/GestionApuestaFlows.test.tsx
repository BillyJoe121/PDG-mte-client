import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { GestionApuesta } from "./GestionApuesta";

const api = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), setActive: vi.fn() }));

vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return { ...original, strategicBetsApi: { ...original.strategicBetsApi, get: api.get, update: api.update, setActive: api.setActive } };
});

const bet = {
  id: 5,
  name: "Transformacion digital",
  description: "Fortalecer capacidades digitales.",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  status: "ACTIVA" as const,
};

function renderAt(url = "/jerarquia/apuestas/5/gestionar") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/jerarquia/apuestas/:betId/gestionar" element={<GestionApuesta />} />
        <Route path="/jerarquia" element={<p>Pagina de jerarquia</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GestionApuesta flows", () => {
  afterEach(cleanup);
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue(bet);
    api.update.mockReset().mockResolvedValue({ ...bet, name: "Nueva" });
    api.setActive.mockReset().mockResolvedValue({ ...bet, status: "INACTIVA" });
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("shows dates and status in the summary, with placeholders when they are missing", async () => {
    renderAt();
    expect(await screen.findByRole("heading", { name: "Transformacion digital" })).toBeInTheDocument();
    expect(screen.getByText("2026-12-31")).toBeInTheDocument();
    expect(screen.getByText("ACTIVA")).toBeInTheDocument();
    cleanup();

    api.get.mockResolvedValue({ ...bet, startDate: undefined, endDate: undefined, status: undefined });
    renderAt();
    await screen.findByRole("heading", { name: "Transformacion digital" });
    expect(screen.getAllByText("Sin fecha")).toHaveLength(2);
    expect(screen.getByText("Activa")).toBeInTheDocument();
  });

  it("explains missing fields and the date order before saving", async () => {
    const user = userEvent.setup();
    renderAt();
    const name = await screen.findByLabelText("Nombre");
    await user.clear(name);
    await user.clear(screen.getByLabelText("Descripcion"));
    await user.clear(screen.getByLabelText("Fecha cierre"));
    await user.type(screen.getByLabelText("Fecha cierre"), "2025-01-01");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La descripcion es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("La fecha de cierre debe ser posterior al inicio.")).toBeInTheDocument();
    expect(api.update).not.toHaveBeenCalled();

    await user.type(name, "N");
    expect(screen.queryByText("El nombre es obligatorio.")).not.toBeInTheDocument();
  });

  it("saves trimmed values, omits cleared dates and confirms", async () => {
    const user = userEvent.setup();
    renderAt();
    const name = await screen.findByLabelText("Nombre");
    await user.clear(name);
    await user.type(name, "  Nueva ");
    await user.clear(screen.getByLabelText("Fecha inicio"));
    await user.clear(screen.getByLabelText("Fecha cierre"));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Apuesta actualizada"));
    expect(api.update).toHaveBeenCalledWith(5, { name: "Nueva", description: "Fortalecer capacidades digitales." });
    expect(await screen.findByRole("heading", { name: "Nueva" })).toBeInTheDocument();
  });

  it("reports save failures with the message or a default", async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByLabelText("Nombre");

    api.update.mockRejectedValueOnce(new Error("Nombre repetido"));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nombre repetido"));

    api.update.mockRejectedValueOnce("falla");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo actualizar la apuesta"));
  });

  it("restores an archived bet without confirmation", async () => {
    api.get.mockResolvedValue({ ...bet, status: "INACTIVA" });
    api.setActive.mockResolvedValue(bet);
    const user = userEvent.setup();
    renderAt();

    await user.click(await screen.findByRole("button", { name: /restaurar apuesta/i }));
    await waitFor(() => expect(api.setActive).toHaveBeenCalledWith(5, true));
    expect(toast.success).toHaveBeenCalledWith("Apuesta restaurada");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports status change failures with the message or a default", async () => {
    const user = userEvent.setup();
    renderAt();
    await user.click(await screen.findByRole("button", { name: /archivar apuesta/i }));
    api.setActive.mockRejectedValueOnce(new Error("Tiene KRs activos"));
    await user.click(within(await screen.findByRole("dialog", { name: "Archivar apuesta" })).getByRole("button", { name: "Archivar" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Tiene KRs activos"));

    await user.click(screen.getByRole("button", { name: /archivar apuesta/i }));
    api.setActive.mockRejectedValueOnce("falla");
    await user.click(within(await screen.findByRole("dialog", { name: "Archivar apuesta" })).getByRole("button", { name: "Archivar" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo cambiar el estado de la apuesta"));
  });

  it("goes back to the hierarchy from the header and from Cancelar", async () => {
    const user = userEvent.setup();
    renderAt();
    await user.click(await screen.findByRole("button", { name: /Jerarquia/ }));
    expect(await screen.findByText("Pagina de jerarquia")).toBeInTheDocument();
    cleanup();

    renderAt();
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(await screen.findByText("Pagina de jerarquia")).toBeInTheDocument();
  });

  it("goes back to the hierarchy from the load error and uses the default message", async () => {
    api.get.mockRejectedValueOnce("falla");
    const user = userEvent.setup();
    renderAt();
    expect(await screen.findByText("No se pudo cargar la apuesta", { selector: "p:first-child" })).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("No se pudo cargar la apuesta");
    await user.click(screen.getByRole("button", { name: /Volver/ }));
    expect(await screen.findByText("Pagina de jerarquia")).toBeInTheDocument();
  });

  it("shows a not-found state for an invalid id", async () => {
    const user = userEvent.setup();
    renderAt("/jerarquia/apuestas/abc/gestionar");
    expect(await screen.findByText("Apuesta no encontrada")).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Volver/ }));
    expect(await screen.findByText("Pagina de jerarquia")).toBeInTheDocument();
  });
});
