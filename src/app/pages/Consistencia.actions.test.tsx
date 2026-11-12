import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  usuario: { rol: "admin" } as { rol: string } | null,
  reduce: false,
  load: vi.fn(),
  navigate: vi.fn(),
  exportCsv: vi.fn(),
}));

vi.mock("motion/react", async (importOriginal) => ({ ...(await importOriginal<typeof import("motion/react")>()), useReducedMotion: () => mocks.reduce }));
vi.mock("react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: mocks.usuario }) }));
vi.mock("../services/screenDataCache", () => ({ loadConsistencyCheck: mocks.load }));
vi.mock("../services/consistencyApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/consistencyApi")>();
  return { ...original, consistencyApi: { ...original.consistencyApi, exportCsv: mocks.exportCsv } };
});
vi.mock("./proyectos/ProjectDetailModal", () => ({
  ProjectDetailModal: ({ projectId, onClose, onOpenInHierarchy }: { projectId: number; onClose: () => void; onOpenInHierarchy: (focus: unknown) => void }) => (
    <div role="dialog" aria-label={`Iniciativa ${projectId}`}>
      <button type="button" onClick={onClose}>Cerrar iniciativa</button>
      <button type="button" onClick={() => onOpenInHierarchy({ rootType: "GOAL", rootId: 3, field: "initiative", text: "Lab" })}>Ver en jerarquia</button>
    </div>
  ),
}));
vi.mock("./okrs/KeyResultDetailModal", () => ({
  KeyResultDetailModal: ({ keyResultId, canEdit, onClose, onOpenInHierarchy }: { keyResultId: number; canEdit: boolean; onClose: () => void; onOpenInHierarchy: (focus: unknown) => void }) => (
    <div role="dialog" aria-label={`KR ${keyResultId}`} data-can-edit={String(canEdit)}>
      <button type="button" onClick={onClose}>Cerrar KR</button>
      <button type="button" onClick={() => onOpenInHierarchy({ rootType: "STRATEGIC_BET", rootId: 4, field: "indicator", text: "Cobertura" })}>Ver KR en jerarquia</button>
    </div>
  ),
}));

import { Consistencia } from "./Consistencia";

const base = {
  type: "X", severity: "ALTA", module: "PROYECTOS", entityType: "PROJECT", entityId: 7, entityCode: "PRJ-7",
  entityName: "Iniciativa sin KR", description: "Sin KR asociado.", recommendedAction: "Asociar un KR.",
  actionLabel: "Abrir iniciativa", actionUrl: "/proyectos?projectId=7", detectedAt: "2026-11-01T10:00:00Z",
};
const findings = [
  { ...base, id: "a" },
  { ...base, id: "b", module: "INDICADORES", severity: "BAJA", entityCode: "KR-2", entityName: "Indicador viejo", actionLabel: "Abrir KR", actionUrl: "/krs?keyResultId=2", recommendedAction: undefined },
  { ...base, id: "c", module: "OTRO", severity: "MEDIA", entityCode: undefined, entityName: "Cosa rara", description: "Descripcion rara", actionLabel: "Abrir cosa", actionUrl: "/proyectos?projectId=9" },
];
const response = { summary: { total: 3, high: 1, medium: 1, low: 1 }, findings };

describe("Consistencia actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usuario = { rol: "admin" };
    mocks.reduce = false;
    mocks.load.mockResolvedValue(response);
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows the counters per severity and module", async () => {
    render(<Consistencia />);
    await screen.findByText("Cosa rara");

    expect(screen.getByText("Hallazgos")).toBeInTheDocument();
    expect(screen.getByText("Severidad media")).toBeInTheDocument();
    expect(screen.getByText("Severidad baja")).toBeInTheDocument();
    for (const label of ["Key Results", "Iniciativas", "OTRO"]) {
      expect(screen.getAllByText(label).some((node) => node.tagName !== "OPTION")).toBe(true);
    }
  });

  it("asks the API again with the chosen severity and module", async () => {
    const user = userEvent.setup();
    render(<Consistencia />);
    await screen.findByText("Cosa rara");

    await user.selectOptions(screen.getByLabelText("Filtrar por severidad"), "ALTA");
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith({ staleDays: 15, severity: "ALTA", module: undefined }, { force: undefined }));
    await user.selectOptions(screen.getByLabelText("Filtrar por módulo"), "INDICADORES");
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith({ staleDays: 15, severity: "ALTA", module: "INDICADORES" }, { force: undefined }));
  });

  it("matches the search against every field of a finding and resets the filters", async () => {
    const user = userEvent.setup();
    render(<Consistencia />);
    await screen.findByText("Cosa rara");

    await user.type(screen.getByPlaceholderText("Buscar hallazgo"), "  descripcion rara ");
    expect(screen.queryByText("Indicador viejo")).not.toBeInTheDocument();
    expect(screen.getByText("Cosa rara")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(screen.getByPlaceholderText("Buscar hallazgo")).toHaveValue("");
    expect(screen.getByText("Indicador viejo")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Buscar hallazgo"), "KR-2");
    expect(screen.getByText("Indicador viejo")).toBeInTheDocument();
    expect(screen.queryByText("Cosa rara")).not.toBeInTheDocument();
  });

  it("opens a project in place and sends the hierarchy focus to the router", async () => {
    const user = userEvent.setup();
    render(<Consistencia />);
    await user.click((await screen.findAllByRole("button", { name: "Abrir iniciativa" }))[0]);
    await user.click(await screen.findByRole("button", { name: "Ver en jerarquia" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/jerarquia?vista=tabla&columna=GOAL%3A3&iniciativa=Lab");
  });

  it("opens a key result and lets administrators and managers edit it", async () => {
    const user = userEvent.setup();
    render(<Consistencia />);
    await user.click(await screen.findByRole("button", { name: "Abrir KR" }));

    expect(await screen.findByRole("dialog", { name: "KR 2" })).toHaveAttribute("data-can-edit", "true");
    await user.click(screen.getByRole("button", { name: "Ver KR en jerarquia" }));
    expect(mocks.navigate).toHaveBeenCalledWith("/jerarquia?vista=tabla&columna=STRATEGIC_BET%3A4&indicador=Cobertura");
    await user.click(screen.getByRole("button", { name: "Cerrar KR" }));
    await waitFor(() => expect(mocks.load).toHaveBeenLastCalledWith(expect.anything(), { force: true }));
  });

  it.each([["manager", "true"], ["contributor", "false"], [null, "false"]])("sets KR edition for %s to %s", async (rol, expected) => {
    mocks.usuario = rol ? { rol } : null;
    const user = userEvent.setup();
    render(<Consistencia />);
    await user.click(await screen.findByRole("button", { name: "Abrir KR" }));

    expect(await screen.findByRole("dialog", { name: "KR 2" })).toHaveAttribute("data-can-edit", expected);
  });

  describe("export", () => {
    it("downloads the CSV with the current filters", async () => {
      mocks.exportCsv.mockResolvedValue(new Blob(["a,b"]));
      const create = vi.fn(() => "blob:csv");
      const revoke = vi.fn();
      Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
      const user = userEvent.setup();
      render(<Consistencia />);
      await screen.findByText("Cosa rara");
      await user.click(screen.getByRole("button", { name: "Exportar" }));

      await waitFor(() => expect(click).toHaveBeenCalled());
      expect(mocks.exportCsv).toHaveBeenCalledWith({ staleDays: 15, severity: undefined, module: undefined });
      expect(create).toHaveBeenCalled();
      expect(revoke).toHaveBeenCalledWith("blob:csv");
      await waitFor(() => expect(screen.getByRole("button", { name: "Exportar" })).toBeEnabled());
    });

    it("reports a failed export with any kind of error", async () => {
      mocks.exportCsv.mockRejectedValueOnce({ message: "Sin acceso" }).mockRejectedValueOnce({});
      const user = userEvent.setup();
      render(<Consistencia />);
      await screen.findByText("Cosa rara");

      await user.click(screen.getByRole("button", { name: "Exportar" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("Sin acceso");
      await user.click(screen.getByRole("button", { name: "Exportar" }));
      await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar la consistencia estrategica."));
    });
  });

  it("shows the generic error when the failure carries no message", async () => {
    mocks.load.mockRejectedValue(42);
    render(<Consistencia />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar la consistencia estrategica.");
  });

  it("shows the loading state before the data arrives", async () => {
    let finish: (value: unknown) => void = () => undefined;
    mocks.load.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<Consistencia />);

    expect(screen.getByRole("button", { name: "Exportar" })).toBeDisabled();
    expect(screen.queryByText("Hallazgos")).not.toBeInTheDocument();
    await act(async () => finish(response));
    expect(await screen.findByText("Cosa rara")).toBeInTheDocument();
  });

  it("renders without animations when the user prefers reduced motion", async () => {
    mocks.reduce = true;
    mocks.load.mockRejectedValueOnce(new Error("Falla"));
    render(<Consistencia />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Falla");
    fireEvent.change(screen.getByPlaceholderText("Buscar hallazgo"), { target: { value: "x" } });
    expect(screen.queryByText("Cosa rara")).not.toBeInTheDocument();
  });
});
