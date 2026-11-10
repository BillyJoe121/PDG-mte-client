import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DirectoryUser } from "../services/peopleApi";
import { Usuarios } from "./Usuarios";

const mocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  removeUser: vi.fn(),
  listDepartments: vi.fn(),
  removeDepartment: vi.fn(),
  listSchools: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ usuario: { id: "U1", nombre: "Admin", correo: "admin@icesi.edu.co", rol: "admin", iniciales: "AD" } }),
}));
vi.mock("../services/peopleApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/peopleApi")>();
  return {
    ...original,
    directoryUsersApi: { ...original.directoryUsersApi, list: mocks.listUsers, create: mocks.createUser, update: mocks.updateUser, remove: mocks.removeUser },
  };
});
vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return {
    ...original,
    departmentsApi: { ...original.departmentsApi, list: mocks.listDepartments, remove: mocks.removeDepartment },
    schoolsApi: { ...original.schoolsApi, list: mocks.listSchools },
  };
});

function person(id: number, name: string, accessRole: string, active = true): DirectoryUser {
  return { id, name, email: `${name.toLowerCase().replace(/\s/g, ".")}@icesi.edu.co`, departmentId: 1, departmentName: "Sistemas", accessRole, active } as DirectoryUser;
}

const users = [
  person(1, "Ana Admin", "ADMIN"),
  person(2, "Beto Admin", "ADMIN", false),
  person(3, "Carla Gestora", "MANAGER"),
  person(4, "Dario Colaborador", "CONTRIBUTOR"),
  person(5, "Eva Visitante", "VISITOR"),
  person(6, "Fede Visitante", "VISITOR"),
  person(7, "Gina Auditora", "AUDITOR"),
];

describe("Usuarios", () => {
  beforeEach(() => {
    mocks.listUsers.mockReset().mockResolvedValue(users);
    mocks.listDepartments.mockReset().mockResolvedValue([{ id: 1, name: "Sistemas" }]);
    mocks.listSchools.mockReset().mockResolvedValue([]);
    mocks.createUser.mockReset();
    mocks.updateUser.mockReset();
    mocks.removeUser.mockReset().mockResolvedValue(undefined);
    mocks.removeDepartment.mockReset().mockResolvedValue(undefined);
    vi.mocked(toast.error).mockReset();
  });

  it("disables the access link for inactive users only", async () => {
    render(<Usuarios />);
    const active = (await screen.findByText("Ana Admin")).closest("tr") as HTMLElement;
    const inactive = screen.getByText("Beto Admin").closest("tr") as HTMLElement;

    expect(within(active).getByRole("button", { name: "Generar enlace de acceso" })).toBeEnabled();
    expect(within(inactive).getByRole("button", { name: "Generar enlace de acceso" })).toBeDisabled();
  });

  it("shows an unknown role as received", async () => {
    render(<Usuarios />);
    const row = (await screen.findByText("Gina Auditora")).closest("tr") as HTMLElement;

    expect(within(row).getByText("AUDITOR")).toBeInTheDocument();
    expect(within(screen.getByText("Carla Gestora").closest("tr") as HTMLElement).getByText("Gestor estratégico")).toBeInTheDocument();
  });

  it("deletes a user only after the confirmation dialog is accepted", async () => {
    const user = userEvent.setup();
    render(<Usuarios />);
    const row = (await screen.findByText("Ana Admin")).closest("tr") as HTMLElement;

    await user.click(within(row).getByRole("button", { name: "Eliminar usuario" }));
    const dialog = await screen.findByRole("dialog", { name: "Eliminar usuario" });
    expect(dialog).toHaveTextContent("¿Eliminar a Ana Admin? Esta acción se bloqueará si conserva responsabilidades.");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.removeUser).not.toHaveBeenCalled();

    await user.click(within(row).getByRole("button", { name: "Eliminar usuario" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(mocks.removeUser).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText("Ana Admin")).not.toBeInTheDocument());
  });

  it("deletes a department only after the confirmation dialog is accepted", async () => {
    const user = userEvent.setup();
    render(<Usuarios />);
    await screen.findByText("Ana Admin");
    await user.click(screen.getByRole("tab", { name: "Departamentos" }));

    await user.click(screen.getByRole("button", { name: "Eliminar departamento" }));
    const dialog = await screen.findByRole("dialog", { name: "Eliminar departamento" });
    expect(dialog).toHaveTextContent("¿Eliminar el departamento Sistemas?");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(mocks.removeDepartment).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Eliminar departamento" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(mocks.removeDepartment).toHaveBeenCalledWith(1));
  });

  it("validates the user form, closes with Escape and saves a new user", async () => {
    const user = userEvent.setup();
    mocks.createUser.mockResolvedValue(person(8, "Hugo Nuevo", "CONTRIBUTOR"));
    render(<Usuarios />);
    await screen.findByText("Ana Admin");

    await user.click(screen.getByRole("button", { name: "Nuevo usuario" }));
    let dialog = await screen.findByRole("dialog", { name: "Nuevo usuario" });
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(toast.error).toHaveBeenCalledWith("Completa nombre, correo y departamento.");
    expect(mocks.createUser).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nuevo usuario" }));
    dialog = await screen.findByRole("dialog", { name: "Nuevo usuario" });
    await user.type(within(dialog).getByLabelText("Nombre"), "Hugo Nuevo");
    await user.type(within(dialog).getByLabelText("Correo institucional"), "hugo.nuevo@icesi.edu.co");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mocks.createUser).toHaveBeenCalledWith({
      name: "Hugo Nuevo",
      email: "hugo.nuevo@icesi.edu.co",
      departmentId: 1,
      accessRole: "CONTRIBUTOR",
      active: true,
    }));
    expect(await screen.findByText("Hugo Nuevo")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
