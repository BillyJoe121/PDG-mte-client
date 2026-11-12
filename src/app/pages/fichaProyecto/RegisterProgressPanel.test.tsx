import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeProject } from "../../../test/projectFixtures";

const mocks = vi.hoisted(() => ({ registerProgress: vi.fn() }));

vi.mock("../../services/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/projectsApi")>();
  return { ...actual, projectsApi: { ...actual.projectsApi, registerProgress: mocks.registerProgress } };
});

import { RegisterProgressPanel } from "./RegisterProgressPanel";

function setup() {
  const onCancel = vi.fn();
  const onDirtyChange = vi.fn();
  const onSaved = vi.fn().mockResolvedValue(undefined);
  render(<RegisterProgressPanel project={makeProject({ globalProgress: 40 })} onCancel={onCancel} onDirtyChange={onDirtyChange} onSaved={onSaved} />);
  return { onCancel, onDirtyChange, onSaved, user: userEvent.setup() };
}

describe("RegisterProgressPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.registerProgress.mockResolvedValue({});
  });

  it("starts at the current progress of the initiative", () => {
    setup();

    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByLabelText("Avance global (%)")).toHaveValue(40);
    expect(screen.getByLabelText("Avance global (control deslizante)")).toHaveValue("40");
  });

  it("requires a comment", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Guardar avance" }));

    expect(screen.getByText("El comentario es obligatorio.")).toBeInTheDocument();
    expect(mocks.registerProgress).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Comentario"), "x");
    expect(screen.queryByText("El comentario es obligatorio.")).not.toBeInTheDocument();
  });

  it("keeps the number between zero and one hundred and follows the slider", () => {
    setup();
    const number = screen.getByLabelText("Avance global (%)");

    fireEvent.change(number, { target: { value: "180" } });
    expect(number).toHaveValue(100);
    fireEvent.change(number, { target: { value: "-4" } });
    expect(number).toHaveValue(0);
    fireEvent.change(screen.getByLabelText("Avance global (control deslizante)"), { target: { value: "62.5" } });
    expect(screen.getByText("62.5%")).toBeInTheDocument();
  });

  it("saves the progress with the milestones as a list", async () => {
    const { onSaved, onDirtyChange, user } = setup();
    fireEvent.change(screen.getByLabelText("Avance global (%)"), { target: { value: "75" } });
    await user.type(screen.getByLabelText("Comentario"), "  Se entregó el prototipo ");
    await user.type(screen.getByLabelText("Hito 1"), "Prototipo");
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    await user.type(screen.getByLabelText("Hito 2"), "   ");
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    await user.type(screen.getByLabelText("Hito 3"), "Pruebas");
    await user.click(screen.getByRole("button", { name: "Guardar avance" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mocks.registerProgress).toHaveBeenCalledWith(7, { progressPercent: 75, comment: "Se entregó el prototipo", milestones: "- Prototipo\n- Pruebas" });
    expect(toast.success).toHaveBeenCalledWith("Avance registrado.");
    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });

  it("sends no milestones when they are all blank", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("Comentario"), "Sin hitos");
    await user.click(screen.getByRole("button", { name: "Guardar avance" }));

    await waitFor(() => expect(mocks.registerProgress).toHaveBeenCalled());
    expect(mocks.registerProgress.mock.calls[0][1]).toMatchObject({ milestones: null });
  });

  it("removes milestones and resets the last one instead of deleting it", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    await user.type(screen.getByLabelText("Hito 1"), "Uno");
    await user.type(screen.getByLabelText("Hito 2"), "Dos");

    await user.click(screen.getAllByRole("button", { name: "Eliminar hito" })[0]);
    expect(screen.queryByLabelText("Hito 2")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Hito 1")).toHaveValue("Dos");

    await user.click(screen.getByRole("button", { name: "Eliminar hito" }));
    expect(screen.getByLabelText("Hito 1")).toHaveValue("");
  });

  it("reports a failed save", async () => {
    mocks.registerProgress.mockRejectedValue(new Error("Sin permiso"));
    const { onSaved, user } = setup();
    await user.type(screen.getByLabelText("Comentario"), "Intento");
    await user.click(screen.getByRole("button", { name: "Guardar avance" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Sin permiso"));
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("cancels the registration", async () => {
    const { onCancel, user } = setup();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalled();
  });
});
