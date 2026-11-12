import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { StrategicHierarchyNode } from "../services/strategicApi";
import { hierarchyScreenData } from "../../test/hierarchyPageFixtures";
import { JerarquiaEstrategica } from "./JerarquiaEstrategica";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  createKr: vi.fn(),
  signal: vi.fn(),
  invalidate: vi.fn(),
  role: { current: "admin" },
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { rol: mocks.role.current } }) }));
vi.mock("../hooks/useStrategicDataRefresh", () => ({ useStrategicDataRefresh: () => undefined }));
vi.mock("../utils/strategicDataRefresh", () => ({ signalStrategicDataChanged: mocks.signal }));
vi.mock("../services/screenDataCache", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/screenDataCache")>();
  return { ...original, loadHierarchyScreen: mocks.load, invalidateScreenDataCache: mocks.invalidate };
});
vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return { ...original, keyResultsApi: { ...original.keyResultsApi, create: mocks.createKr } };
});
vi.mock("./okrs/KeyResultDetailModal", () => ({
  KeyResultDetailModal: (props: { keyResultId: number; canEdit: boolean; onClose: () => void; onOpenInHierarchy: (focus: unknown) => void }) => (
    <div role="dialog" aria-label={`Detalle KR ${props.keyResultId}`}>
      <span>{props.canEdit ? "puede editar" : "solo lectura"}</span>
      <button onClick={props.onClose}>Cerrar KR</button>
      <button onClick={() => props.onOpenInHierarchy({ rootType: "GOAL", rootId: 5, field: "indicator", text: "Tutorías" })}>Abrir en tabla</button>
    </div>
  ),
}));
vi.mock("./proyectos/ProjectDetailModal", () => ({
  ProjectDetailModal: (props: { projectId: number; onClose: () => void }) => (
    <div role="dialog" aria-label={`Detalle iniciativa ${props.projectId}`}>
      <button onClick={props.onClose}>Cerrar iniciativa</button>
    </div>
  ),
}));
vi.mock("./jerarquia/ArchivedStrategyModal", () => ({
  ArchivedStrategyModal: (props: { canManageStrategy: boolean; onClose: () => void; onChanged: () => void }) => (
    <div role="dialog" aria-label="Archivados">
      <span>{props.canManageStrategy ? "gestiona" : "no gestiona"}</span>
      <button onClick={props.onChanged}>Archivo cambiado</button>
      <button onClick={props.onClose}>Cerrar archivados</button>
    </div>
  ),
}));
vi.mock("./jerarquia/StrategyFormModals", () => ({
  StrategicBetFormModal: (props: { bet?: { name: string }; onClose: () => void; onCreated?: () => void; onSaved?: () => void }) => (
    <div role="dialog" aria-label={props.bet ? `Editar apuesta ${props.bet.name}` : "Nueva apuesta"}>
      <button onClick={props.onClose}>Cerrar apuesta</button>
      <button onClick={props.onCreated ?? props.onSaved}>Guardar apuesta</button>
    </div>
  ),
  GoalFormModal: (props: { goal?: { name: string }; onClose: () => void; onCreated?: () => void; onSaved?: () => void }) => (
    <div role="dialog" aria-label={props.goal ? `Editar meta ${props.goal.name}` : "Nueva meta"}>
      <button onClick={props.onClose}>Cerrar meta</button>
      <button onClick={props.onCreated ?? props.onSaved}>Guardar meta</button>
    </div>
  ),
}));
vi.mock("./okrs/KrFormModal", () => ({
  KrFormModal: (props: { saving: boolean; defaults: { goalIds: number[]; strategicBetIds: number[] }; onClose: () => void; onSubmit: (body: unknown) => void }) => (
    <div role="dialog" aria-label="Crear KR">
      <p data-testid="defaults">{JSON.stringify(props.defaults)}</p>
      <p>{props.saving ? "guardando" : "libre"}</p>
      <button onClick={() => props.onSubmit({ name: "KR nuevo" })}>Enviar KR</button>
      <button onClick={props.onClose}>Cerrar KR form</button>
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

async function openCards(user: ReturnType<typeof userEvent.setup>, heading: string) {
  await user.click(await screen.findByRole("heading", { name: heading }));
  await screen.findByText(/elementos directos/);
}

describe("JerarquiaEstrategica actions", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("mte.viewMode.hierarchy", "cards");
    mocks.role.current = "admin";
    mocks.load.mockReset().mockResolvedValue(hierarchyScreenData());
    mocks.createKr.mockReset().mockResolvedValue({});
    mocks.signal.mockReset();
    mocks.invalidate.mockReset();
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  it("creates a goal and a bet from the toolbar and reloads", async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByRole("heading", { name: "Apuesta digital" });

    await user.click(screen.getByRole("button", { name: "Nueva Meta" }));
    expect(screen.getByRole("dialog", { name: "Nueva meta" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar meta" }));
    expect(screen.queryByRole("dialog", { name: "Nueva meta" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nueva Meta" }));
    await user.click(screen.getByRole("button", { name: "Guardar meta" }));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("dialog", { name: "Nueva meta" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nueva Apuesta" }));
    await user.click(screen.getByRole("button", { name: "Cerrar apuesta" }));
    await user.click(screen.getByRole("button", { name: "Nueva Apuesta" }));
    await user.click(screen.getByRole("button", { name: "Guardar apuesta" }));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(3));
  });

  it("opens the archived dialog, reloading when it changes", async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByRole("heading", { name: "Apuesta digital" });

    await user.click(screen.getByRole("button", { name: "Archivados" }));
    expect(screen.getByText("gestiona")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Archivo cambiado" }));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("button", { name: "Cerrar archivados" }));
    expect(screen.queryByRole("dialog", { name: "Archivados" })).not.toBeInTheDocument();
  });

  it("edits a bet and a goal from the detail and keeps the selection", async () => {
    const user = userEvent.setup();
    renderAt();
    await openCards(user, "Apuesta digital");

    await user.click(screen.getByRole("button", { name: /Gestionar apuesta/ }));
    expect(screen.getByRole("dialog", { name: "Editar apuesta Apuesta digital" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar apuesta" }));
    await user.click(screen.getByRole("button", { name: /Gestionar apuesta/ }));
    await user.click(screen.getByRole("button", { name: "Guardar apuesta" }));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/elementos directos/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Volver/ }));
    await openCards(user, "Meta de permanencia");
    await user.click(screen.getByRole("button", { name: /Gestionar meta/ }));
    expect(screen.getByRole("dialog", { name: "Editar meta Meta de permanencia" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar meta" }));
    await user.click(screen.getByRole("button", { name: /Gestionar meta/ }));
    await user.click(screen.getByRole("button", { name: "Guardar meta" }));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(3));
  });

  it("reports when the bet or goal to edit cannot be found", async () => {
    const user = userEvent.setup();
    mocks.load.mockResolvedValue(hierarchyScreenData({ bets: [], goals: [] }));
    renderAt();
    await openCards(user, "Apuesta digital");
    await user.click(screen.getByRole("button", { name: /Gestionar apuesta/ }));
    expect(toast.error).toHaveBeenCalledWith("No se pudo encontrar la apuesta para editar.");

    await user.click(screen.getByRole("button", { name: /Volver/ }));
    await openCards(user, "Meta de permanencia");
    await user.click(screen.getByRole("button", { name: /Gestionar meta/ }));
    expect(toast.error).toHaveBeenCalledWith("No se pudo encontrar la meta para editar.");
  });

  it("opens key result and initiative details from the tree and lets the KR jump to the table", async () => {
    const user = userEvent.setup();
    renderAt();
    await openCards(user, "Apuesta digital");

    await user.click(screen.getByRole("button", { name: /Cursos en línea/ }));
    const manageButtons = screen.getAllByRole("button", { name: "Gestionar" });
    await user.click(manageButtons[0]);
    expect(screen.getByRole("dialog", { name: "Detalle KR 11" })).toBeInTheDocument();
    expect(screen.getByText("puede editar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar KR" }));

    await user.click(screen.getAllByRole("button", { name: "Gestionar" })[1]);
    expect(screen.getByRole("dialog", { name: "Detalle iniciativa 21" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar iniciativa" }));
  });

  it("jumps from a detail to the table with the requested focus and drops the address parameters", async () => {
    const user = userEvent.setup();
    renderAt();
    await openCards(user, "Meta de permanencia");

    await user.click(screen.getAllByRole("button", { name: "Gestionar" })[1]);
    await user.click(screen.getByRole("button", { name: "Abrir en tabla" }));

    expect(await screen.findByRole("region", { name: /Matriz de Metas/ })).toBeInTheDocument();
    expect(screen.getByText("Filtrando por: Meta de permanencia")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Buscar en Indicador" })).toHaveValue("Tutorías");
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/jerarquia$/);
    expect(screen.queryByRole("dialog", { name: /Detalle KR/ })).not.toBeInTheDocument();
  });

  it("applies a table focus coming from the address", async () => {
    renderAt("/jerarquia?vista=tabla&columna=GOAL:5&iniciativa=plataf&otro=1");

    expect(await screen.findByRole("region", { name: /Matriz de Metas/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/jerarquia?otro=1"));
    expect(screen.getByRole("searchbox", { name: "Buscar en Iniciativas" })).toHaveValue("plataf");
  });

  it("selects the root named in the address", async () => {
    renderAt("/jerarquia?rootType=GOAL&rootId=5");
    expect(await screen.findByText("2 elementos directos")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Meta de permanencia" })).toBeInTheDocument();
  });

  it("ignores a root that is not in the tree", async () => {
    renderAt("/jerarquia?rootType=GOAL&rootId=999");
    expect(await screen.findByRole("heading", { name: "Apuesta digital" })).toBeInTheDocument();
    expect(screen.queryByText(/elementos directos/)).not.toBeInTheDocument();
  });

  it("selects the root that contains the key result named in the address", async () => {
    renderAt("/jerarquia?keyResultId=12");
    expect(await screen.findByRole("heading", { name: "Meta de permanencia" })).toBeInTheDocument();
    expect(screen.getByText("2 elementos directos")).toBeInTheDocument();
  });

  it("ignores an unknown key result in the address", async () => {
    renderAt("/jerarquia?keyResultId=404");
    expect(await screen.findByRole("heading", { name: "Apuesta digital" })).toBeInTheDocument();
    expect(screen.queryByText(/elementos directos/)).not.toBeInTheDocument();
  });

  it("reports nodes whose identifier is not numeric", async () => {
    const user = userEvent.setup();
    const broken: StrategicHierarchyNode[] = [
      {
        nodeType: "GOAL",
        id: "5",
        label: "Meta de permanencia",
        children: [
          { nodeType: "KEY_RESULT", id: "abc", label: "KR roto", children: [] },
          { nodeType: "PROJECT", id: "xyz", label: "Iniciativa rota", children: [] },
        ],
      },
    ];
    mocks.load.mockResolvedValue(hierarchyScreenData({ tree: broken }));
    renderAt();
    await openCards(user, "Meta de permanencia");

    const manage = screen.getAllByRole("button", { name: "Gestionar" });
    await user.click(manage[0]);
    expect(toast.error).toHaveBeenCalledWith("No se pudo abrir el detalle del KR.");
    await user.click(manage[1]);
    expect(toast.error).toHaveBeenCalledWith("No se pudo abrir el detalle de la iniciativa.");
  });

  describe("creating a key result from a root", () => {
    it("pre-links the goal and sends the request, then refreshes", async () => {
      const user = userEvent.setup();
      renderAt();
      await openCards(user, "Meta de permanencia");

      await user.click(screen.getByRole("button", { name: /Crear KR/ }));
      expect(screen.getByTestId("defaults")).toHaveTextContent('{"goalIds":[5],"strategicBetIds":[]}');
      await user.click(screen.getByRole("button", { name: "Enviar KR" }));

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Key Result creado"));
      expect(mocks.createKr).toHaveBeenCalledWith({ name: "KR nuevo" });
      expect(mocks.invalidate).toHaveBeenCalled();
      expect(mocks.signal).toHaveBeenCalledWith(expect.objectContaining({ reason: "key-result-create" }));
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Crear KR" })).not.toBeInTheDocument());
      expect(mocks.load).toHaveBeenLastCalledWith(undefined, { force: true });
    });

    it("pre-links the bet when created from a bet", async () => {
      const user = userEvent.setup();
      renderAt();
      await openCards(user, "Apuesta digital");
      await user.click(screen.getByRole("button", { name: /Crear KR/ }));
      expect(screen.getByTestId("defaults")).toHaveTextContent('{"goalIds":[],"strategicBetIds":[7]}');
      await user.click(screen.getByRole("button", { name: "Cerrar KR form" }));
      expect(screen.queryByRole("dialog", { name: "Crear KR" })).not.toBeInTheDocument();
    });

    it("keeps the form open and reports the failure message", async () => {
      const user = userEvent.setup();
      mocks.createKr.mockRejectedValueOnce(new Error("Nombre duplicado"));
      renderAt();
      await openCards(user, "Meta de permanencia");
      await user.click(screen.getByRole("button", { name: /Crear KR/ }));
      await user.click(screen.getByRole("button", { name: "Enviar KR" }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nombre duplicado"));
      expect(screen.getByRole("dialog", { name: "Crear KR" })).toBeInTheDocument();
      expect(screen.getByText("libre")).toBeInTheDocument();
    });

    it("uses a default message when the failure has none", async () => {
      const user = userEvent.setup();
      mocks.createKr.mockRejectedValueOnce("falla");
      renderAt();
      await openCards(user, "Meta de permanencia");
      await user.click(screen.getByRole("button", { name: /Crear KR/ }));
      await user.click(screen.getByRole("button", { name: "Enviar KR" }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo crear el Key Result"));
    });

    it("is not offered to visitors", async () => {
      const user = userEvent.setup();
      mocks.role.current = "visitor";
      renderAt();
      await openCards(user, "Meta de permanencia");
      expect(screen.queryByRole("button", { name: /Crear KR/ })).not.toBeInTheDocument();
    });
  });
});
