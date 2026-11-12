import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ list: vi.fn(), assign: vi.fn(), remove: vi.fn(), professors: vi.fn(), roles: vi.fn() }));

vi.mock("../../services/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/projectsApi")>();
  return {
    ...actual,
    projectTeachersApi: { ...actual.projectTeachersApi, list: mocks.list, assign: mocks.assign, remove: mocks.remove },
    projectResponsibilityCatalogApi: { ...actual.projectResponsibilityCatalogApi, professors: mocks.professors, roles: mocks.roles },
  };
});

import { ProjectResponsiblesPanel } from "./ProjectResponsiblesPanel";

const assignment = { projectId: 7, projectName: "Lab", teacherId: 4, teacherName: "Marta Gil", roleId: 2, roleName: "Tutor", joinedAt: "2026-01-10", leftAt: null };

function setup(departmentId: number | null | undefined = 2) {
  const onBack = vi.fn();
  const onDirtyChange = vi.fn();
  render(<ProjectResponsiblesPanel projectId={7} departmentId={departmentId} onBack={onBack} onDirtyChange={onDirtyChange} />);
  return { onBack, onDirtyChange, user: userEvent.setup() };
}

async function fillAssignment(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText("Asignar responsable", { selector: "h2, h3, h4, span, div" });
  const [teacher, role] = screen.getAllByRole("combobox");
  await user.selectOptions(teacher, "9");
  await user.selectOptions(role, "3");
}

describe("ProjectResponsiblesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue([assignment, { ...assignment, teacherId: 5, teacherName: "Pablo Rey", leftAt: "2026-03-01" }]);
    mocks.professors.mockResolvedValue([{ id: 9, name: "Laura Mora", email: "laura@uni.edu", departmentId: 2, departmentName: "Ing" }]);
    mocks.roles.mockResolvedValue([{ id: 3, name: "Co-tutor" }]);
    mocks.assign.mockResolvedValue({});
    mocks.remove.mockResolvedValue(undefined);
  });

  it("shows a loading state and then the current and past assignments", async () => {
    setup();

    expect(screen.getByText(/Cargando responsables/)).toBeInTheDocument();
    expect(await screen.findByText("Marta Gil")).toBeInTheDocument();
    expect(screen.getByText("2026-01-10 — vigente")).toBeInTheDocument();
    expect(screen.getByText("2026-01-10 — 2026-03-01")).toBeInTheDocument();
    expect(mocks.professors).toHaveBeenCalledWith(2);
  });

  it("loads the professors without a department filter", async () => {
    setup(null);
    await screen.findByText("Marta Gil");

    expect(mocks.professors).toHaveBeenCalledWith(undefined);
  });

  it("explains when nobody is assigned", async () => {
    mocks.list.mockResolvedValue([]);
    setup();

    expect(await screen.findByText("Aún no hay responsables asignados.")).toBeInTheDocument();
  });

  it("shows the load error", async () => {
    mocks.list.mockRejectedValue(new Error("Servicio caido"));
    setup();

    expect(await screen.findByText("Servicio caido")).toBeInTheDocument();
  });

  it("requires a professor and a role", async () => {
    const { user } = setup();
    await screen.findByText("Marta Gil");
    await user.click(screen.getByRole("button", { name: "Asignar responsable" }));

    expect(toast.error).toHaveBeenCalledWith("Selecciona responsable, rol y fecha de inicio.");
    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it("rejects a leaving date earlier than the start date", async () => {
    const { user } = setup();
    await fillAssignment(user);
    fireEvent.change(screen.getByLabelText(/^Desde/), { target: { value: "2026-05-10" } });
    fireEvent.change(screen.getByLabelText(/^Hasta/), { target: { value: "2026-05-01" } });
    await user.click(screen.getByRole("button", { name: "Asignar responsable" }));

    expect(toast.error).toHaveBeenCalledWith("La fecha de retiro no puede ser anterior a la fecha de inicio.");
    expect(mocks.assign).not.toHaveBeenCalled();
  });

  it("assigns a responsible, resets the form and reloads", async () => {
    const { onDirtyChange, user } = setup();
    await fillAssignment(user);
    expect(onDirtyChange).toHaveBeenCalledWith(true);
    fireEvent.change(screen.getByLabelText(/^Desde/), { target: { value: "2026-05-01" } });
    fireEvent.change(screen.getByLabelText(/^Hasta/), { target: { value: "2026-06-01" } });
    await user.click(screen.getByRole("button", { name: "Asignar responsable" }));

    await waitFor(() => expect(mocks.assign).toHaveBeenCalledWith(7, { teacherId: 9, roleId: 3, joinedAt: "2026-05-01", leftAt: "2026-06-01" }));
    expect(toast.success).toHaveBeenCalledWith("Responsable asignado.");
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
    expect((await screen.findAllByRole("combobox"))[0]).toHaveValue("");
  });

  it("assigns without a leaving date", async () => {
    const { user } = setup();
    await fillAssignment(user);
    await user.click(screen.getByRole("button", { name: "Asignar responsable" }));

    await waitFor(() => expect(mocks.assign).toHaveBeenCalled());
    expect(mocks.assign.mock.calls[0][1]).toMatchObject({ leftAt: null });
  });

  it("reports a failed assignment", async () => {
    mocks.assign.mockRejectedValue(new Error("Ya asignado"));
    const { user } = setup();
    await fillAssignment(user);
    await user.click(screen.getByRole("button", { name: "Asignar responsable" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Ya asignado"));
  });

  it("withdraws a responsible and reloads", async () => {
    const { user } = setup();
    await screen.findByText("Marta Gil");
    await user.click(screen.getAllByRole("button", { name: "Retirar" })[0]);

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(7, 4, 2));
    expect(toast.success).toHaveBeenCalledWith("Responsable retirado.");
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
  });

  it("reports a failed withdrawal", async () => {
    mocks.remove.mockRejectedValue(new Error("No se pudo retirar"));
    const { user } = setup();
    await screen.findByText("Marta Gil");
    await user.click(screen.getAllByRole("button", { name: "Retirar" })[0]);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("No se pudo retirar"));
  });

  it("goes back", async () => {
    const { onBack, user } = setup();
    await user.click(screen.getByRole("button", { name: "Volver" }));

    expect(onBack).toHaveBeenCalled();
  });
});
