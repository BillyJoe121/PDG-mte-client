import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { DirectoryUser } from "../services/peopleApi";
import { chooseOption, installRadixSelectPolyfills } from "../../test/radixSelect";

const mocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  listDepartments: vi.fn(),
  createDepartment: vi.fn(),
  updateDepartment: vi.fn(),
  listSchools: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: { id: "U1", rol: "admin" } }) }));
vi.mock("../services/peopleApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/peopleApi")>();
  return { ...original, directoryUsersApi: { ...original.directoryUsersApi, list: mocks.listUsers, create: mocks.createUser, update: mocks.updateUser } };
});
vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return {
    ...original,
    departmentsApi: { ...original.departmentsApi, list: mocks.listDepartments, create: mocks.createDepartment, update: mocks.updateDepartment },
    schoolsApi: { ...original.schoolsApi, list: mocks.listSchools },
  };
});

import { Usuarios } from "./Usuarios";

const ana = { id: 1, name: "Ana Admin", email: "ana@icesi.edu.co", departmentId: 1, departmentName: "Sistemas", accessRole: "ADMIN", active: true, lastAccessAt: null } as DirectoryUser;
const departments = [
  { id: 1, name: "Sistemas", schoolId: 5, schoolName: "Ingenieria", description: "Computacion", externalDepartmentId: 77 },
  { id: 2, name: "Industrial", schoolId: 5, schoolName: "Ingenieria", description: "", externalDepartmentId: null },
];
const schools = [{ id: 5, name: "Ingenieria" }, { id: 6, name: "Derecho" }];

vi.setConfig({ testTimeout: 30000 });

async function openUsers() {
  const user = userEvent.setup();
  render(<Usuarios />);
  await screen.findByText("Ana Admin");
  return user;
}

async function openDepartments() {
  const user = await openUsers();
  await user.click(screen.getByRole("tab", { name: "Departamentos" }));
  await screen.findByText("Computacion");
  return user;
}

describe("Usuarios dialogs", () => {
  beforeAll(installRadixSelectPolyfills);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listUsers.mockResolvedValue([ana]);
    mocks.listDepartments.mockResolvedValue(departments);
    mocks.listSchools.mockResolvedValue(schools);
  });

  it("edits a user with the chosen role, department and status", async () => {
    mocks.updateUser.mockResolvedValue({ ...ana, name: "Ana Editada", accessRole: "VISITOR", departmentId: 2, departmentName: "Industrial", active: false });
    const user = await openUsers();
    await user.click(screen.getByRole("button", { name: "Editar usuario" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar usuario" });
    expect(within(dialog).getByLabelText("Nombre")).toHaveValue("Ana Admin");
    expect(within(dialog).getByLabelText("Usuario activo")).toBeChecked();

    await user.clear(within(dialog).getByLabelText("Nombre"));
    await user.type(within(dialog).getByLabelText("Nombre"), "Ana Editada");
    await chooseOption(user, "Rol de acceso", "Visitante");
    await chooseOption(user, "Departamento", "Industrial");
    await user.click(within(dialog).getByLabelText("Usuario activo"));
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith(1, { name: "Ana Editada", email: "ana@icesi.edu.co", departmentId: 2, accessRole: "VISITOR", active: false }));
    expect(toast.success).toHaveBeenCalledWith("Usuario actualizado");
    expect(await screen.findByText("Ana Editada")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the dialog open when saving a user fails", async () => {
    mocks.updateUser.mockRejectedValue(new Error("Correo duplicado"));
    const user = await openUsers();
    await user.click(screen.getByRole("button", { name: "Editar usuario" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Correo duplicado"));
    expect(screen.getByRole("dialog", { name: "Editar usuario" })).toBeInTheDocument();
  });

  it("creates a user without departments and asks to complete the form", async () => {
    mocks.listDepartments.mockResolvedValue([]);
    const user = await openUsers();
    await user.click(screen.getByRole("button", { name: "Nuevo usuario" }));
    const dialog = await screen.findByRole("dialog", { name: "Nuevo usuario" });
    await user.type(within(dialog).getByLabelText("Nombre"), "Nuevo");
    await user.type(within(dialog).getByLabelText("Correo institucional"), "nuevo@icesi.edu.co");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    expect(toast.error).toHaveBeenCalledWith("Completa nombre, correo y departamento.");
    expect(mocks.createUser).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("creates a department sorted alphabetically with the chosen school and external id", async () => {
    mocks.createDepartment.mockResolvedValue({ id: 9, name: "Humanidades", schoolId: 6, schoolName: "Derecho", description: "Letras", externalDepartmentId: 12 });
    const user = await openDepartments();
    await user.click(screen.getByRole("button", { name: /Nuevo departamento/ }));
    const dialog = await screen.findByRole("dialog", { name: "Nuevo departamento" });
    await user.type(within(dialog).getByLabelText("Nombre"), "  Humanidades ");
    await user.type(within(dialog).getByLabelText("Descripción"), " Letras ");
    await chooseOption(user, "Escuela", "Derecho");
    await user.type(within(dialog).getByLabelText("ID externo (opcional)"), "12");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mocks.createDepartment).toHaveBeenCalledWith({ name: "Humanidades", description: "Letras", schoolId: 6, externalDepartmentId: 12 }));
    expect(toast.success).toHaveBeenCalledWith("Departamento creado");
    const titles = (await screen.findAllByText(/^(Sistemas|Industrial|Humanidades)$/)).map((node) => node.textContent);
    expect(titles).toEqual(["Humanidades", "Industrial", "Sistemas"]);
  });

  it("creates a department without optional values using the first school", async () => {
    mocks.createDepartment.mockResolvedValue({ id: 9, name: "Otro", schoolId: 5, schoolName: "Ingenieria", description: "", externalDepartmentId: null });
    const user = await openDepartments();
    await user.click(screen.getByRole("button", { name: /Nuevo departamento/ }));
    const dialog = await screen.findByRole("dialog", { name: "Nuevo departamento" });
    await user.type(within(dialog).getByLabelText("Nombre"), "Otro");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mocks.createDepartment).toHaveBeenCalledWith({ name: "Otro", description: "", schoolId: 5, externalDepartmentId: null }));
  });

  it("requires a name and a school for a department", async () => {
    mocks.listSchools.mockResolvedValue([]);
    const user = await openDepartments();
    await user.click(screen.getByRole("button", { name: /Nuevo departamento/ }));
    const dialog = await screen.findByRole("dialog", { name: "Nuevo departamento" });
    await user.type(within(dialog).getByLabelText("Nombre"), "Sin escuela");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    expect(toast.error).toHaveBeenCalledWith("Completa nombre y escuela.");
    expect(mocks.createDepartment).not.toHaveBeenCalled();
  });

  it("edits a department and replaces it in place", async () => {
    mocks.updateDepartment.mockResolvedValue({ ...departments[0], name: "Sistemas II", externalDepartmentId: null });
    const user = await openDepartments();
    await user.click(screen.getAllByRole("button", { name: "Editar departamento" })[0]);
    const dialog = await screen.findByRole("dialog", { name: "Editar departamento" });
    expect(within(dialog).getByLabelText("ID externo (opcional)")).toHaveValue(77);
    await user.clear(within(dialog).getByLabelText("Nombre"));
    await user.type(within(dialog).getByLabelText("Nombre"), "Sistemas II");
    await user.clear(within(dialog).getByLabelText("ID externo (opcional)"));
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mocks.updateDepartment).toHaveBeenCalledWith(1, { name: "Sistemas II", description: "Computacion", schoolId: 5, externalDepartmentId: null }));
    expect(toast.success).toHaveBeenCalledWith("Departamento actualizado");
    expect(await screen.findByText("Sistemas II")).toBeInTheDocument();
  });

  it("keeps the department dialog open when saving fails", async () => {
    mocks.updateDepartment.mockRejectedValue(new Error("Nombre repetido"));
    const user = await openDepartments();
    await user.click(screen.getAllByRole("button", { name: "Editar departamento" })[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nombre repetido"));
    expect(screen.getByRole("dialog", { name: "Editar departamento" })).toBeInTheDocument();
  });
});
