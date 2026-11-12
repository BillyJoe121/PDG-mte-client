import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DirectoryUser } from "../services/peopleApi";

const mocks = vi.hoisted(() => ({
  usuario: { id: "U1", rol: "admin" } as { id: string; rol: string },
  listUsers: vi.fn(),
  setActive: vi.fn(),
  accessLink: vi.fn(),
  removeUser: vi.fn(),
  listDepartments: vi.fn(),
  removeDepartment: vi.fn(),
  listSchools: vi.fn(),
  downloadCSV: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: mocks.usuario }) }));
vi.mock("../utils/exportUtils", () => ({ downloadCSV: mocks.downloadCSV, getDateStamp: () => "20260101" }));
vi.mock("../services/peopleApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/peopleApi")>();
  return {
    ...original,
    directoryUsersApi: { ...original.directoryUsersApi, list: mocks.listUsers, setActive: mocks.setActive, accessLink: mocks.accessLink, remove: mocks.removeUser },
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

import { Usuarios } from "./Usuarios";

function person(id: number, name: string, accessRole: string, extra: Partial<DirectoryUser> = {}): DirectoryUser {
  return { id, name, email: `${name.toLowerCase().replace(/\s/g, ".")}@icesi.edu.co`, departmentId: 1, departmentName: "Sistemas", accessRole, active: true, lastAccessAt: null, ...extra } as DirectoryUser;
}

const users = [
  person(1, "Ana Admin", "ADMIN", { lastAccessAt: "2026-03-01T10:00:00Z" }),
  person(2, "Beto Gestor", "MANAGER", { active: false, departmentId: 2, departmentName: "Industrial" }),
  person(3, "Carla Colaboradora", "CONTRIBUTOR"),
];

const rowOf = async (name: string) => (await screen.findByText(name)).closest("tr") as HTMLElement;

describe("Usuarios list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usuario = { id: "U1", rol: "admin" };
    mocks.listUsers.mockResolvedValue(users);
    mocks.listDepartments.mockResolvedValue([
      { id: 1, name: "Sistemas", schoolName: "Ingenieria", description: "Computacion" },
      { id: 2, name: "Industrial", schoolName: null, description: "" },
    ]);
    mocks.listSchools.mockResolvedValue([]);
    mocks.setActive.mockImplementation(async (id: number, active: boolean) => ({ ...users.find((entry) => entry.id === id), active }));
    mocks.removeUser.mockResolvedValue(undefined);
    mocks.removeDepartment.mockResolvedValue(undefined);
  });

  it("restricts the directory to administrators", () => {
    mocks.usuario = { id: "U2", rol: "contributor" };
    render(<Usuarios />);

    expect(screen.getByRole("heading", { name: "Acceso restringido" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Usuarios" })).not.toBeInTheDocument();
  });

  it("shows a loading state and then the users with their last access", async () => {
    render(<Usuarios />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando directorio");
    const row = await rowOf("Ana Admin");
    expect(within(row).getByText("AA")).toBeInTheDocument();
    expect(within(row).getByText("Activo")).toBeInTheDocument();
    expect(within(row).queryByText("Sin registro")).not.toBeInTheDocument();
    expect(within(await rowOf("Beto Gestor")).getByText("Inactivo")).toBeInTheDocument();
    expect(within(await rowOf("Beto Gestor")).getByText("Sin registro")).toBeInTheDocument();
  });

  it("reports a load error and retries", async () => {
    mocks.listUsers.mockRejectedValueOnce(new Error("Directorio caido")).mockRejectedValueOnce("falla");
    const user = userEvent.setup();
    render(<Usuarios />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Directorio caido");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("No se pudo completar la operación.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Ana Admin")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("filters by role, department, status and text", async () => {
    const user = userEvent.setup();
    render(<Usuarios />);
    await screen.findByText("Ana Admin");

    await user.selectOptions(screen.getByLabelText("Filtrar por rol"), "MANAGER");
    expect(screen.queryByText("Ana Admin")).not.toBeInTheDocument();
    expect(screen.getByText("Beto Gestor")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Filtrar por rol"), "ALL");

    await user.selectOptions(screen.getByLabelText("Filtrar por departamento"), "2");
    expect(screen.queryByText("Ana Admin")).not.toBeInTheDocument();
    expect(screen.getByText("Beto Gestor")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Filtrar por departamento"), "ALL");

    await user.selectOptions(screen.getByLabelText("Filtrar por estado"), "false");
    expect(screen.getByText("Beto Gestor")).toBeInTheDocument();
    expect(screen.queryByText("Ana Admin")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Filtrar por estado"), "true");
    expect(screen.queryByText("Beto Gestor")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Filtrar por estado"), "ALL");

    await user.type(screen.getByPlaceholderText("Nombre o correo"), "  CARLA.col ");
    expect(screen.getByText("Carla Colaboradora")).toBeInTheDocument();
    expect(screen.queryByText("Ana Admin")).not.toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText("Nombre o correo"));
    await user.type(screen.getByPlaceholderText("Nombre o correo"), "nadie");
    expect(screen.getByText("No hay usuarios que coincidan con los filtros.")).toBeInTheDocument();
  });

  it("exports the visible users", async () => {
    const user = userEvent.setup();
    render(<Usuarios />);
    await screen.findByText("Ana Admin");
    await user.selectOptions(screen.getByLabelText("Filtrar por rol"), "ADMIN");
    await user.click(screen.getByRole("button", { name: /Exportar/ }));

    expect(mocks.downloadCSV).toHaveBeenCalledWith(
      [{ ID: 1, Nombre: "Ana Admin", Correo: "ana.admin@icesi.edu.co", Rol: "Administrador", Departamento: "Sistemas", Estado: "Activo", UltimoAcceso: "2026-03-01T10:00:00Z" }],
      "Usuarios_MTE_20260101",
    );
    await user.selectOptions(screen.getByLabelText("Filtrar por rol"), "MANAGER");
    await user.click(screen.getByRole("button", { name: /Exportar/ }));
    expect(mocks.downloadCSV.mock.calls[1][0][0]).toMatchObject({ Estado: "Inactivo", UltimoAcceso: "Sin registro" });
  });

  it("deactivates and activates users", async () => {
    const user = userEvent.setup();
    render(<Usuarios />);

    await user.click(within(await rowOf("Ana Admin")).getByRole("button", { name: "Desactivar usuario" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Usuario desactivado"));
    expect(mocks.setActive).toHaveBeenCalledWith(1, false);

    await user.click(within(await rowOf("Beto Gestor")).getByRole("button", { name: "Activar usuario" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Usuario activado"));
    expect(mocks.setActive).toHaveBeenCalledWith(2, true);
  });

  it("reports a failed status change", async () => {
    mocks.setActive.mockRejectedValue(new Error("Sin permiso"));
    const user = userEvent.setup();
    render(<Usuarios />);
    await user.click(within(await rowOf("Ana Admin")).getByRole("button", { name: "Desactivar usuario" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Sin permiso"));
    expect(within(await rowOf("Ana Admin")).getByText("Activo")).toBeInTheDocument();
  });

  it("issues an access link, shows it and closes the dialog", async () => {
    let resolveLink: (value: unknown) => void = () => undefined;
    mocks.accessLink.mockReturnValue(new Promise((resolve) => { resolveLink = resolve; }));
    const user = userEvent.setup();
    render(<Usuarios />);
    const row = await rowOf("Ana Admin");
    await user.click(within(row).getByRole("button", { name: "Generar enlace de acceso" }));

    expect(within(row).getByRole("button", { name: "Generar enlace de acceso" })).toBeDisabled();
    resolveLink({ professorId: 1, email: "ana.admin@icesi.edu.co", url: "https://mte.test/acceso/abc", accountCreated: true });
    const dialog = await screen.findByRole("dialog", { name: "Enlace de acceso" });
    expect(within(dialog).getByDisplayValue("https://mte.test/acceso/abc")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Se creó la cuenta de Ana Admin");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(row).getByRole("button", { name: "Generar enlace de acceso" })).toBeEnabled();
  });

  it("reports a failed access link", async () => {
    mocks.accessLink.mockRejectedValue(new Error("Enlace no disponible"));
    const user = userEvent.setup();
    render(<Usuarios />);
    await user.click(within(await rowOf("Ana Admin")).getByRole("button", { name: "Generar enlace de acceso" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Enlace no disponible"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports a failed user deletion and keeps the row", async () => {
    mocks.removeUser.mockRejectedValue(new Error("Conserva responsabilidades"));
    const user = userEvent.setup();
    render(<Usuarios />);
    await user.click(within(await rowOf("Ana Admin")).getByRole("button", { name: "Eliminar usuario" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Conserva responsabilidades"));
    expect(screen.getByText("Ana Admin")).toBeInTheDocument();
  });

  it("lists the departments with fallbacks and deletes one", async () => {
    const user = userEvent.setup();
    render(<Usuarios />);
    await screen.findByText("Ana Admin");
    await user.click(screen.getByRole("tab", { name: "Departamentos" }));

    expect(await screen.findByText("Computacion")).toBeInTheDocument();
    expect(screen.getByText("Ingenieria")).toBeInTheDocument();
    expect(screen.getByText("Escuela sin nombre")).toBeInTheDocument();
    expect(screen.getByText("Sin descripción.")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Nombre o correo")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Eliminar departamento" })[1]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Departamento eliminado"));
    expect(mocks.removeDepartment).toHaveBeenCalledWith(2);
    expect(screen.queryByText("Industrial")).not.toBeInTheDocument();
  });

  it("reports a failed department deletion", async () => {
    mocks.removeDepartment.mockRejectedValue(new Error("Tiene usuarios"));
    const user = userEvent.setup();
    render(<Usuarios />);
    await screen.findByText("Ana Admin");
    await user.click(screen.getByRole("tab", { name: "Departamentos" }));
    await user.click((await screen.findAllByRole("button", { name: "Eliminar departamento" }))[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Tiene usuarios"));
    expect(screen.getByText("Sistemas")).toBeInTheDocument();
  });
});
