import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { toast } from "sonner";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectDetailResponse } from "../services/projectsApi";
import { makeDetail, makeEntry, makeLink, makeProject } from "../../test/projectFixtures";
import { installRadixSelectPolyfills } from "../../test/radixSelect";

const mocks = vi.hoisted(() => ({
  rol: "admin" as string,
  load: vi.fn(),
  updateStatus: vi.fn(),
  remove: vi.fn(),
  listTeachers: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { rol: mocks.rol } }) }));
vi.mock("../services/screenDataCache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/screenDataCache")>();
  return { ...actual, loadProjectDetailScreen: mocks.load, invalidateScreenDataCache: vi.fn() };
});
vi.mock("../services/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/projectsApi")>();
  return {
    ...actual,
    projectsApi: { ...actual.projectsApi, updateStatus: mocks.updateStatus },
    projectKeyResultLinksApi: { ...actual.projectKeyResultLinksApi, remove: mocks.remove },
    projectTeachersApi: { ...actual.projectTeachersApi, list: mocks.listTeachers },
  };
});

import { useDiscardGuard } from "../hooks/useDiscardGuard";
import { ProjectDetailContent } from "./FichaProyecto";

function Host({ projectId = 7, onBack, onOpenInHierarchy }: { projectId?: number; onBack: () => void; onOpenInHierarchy?: never }) {
  const guard = useDiscardGuard();
  return (
    <MemoryRouter>
      <ProjectDetailContent projectId={projectId} guard={guard} onBack={onBack} onOpenInHierarchy={onOpenInHierarchy} />
      {guard.dialog}
    </MemoryRouter>
  );
}

const keyResult = { id: 11, name: "Elevar permanencia", goals: [{ id: 3, name: "Graduación oportuna" }], strategicBets: [{ id: 4, name: "Apuesta digital" }] };

function screenData(detail: ProjectDetailResponse) {
  return { detail, contributionChain: undefined, keyResults: [keyResult], departments: [{ id: 2, name: "Ingenieria" }], periods: [{ id: 1, name: "2026-1" }] };
}

function setup(props: { projectId?: number } = {}) {
  const onBack = vi.fn();
  const view = render(<Host onBack={onBack} {...props} />);
  return { onBack, user: userEvent.setup(), ...view };
}

describe("ProjectDetailContent", () => {
  beforeAll(installRadixSelectPolyfills);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rol = "admin";
    mocks.load.mockResolvedValue(screenData(makeDetail({ linkedKeyResults: [makeLink()] })));
    mocks.updateStatus.mockResolvedValue(makeProject());
    mocks.remove.mockResolvedValue(undefined);
    mocks.listTeachers.mockResolvedValue([]);
  });

  it("shows a loading state first", async () => {
    setup();

    expect(screen.getByText("Cargando ficha de la iniciativa...")).toBeInTheDocument();
    expect(await screen.findByText("Laboratorio abierto")).toBeInTheDocument();
  });

  it("keeps waiting when the identifier is not a number", () => {
    setup({ projectId: Number.NaN });

    expect(screen.getByText("Cargando ficha de la iniciativa...")).toBeInTheDocument();
    expect(mocks.load).not.toHaveBeenCalled();
  });

  it("shows the load error and goes back", async () => {
    mocks.load.mockRejectedValue(new Error("Servicio caido"));
    const { onBack, user } = setup();

    expect(await screen.findByText("Servicio caido")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver a iniciativas" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("says when the initiative does not exist", async () => {
    mocks.load.mockResolvedValue({ detail: null, contributionChain: null, keyResults: [], departments: [], periods: [] });
    setup();

    expect(await screen.findByText("Iniciativa no encontrada.")).toBeInTheDocument();
  });

  it("closes from the top bar", async () => {
    const { onBack, user } = setup();
    await user.click(await screen.findByRole("button", { name: "Cerrar detalle de iniciativa" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("lists the history of progress from the most recent", async () => {
    mocks.load.mockResolvedValue(screenData(makeDetail({
      history: [
        makeEntry({ id: 1, comment: "Primero", createdAt: "2026-01-10T10:00:00Z" }),
        makeEntry({ id: 2, comment: "Segundo", createdAt: "2026-04-10T10:00:00Z" }),
      ],
    })));
    const { user } = setup();
    await user.click(await screen.findByRole("tab", { name: /Historial \(2\)/ }));

    const rows = within(await screen.findByRole("table", { name: "Historial de avances de la iniciativa" })).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Segundo");
    expect(rows[2]).toHaveTextContent("Primero");
  });

  it("changes the status and reloads the detail", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Cambiar a Finalizado" }));

    await waitFor(() => expect(mocks.updateStatus).toHaveBeenCalledWith(7, "FINALIZADO"));
    expect(toast.success).toHaveBeenCalledWith("Estado actualizado a Finalizado.");
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith(7, { force: true }));
  });

  it("reports a failed status change", async () => {
    mocks.updateStatus.mockRejectedValue(new Error("Transicion invalida"));
    const { user } = setup();
    await user.click(await screen.findByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Cambiar a Suspendido" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Transicion invalida"));
  });

  it("unlinks a key result after confirming and reloads silently", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("tab", { name: /Key Results/ }));
    await user.click((await screen.findAllByRole("button", { name: "Desvincular" }))[0]);
    await user.click(within(await screen.findByRole("dialog", { name: "Desvincular Key Result" })).getByRole("button", { name: "Desvincular" }));

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(1));
    expect(toast.success).toHaveBeenCalledWith("Vinculo desactivado.");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Desvincular Key Result" })).not.toBeInTheDocument());
    expect(mocks.load).toHaveBeenLastCalledWith(7, { force: true });
  });

  it("reports a failed unlink", async () => {
    mocks.remove.mockRejectedValue(new Error("No se pudo desvincular"));
    const { user } = setup();
    await user.click(await screen.findByRole("tab", { name: /Key Results/ }));
    await user.click((await screen.findAllByRole("button", { name: "Desvincular" }))[0]);
    await user.click(within(await screen.findByRole("dialog", { name: "Desvincular Key Result" })).getByRole("button", { name: "Desvincular" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo desvincular"));
  });

  it("cancels the unlink confirmation", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("tab", { name: /Key Results/ }));
    await user.click((await screen.findAllByRole("button", { name: "Desvincular" }))[0]);
    await user.click(within(await screen.findByRole("dialog", { name: "Desvincular Key Result" })).getByRole("button", { name: "Cancelar" }));

    expect(mocks.remove).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Desvincular Key Result" })).not.toBeInTheDocument();
  });

  it("manages the weight of a link in the same detail and returns after saving", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("tab", { name: /Key Results/ }));
    await user.click((await screen.findAllByRole("button", { name: "Gestionar peso" }))[0]);

    expect(await screen.findByRole("heading", { name: "Gestionar peso" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveValue(40);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByRole("tab", { name: /Key Results/ })).toBeInTheDocument();
  });

  it("links a new key result from the key results tab", async () => {
    mocks.load.mockResolvedValue(screenData(makeDetail()));
    const { user } = setup();
    await user.click(await screen.findByRole("tab", { name: /Key Results/ }));
    const linkButtons = await screen.findAllByRole("button", { name: "Vincular KR" });
    await user.click(linkButtons[linkButtons.length - 1]);

    expect(await screen.findByRole("heading", { name: "Vincular KR" })).toBeInTheDocument();
  });

  it("opens the hierarchy from the goal and the bet of a linked key result", async () => {
    const onOpenInHierarchy = vi.fn();
    render(<Host onBack={vi.fn()} onOpenInHierarchy={onOpenInHierarchy as never} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Ver en Meta" }));
    await user.click(screen.getByRole("button", { name: "Ver en Apuesta" }));

    expect(onOpenInHierarchy).toHaveBeenNthCalledWith(1, { rootType: "GOAL", rootId: 3, field: "initiative", text: "Laboratorio abierto" });
    expect(onOpenInHierarchy).toHaveBeenNthCalledWith(2, { rootType: "STRATEGIC_BET", rootId: 4, field: "initiative", text: "Laboratorio abierto" });
  });

  it("names a key result without a catalog entry by its description or number", async () => {
    mocks.load.mockResolvedValue({
      ...screenData(makeDetail({ kpis: { progressEntries: 0, linkedKeyResults: 2, declaredContributionWeight: 80, completed: false, overweightWarning: false }, linkedKeyResults: [makeLink({ keyResultId: 90, keyResultDescription: "Descripción propia" }), makeLink({ id: 2, keyResultId: 91, keyResultDescription: "" })] })),
      keyResults: [],
    });
    setup();

    const list = await screen.findByRole("list");
    expect(within(list).getByText("Descripción propia")).toBeInTheDocument();
    expect(within(list).getByText("KR-91")).toBeInTheDocument();
  });

  it("reloads when the identifier changes", async () => {
    const { rerender } = setup();
    await screen.findByText("Laboratorio abierto");
    rerender(<Host projectId={8} onBack={vi.fn()} />);

    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith(8, { force: undefined }));
  });

  describe("by role", () => {
    it("gives a manager the management actions", async () => {
      mocks.rol = "manager";
      setup();

      expect(await screen.findByRole("button", { name: "Editar iniciativa" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Responsables" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Vincular KR" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Registrar avance" })).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("lets a contributor only record progress", async () => {
      mocks.rol = "contributor";
      setup();

      expect(await screen.findByRole("button", { name: "Registrar avance" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Editar iniciativa" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Vincular KR" })).not.toBeInTheDocument();
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });

    it("gives a visitor a read-only detail", async () => {
      mocks.rol = "visitor";
      setup();

      expect(await screen.findByText("Laboratorio abierto")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Registrar avance" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Responsables" })).not.toBeInTheDocument();
    });

    it("does not offer progress on an initiative that is not active", async () => {
      mocks.load.mockResolvedValue(screenData(makeDetail({ project: makeProject({ status: "BORRADOR" }) })));
      setup();

      expect(await screen.findByRole("button", { name: "Editar iniciativa" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Registrar avance" })).not.toBeInTheDocument();
    });
  });
});
