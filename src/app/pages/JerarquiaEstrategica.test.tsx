import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { hierarchyScreenData } from "../../test/hierarchyPageFixtures";
import { installRadixSelectPolyfills } from "../../test/radixSelect";
import { JerarquiaEstrategica } from "./JerarquiaEstrategica";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  role: { current: "admin" },
  refresh: { current: undefined as undefined | (() => Promise<void> | void) },
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { rol: mocks.role.current } }) }));
vi.mock("../hooks/useStrategicDataRefresh", () => ({
  useStrategicDataRefresh: (options: { onRefresh: () => Promise<void> | void }) => {
    mocks.refresh.current = options.onRefresh;
  },
}));
vi.mock("../services/screenDataCache", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/screenDataCache")>();
  return { ...original, loadHierarchyScreen: mocks.load };
});
vi.mock("./okrs/KeyResultDetailModal", () => ({
  KeyResultDetailModal: (props: { keyResultId: number; onClose: () => void; onChanged: () => Promise<void> }) => (
    <div role="dialog" aria-label={`Detalle KR ${props.keyResultId}`}>
      <button onClick={props.onClose}>Cerrar KR</button>
      <button onClick={() => void props.onChanged()}>KR cambiado</button>
    </div>
  ),
}));
vi.mock("./proyectos/ProjectDetailModal", () => ({
  ProjectDetailModal: (props: { projectId: number; onClose: () => Promise<void> }) => (
    <div role="dialog" aria-label={`Detalle iniciativa ${props.projectId}`}>
      <button onClick={() => void props.onClose()}>Cerrar iniciativa</button>
    </div>
  ),
}));

function Location() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

function renderAt(url = "/jerarquia") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <JerarquiaEstrategica />
      <Location />
    </MemoryRouter>,
  );
}

describe("JerarquiaEstrategica", () => {
  beforeAll(installRadixSelectPolyfills);
  beforeEach(() => {
    localStorage.clear();
    mocks.role.current = "admin";
    mocks.load.mockReset().mockResolvedValue(hierarchyScreenData());
    vi.mocked(toast.error).mockClear();
  });

  it("shows the table by default", async () => {
    renderAt();

    expect(screen.getByText(/Cargando jerarquia/)).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: /Matriz de Metas/ })).toBeInTheDocument();
    expect(mocks.load).toHaveBeenCalledWith(undefined, { force: undefined });
  });

  it("opens a key result and an initiative from the table and reloads after closing the initiative", async () => {
    const user = userEvent.setup();
    renderAt();

    await user.click(await screen.findByRole("button", { name: "Tutorías" }));
    expect(screen.getByRole("dialog", { name: "Detalle KR 12" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "KR cambiado" }));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: "Cerrar KR" }));
    expect(screen.queryByRole("dialog", { name: "Detalle KR 12" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /PROY-21/ }));
    expect(screen.getByRole("dialog", { name: "Detalle iniciativa 21" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar iniciativa" }));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(3));
    expect(mocks.load).toHaveBeenLastCalledWith(undefined, { force: true });
  });

  it("goes from a table column to the root detail and back", async () => {
    const user = userEvent.setup();
    renderAt();

    await user.click(await screen.findByRole("button", { name: "Filtrar por Apuesta digital" }));
    await user.click(screen.getByRole("button", { name: "Ver detalle" }));
    expect(await screen.findByRole("heading", { name: "Apuesta digital" })).toBeInTheDocument();
    expect(screen.getByText("Contenido jerarquico")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Buscar en la jerarquía" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Volver/ }));
    expect(await screen.findByRole("region", { name: /Matriz de Metas/ })).toBeInTheDocument();
  });

  it("remembers cards mode, filters roots by view and search, and opens a root", async () => {
    localStorage.setItem("mte.viewMode.hierarchy", "cards");
    const user = userEvent.setup();
    renderAt();

    expect(await screen.findByRole("heading", { name: "Apuesta digital" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Meta de permanencia" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Metas" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Apuesta digital" })).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Todas" }));

    const search = screen.getByRole("textbox", { name: "Buscar en la jerarquía" });
    await user.type(search, "zzz");
    expect(await screen.findByText("No hay apuestas o metas que coincidan con la busqueda.")).toBeInTheDocument();
    await user.clear(search);
    await user.type(search, "tutor");
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Apuesta digital" })).not.toBeInTheDocument());

    await user.click(screen.getByRole("heading", { name: "Meta de permanencia" }));
    expect(await screen.findByText("2 elementos directos")).toBeInTheDocument();
    expect(screen.getByText("Tutorías")).toBeInTheDocument();
  });

  it("switches between table and cards from the toolbar", async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByRole("region", { name: /Matriz de Metas/ });

    await user.click(screen.getByRole("button", { name: "Tarjetas" }));
    expect(await screen.findByRole("heading", { name: "Apuesta digital" })).toBeInTheDocument();
    expect(localStorage.getItem("mte.viewMode.hierarchy")).toBe("cards");
  });

  it("reloads with the chosen period and forces a reload with the refresh button", async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByRole("region", { name: /Matriz de Metas/ });

    await user.click(screen.getByRole("combobox", { name: "Filtrar por periodo" }));
    await user.click(await screen.findByRole("option", { name: "2026-1" }));
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith("2026-1", { force: undefined }));

    await user.click(screen.getByRole("button", { name: "Recargar" }));
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith("2026-1", { force: true }));
  });

  it("refreshes silently without resetting the selection when data changes elsewhere", async () => {
    localStorage.setItem("mte.viewMode.hierarchy", "cards");
    const user = userEvent.setup();
    renderAt();
    await user.click(await screen.findByRole("heading", { name: "Meta de permanencia" }));
    await screen.findByText("2 elementos directos");

    await act(async () => {
      await mocks.refresh.current?.();
    });
    expect(mocks.load).toHaveBeenLastCalledWith(undefined, { force: true });
    expect(screen.getByText("2 elementos directos")).toBeInTheDocument();
    expect(screen.queryByText(/Cargando jerarquia/)).not.toBeInTheDocument();
  });

  it("swallows silent refresh errors", async () => {
    renderAt();
    await screen.findByRole("region", { name: /Matriz de Metas/ });
    mocks.load.mockRejectedValueOnce(new Error("Sin red"));
    await act(async () => {
      await mocks.refresh.current?.();
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("reports load failures with the error message or a default one", async () => {
    mocks.load.mockRejectedValueOnce(new Error("Servidor caído"));
    const { unmount } = renderAt();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Servidor caído"));
    unmount();

    mocks.load.mockRejectedValueOnce("boom");
    renderAt();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo cargar la jerarquia"));
  });

  it("explains when the hierarchy is empty", async () => {
    mocks.load.mockResolvedValue(hierarchyScreenData({ tree: [] }));
    renderAt();
    expect(await screen.findByText("No hay nodos en la jerarquia para el filtro seleccionado.")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Matriz de Metas/ })).not.toBeInTheDocument();
  });

  it("hides creation for managers while keeping Archivados", async () => {
    mocks.role.current = "manager";
    renderAt();
    await screen.findByRole("region", { name: /Matriz de Metas/ });
    expect(screen.queryByRole("button", { name: "Nueva Meta" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archivados" })).toBeInTheDocument();
  });

  it("gives visitors a read-only toolbar", async () => {
    mocks.role.current = "visitor";
    renderAt();
    await screen.findByRole("region", { name: /Matriz de Metas/ });
    expect(screen.queryByRole("button", { name: "Archivados" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nueva/ })).not.toBeInTheDocument();
    expect(within(document.body).getByRole("button", { name: "Recargar" })).toBeInTheDocument();
  });
});
