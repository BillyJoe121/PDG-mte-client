import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DirectoryUser } from "../services/peopleApi";
import { Usuarios } from "./Usuarios";

const mocks = vi.hoisted(() => ({ listUsers: vi.fn(), listDepartments: vi.fn(), listSchools: vi.fn() }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ usuario: { id: "U1", nombre: "Admin", correo: "admin@icesi.edu.co", rol: "admin", iniciales: "AD" } }),
}));
vi.mock("../services/peopleApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/peopleApi")>();
  return { ...original, directoryUsersApi: { ...original.directoryUsersApi, list: mocks.listUsers } };
});
vi.mock("../services/strategicApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services/strategicApi")>();
  return {
    ...original,
    departmentsApi: { ...original.departmentsApi, list: mocks.listDepartments },
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

function stat(label: string) {
  return screen.getByText(label, { selector: "p" }).previousElementSibling?.textContent;
}

describe("Usuarios", () => {
  beforeEach(() => {
    mocks.listUsers.mockReset().mockResolvedValue(users);
    mocks.listDepartments.mockReset().mockResolvedValue([{ id: 1, name: "Sistemas" }]);
    mocks.listSchools.mockReset().mockResolvedValue([]);
  });

  it("counts users by role, including administrators and visitors", async () => {
    render(<Usuarios />);
    await screen.findByText("Ana Admin");

    expect(stat("Usuarios")).toBe("7");
    expect(stat("Activos")).toBe("6");
    expect(stat("Administradores")).toBe("2");
    expect(stat("Gestores")).toBe("1");
    expect(stat("Colaboradores")).toBe("1");
    expect(stat("Visitantes")).toBe("2");
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
});
