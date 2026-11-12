import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { installRadixSelectPolyfills } from "../../../test/radixSelect";
import type { ProjectResponse } from "../../services/projectsApi";
import { LinkInitiativesPanel } from "./LinkInitiativesPanel";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error, warning: mocks.warning } }));
vi.mock("../../services/projectsApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../services/projectsApi")>();
  return {
    ...original,
    projectsApi: { ...original.projectsApi, list: mocks.list },
    projectKeyResultLinksApi: { ...original.projectKeyResultLinksApi, create: mocks.create },
  };
});

function project(id: number, name: string, extra: Partial<ProjectResponse> = {}): ProjectResponse {
  return { id, name, status: "EN_EJECUCION", startPeriod: "2026-1", departmentName: "Docencia", ...extra } as ProjectResponse;
}

const projects = [
  project(1, "Plataforma virtual"),
  project(2, "Tutorías", { departmentName: null, startPeriod: "2026-2" }),
  project(3, "Laboratorios", { departmentName: "Ingeniería", startPeriod: "" }),
  project(4, "Proyecto archivado", { status: "ARCHIVADO" }),
  project(5, "Ya vinculado"),
];

function setup(props: Partial<Parameters<typeof LinkInitiativesPanel>[0]> = {}) {
  const handlers = { onCancel: vi.fn(), onDirtyChange: vi.fn(), onSaved: vi.fn().mockResolvedValue(undefined) };
  render(<LinkInitiativesPanel keyResultId={9} linkedProjectIds={[5]} {...handlers} {...props} />);
  return handlers;
}

describe("LinkInitiativesPanel", () => {
  beforeAll(installRadixSelectPolyfills);
  beforeEach(() => {
    mocks.list.mockReset().mockResolvedValue(projects);
    mocks.create.mockReset().mockResolvedValue({ overweightWarning: false, totalWeightForKeyResult: 30 });
    Object.values(mocks).forEach((fn) => fn.mockClear());
  });

  it("offers only initiatives that are neither archived nor already linked", async () => {
    setup();
    expect(screen.getByText("Cargando iniciativas...")).toBeInTheDocument();
    expect(await screen.findByText("Plataforma virtual")).toBeInTheDocument();
    expect(screen.getByText(/PROY-1 · Docencia · 2026-1/)).toBeInTheDocument();
    expect(screen.getByText(/^PROY-2 · 2026-2$/)).toBeInTheDocument();
    expect(screen.getByText(/^PROY-3 · Ingeniería$/)).toBeInTheDocument();
    expect(screen.queryByText("Proyecto archivado")).not.toBeInTheDocument();
    expect(screen.queryByText("Ya vinculado")).not.toBeInTheDocument();
  });

  it("filters by name, code, department or period and explains an empty search", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Plataforma virtual");
    const search = screen.getByRole("textbox", { name: "Buscar iniciativa" });

    await user.type(search, "ingen");
    expect(screen.queryByText("Plataforma virtual")).not.toBeInTheDocument();
    expect(screen.getByText("Laboratorios")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "2026-2");
    expect(screen.getByText("Tutorías")).toBeInTheDocument();
    expect(screen.queryByText("Laboratorios")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "zzz");
    expect(screen.getByText("Sin resultados para la búsqueda.")).toBeInTheDocument();
  });

  it("says when nothing is available to link", async () => {
    mocks.list.mockResolvedValue([project(5, "Ya vinculado")]);
    setup();
    expect(await screen.findByText("No hay iniciativas disponibles para vincular.")).toBeInTheDocument();
  });

  it("reports a loading failure and shows no initiatives", async () => {
    mocks.list.mockRejectedValue(new Error("Servidor caído"));
    setup();
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Servidor caído"));
    expect(await screen.findByText("No hay iniciativas disponibles para vincular.")).toBeInTheDocument();
  });

  it("ignores a response that arrives after unmounting", async () => {
    let finish: (value: ProjectResponse[]) => void = () => undefined;
    mocks.list.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const handlers = { onCancel: vi.fn(), onDirtyChange: vi.fn(), onSaved: vi.fn() };
    const { unmount } = render(<LinkInitiativesPanel keyResultId={9} linkedProjectIds={[]} {...handlers} />);
    unmount();
    finish(projects);
    await Promise.resolve();
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it("keeps saving disabled until something is selected and counts the selection", async () => {
    const user = userEvent.setup();
    const { onDirtyChange } = setup();
    await screen.findByText("Plataforma virtual");
    expect(screen.getByRole("button", { name: "Guardar vínculo" })).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /Plataforma virtual/ }));
    expect(screen.getByText("1 seleccionada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar vínculo" })).toBeEnabled();
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));

    await user.click(screen.getByRole("checkbox", { name: /Tutorías/ }));
    expect(screen.getByText("2 seleccionadas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vincular 2 iniciativas" })).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /Plataforma virtual/ }));
    await user.click(screen.getByRole("checkbox", { name: /Tutorías/ }));
    expect(screen.queryByText(/seleccionada/)).not.toBeInTheDocument();
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));
  });

  it("links one initiative with the chosen weight and type", async () => {
    const user = userEvent.setup();
    const { onSaved } = setup();
    await user.click(await screen.findByRole("checkbox", { name: /Plataforma virtual/ }));
    const weight = screen.getByRole("spinbutton");
    await user.clear(weight);
    await user.type(weight, "45");
    await user.click(screen.getByRole("combobox", { name: "Tipo" }));
    await user.click(await screen.findByRole("option", { name: "Soporte" }));
    await user.click(screen.getByRole("button", { name: "Guardar vínculo" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.create).toHaveBeenCalledWith({ projectId: 1, keyResultId: 9, contributionWeight: 45, contributionType: "SOPORTE" });
    expect(mocks.success).toHaveBeenCalledWith("Iniciativa vinculada.");
  });

  it("keeps the weight between 0 and 100", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Plataforma virtual");
    const weight = screen.getByRole("spinbutton");
    await user.clear(weight);
    await user.type(weight, "250");
    expect(weight).toHaveValue(100);
    fireEvent.change(weight, { target: { value: "-5" } });
    expect(weight).toHaveValue(0);
  });

  it("links several initiatives and announces the total", async () => {
    const user = userEvent.setup();
    const { onSaved } = setup();
    await user.click(await screen.findByRole("checkbox", { name: /Plataforma virtual/ }));
    await user.click(screen.getByRole("checkbox", { name: /Tutorías/ }));
    await user.click(screen.getByRole("button", { name: "Vincular 2 iniciativas" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.create).toHaveBeenCalledTimes(2);
    expect(mocks.success).toHaveBeenCalledWith("2 iniciativas vinculadas.");
  });

  it("warns when the declared weights exceed the total instead of announcing success", async () => {
    mocks.create.mockResolvedValue({ overweightWarning: true, totalWeightForKeyResult: 130 });
    const user = userEvent.setup();
    const { onSaved } = setup();
    await user.click(await screen.findByRole("checkbox", { name: /Plataforma virtual/ }));
    await user.click(screen.getByRole("button", { name: "Guardar vínculo" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.warning).toHaveBeenCalledWith("Los pesos son declarativos. La suma actual es 130%.");
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it("reports which links failed and still finishes when some succeeded", async () => {
    mocks.create.mockResolvedValueOnce({ overweightWarning: false }).mockRejectedValueOnce(new Error("Ya existe el vínculo"));
    const user = userEvent.setup();
    const { onSaved } = setup();
    await user.click(await screen.findByRole("checkbox", { name: /Plataforma virtual/ }));
    await user.click(screen.getByRole("checkbox", { name: /Tutorías/ }));
    await user.click(screen.getByRole("button", { name: "Vincular 2 iniciativas" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.error).toHaveBeenCalledWith("Tutorías: Ya existe el vínculo");
    expect(mocks.success).toHaveBeenCalledWith("Iniciativa vinculada.");
  });

  it("stays open when every link fails", async () => {
    mocks.create.mockRejectedValue(new Error("Sin permiso"));
    const user = userEvent.setup();
    const { onSaved } = setup();
    await user.click(await screen.findByRole("checkbox", { name: /Plataforma virtual/ }));
    await user.click(screen.getByRole("button", { name: "Guardar vínculo" }));

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Plataforma virtual: Sin permiso"));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Guardar vínculo" })).toBeEnabled();
  });

  it("cancels from the top bar", async () => {
    const user = userEvent.setup();
    const { onCancel } = setup();
    await user.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("ignores a loading failure that arrives after unmounting", async () => {
    let fail: (reason: unknown) => void = () => undefined;
    mocks.list.mockReturnValue(new Promise((_, reject) => { fail = reject; }));
    const handlers = { onCancel: vi.fn(), onDirtyChange: vi.fn(), onSaved: vi.fn() };
    const { unmount } = render(<LinkInitiativesPanel keyResultId={9} linkedProjectIds={[]} {...handlers} />);
    unmount();
    fail(new Error("tarde"));
    await Promise.resolve();
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it("refuses to link when the key result is missing", async () => {
    const user = userEvent.setup();
    const { onSaved } = setup({ keyResultId: 0 });
    await user.click(await screen.findByRole("checkbox", { name: /Plataforma virtual/ }));
    await user.click(screen.getByRole("button", { name: "Guardar vínculo" }));

    expect(mocks.error).toHaveBeenCalledWith("Selecciona un Key Result.");
    expect(mocks.create).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
