import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";
import { makeLink, makeProject } from "../../../test/projectFixtures";
import { chooseOption, installRadixSelectPolyfills } from "../../../test/radixSelect";

const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), remove: vi.fn() }));

vi.mock("sonner", () => ({ Toaster: () => null, toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

vi.mock("../../services/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/projectsApi")>();
  return { ...actual, projectKeyResultLinksApi: { ...actual.projectKeyResultLinksApi, ...mocks } };
});

import { LinkKeyResultPanel } from "../fichaProyecto/KeyResultLinkForm";
import { KeyResultLinkModal } from "./KeyResultLinkModal";

const keyResults = [
  { id: 11, name: "Permanencia", description: "", metric: "Porcentaje", goals: [{ id: 1, name: "Meta A" }], strategicBets: [], academicPeriodName: "2026-1" },
  { id: 12, name: "", description: "Retención de estudiantes", metric: "Tasa", goals: [], strategicBets: [] },
  { id: 13, name: "Cobertura", description: "", metric: "Alcance", goals: [], strategicBets: [{ id: 2, name: "Apuesta digital" }] },
] as unknown as KeyResult[];

const linked = { linkId: 5, keyResultId: 11, keyResultName: "Permanencia", keyResultDescription: "", contributionWeight: 40, contributionType: "DIRECTA" as const, active: true };

async function pickKeyResult(user: ReturnType<typeof userEvent.setup>, option: RegExp | string) {
  await user.click(screen.getByRole("combobox", { name: "Key Result" }));
  await user.click(await screen.findByRole("option", { name: option }));
}

vi.setConfig({ testTimeout: 30000 });

describe("KeyResultLinkModal", () => {
  beforeAll(installRadixSelectPolyfills);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue(makeLink());
    mocks.remove.mockResolvedValue(undefined);
  });

  function setup(project = makeProject()) {
    const onChanged = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<KeyResultLinkModal keyResults={keyResults} project={project} onChanged={onChanged} onClose={onClose} />);
    return { onChanged, onClose, user: userEvent.setup() };
  }

  it("rejects saving without a key result", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Guardar vínculo" }));

    expect(toast.error).toHaveBeenCalledWith("Selecciona un Key Result.");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("links the chosen key result with the entered weight and type", async () => {
    const { onChanged, onClose, user } = setup();
    await pickKeyResult(user, /^13 - Cobertura/);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "150" } });
    expect(screen.getByRole("spinbutton")).toHaveValue(100);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "55" } });
    await chooseOption(user, "Tipo", "Indirecta");
    await user.click(screen.getByRole("button", { name: "Guardar vínculo" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.create).toHaveBeenCalledWith({ projectId: 7, keyResultId: 13, contributionWeight: 55, contributionType: "INDIRECTA" });
    expect(toast.success).toHaveBeenCalledWith("Vinculo creado.");
    expect(onChanged).toHaveBeenCalled();
  });

  it("warns when the declared weights exceed the total", async () => {
    mocks.create.mockResolvedValue(makeLink({ overweightWarning: true, totalWeightForKeyResult: 130 }));
    const { onClose, user } = setup();
    await pickKeyResult(user, /^12 - Retención/);
    await user.click(screen.getByRole("button", { name: "Guardar vínculo" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast.warning).toHaveBeenCalledWith("Los pesos son declarativos. La suma actual es 130%.");
  });

  it("reports an API failure and keeps the form open", async () => {
    mocks.create.mockRejectedValue(new Error("Vinculo duplicado"));
    const { onClose, user } = setup();
    await pickKeyResult(user, /^12 - Retención/);
    await user.click(screen.getByRole("button", { name: "Guardar vínculo" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Vinculo duplicado"));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Guardar vínculo" })).toBeEnabled();
  });

  it("filters the key results with the search box and explains an empty result", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("combobox", { name: "Key Result" }));
    await user.type(await screen.findByRole("textbox", { name: "Buscar Key Result" }), "digital");

    expect(screen.getByRole("option", { name: /Cobertura/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Permanencia/ })).not.toBeInTheDocument();

    await user.clear(screen.getByRole("textbox", { name: "Buscar Key Result" }));
    await user.type(screen.getByRole("textbox", { name: "Buscar Key Result" }), "zzzz");
    expect(await screen.findByRole("option", { name: "Sin resultados" })).toBeInTheDocument();
  });

  it("hides the key results that are already linked and lists the current links", () => {
    setup(makeProject({ linkedKeyResults: [linked, { ...linked, linkId: 6, keyResultId: 12, keyResultName: "", contributionType: "SOPORTE", active: false }] }));

    const list = screen.getByRole("list");
    expect(within(list).getByText("Permanencia")).toBeInTheDocument();
    expect(within(list).getByText("40% - Directa - Activo")).toBeInTheDocument();
    expect(within(list).getByText("KR 12")).toBeInTheDocument();
    expect(within(list).getByText("40% - Soporte - Inactivo")).toBeInTheDocument();
  });

  it("does not offer an active link again", async () => {
    const { user } = setup(makeProject({ linkedKeyResults: [linked] }));
    await user.click(screen.getByRole("combobox", { name: "Key Result" }));

    expect(await screen.findByRole("option", { name: /^13 - Cobertura/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /^11 - Permanencia/ })).not.toBeInTheDocument();
  });

  it("unlinks after confirming", async () => {
    const { onChanged, user } = setup(makeProject({ linkedKeyResults: [linked] }));
    await user.click(screen.getByRole("button", { name: "Desvincular" }));
    await user.click(within(screen.getByRole("dialog", { name: "Desvincular Key Result" })).getByRole("button", { name: "Desvincular" }));

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(5));
    expect(toast.success).toHaveBeenCalledWith("Vinculo desactivado.");
    expect(onChanged).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Desvincular Key Result" })).not.toBeInTheDocument());
  });

  it("keeps the link when the confirmation is cancelled", async () => {
    const { user } = setup(makeProject({ linkedKeyResults: [linked] }));
    await user.click(screen.getByRole("button", { name: "Desvincular" }));
    await user.click(within(screen.getByRole("dialog", { name: "Desvincular Key Result" })).getByRole("button", { name: "Cancelar" }));

    expect(mocks.remove).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Desvincular Key Result" })).not.toBeInTheDocument();
  });

  it("reports a failed unlink and keeps the confirmation open", async () => {
    mocks.remove.mockRejectedValue(new Error("No se pudo desvincular"));
    const { user } = setup(makeProject({ linkedKeyResults: [linked] }));
    await user.click(screen.getByRole("button", { name: "Desvincular" }));
    await user.click(within(screen.getByRole("dialog", { name: "Desvincular Key Result" })).getByRole("button", { name: "Desvincular" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo desvincular"));
    expect(screen.getByRole("dialog", { name: "Desvincular Key Result" })).toBeInTheDocument();
  });

  it("closes from Cancelar", async () => {
    const { onClose, user } = setup();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("LinkKeyResultPanel", () => {
  beforeAll(installRadixSelectPolyfills);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue(makeLink());
    mocks.update.mockResolvedValue(makeLink({ contributionWeight: 70 }));
  });

  it("creates a link and reports the form as dirty once it changes", async () => {
    const onSaved = vi.fn().mockResolvedValue(undefined);
    const onDirtyChange = vi.fn();
    const user = userEvent.setup();
    render(<LinkKeyResultPanel project={makeProject()} keyResults={keyResults} onSaved={onSaved} onCancel={vi.fn()} onDirtyChange={onDirtyChange} />);

    expect(screen.getByRole("heading", { name: "Vincular KR" })).toBeInTheDocument();
    await pickKeyResult(user, /^11 - Permanencia \(Meta A, 2026-1\)/);
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole("button", { name: "Guardar vínculo" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.create).toHaveBeenCalledWith({ projectId: 7, keyResultId: 11, contributionWeight: 30, contributionType: "DIRECTA" });
  });

  it("edits only the weight of an existing link", async () => {
    const onSaved = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <LinkKeyResultPanel
        project={makeProject({ linkedKeyResults: [linked] })}
        keyResults={keyResults}
        editingLinkId={5}
        initialKeyResultId="11"
        initialWeight={40}
        initialContributionType="SOPORTE"
        onSaved={onSaved}
        onCancel={vi.fn()}
        onDirtyChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Gestionar peso" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Key Result" })).toBeDisabled();
    expect(screen.queryByRole("combobox", { name: "Tipo" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "70" } });
    await user.click(screen.getByRole("button", { name: "Actualizar peso" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.update).toHaveBeenCalledWith(5, { contributionWeight: 70, contributionType: "SOPORTE" });
    expect(toast.success).toHaveBeenCalledWith("Peso del vinculo actualizado.");
  });

  it("cancels the edition", async () => {
    const onCancel = vi.fn();
    render(<LinkKeyResultPanel project={makeProject()} keyResults={keyResults} onSaved={vi.fn()} onCancel={onCancel} onDirtyChange={vi.fn()} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
