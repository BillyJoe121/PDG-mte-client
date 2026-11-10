import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioActual } from "../context/AuthContext";
import { Sidebar } from "./Sidebar";
import { useCompactSidebar } from "./sidebarCompact";

const auth = vi.hoisted(() => ({ usuario: null as UsuarioActual | null, logout: vi.fn(), apiLogout: vi.fn() }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ usuario: auth.usuario, login: vi.fn(), logout: auth.logout }),
}));

vi.mock("../services/authApi", () => ({
  authApi: { logout: auth.apiLogout, changePassword: vi.fn() },
  authErrorMessage: () => "",
}));

function CompactRequest({ active }: { active: boolean }) {
  useCompactSidebar(active);
  return null;
}

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={["/krs"]}>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe("Sidebar", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    auth.logout.mockReset();
    auth.apiLogout.mockReset().mockResolvedValue(undefined);
    auth.usuario = { id: "1", nombre: "Admin", correo: "admin@icesi.edu.co", rol: "admin", iniciales: "AD" };
  });

  it("no longer offers the retired Objetivos module", () => {
    renderSidebar();

    expect(screen.queryByRole("link", { name: /objetivos/i })).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/okrs"]')).toBeNull();
  });

  it("shows KRs and labels the project module as Iniciativas", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: "KRs" })).toHaveAttribute("href", "/krs");
    const initiatives = screen.getByRole("link", { name: "Iniciativas" });
    expect(initiatives).toHaveAttribute("href", "/proyectos");
    expect(screen.queryByRole("link", { name: /^proyectos$/i })).not.toBeInTheDocument();
  });

  it("closes the API session before clearing the local one", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: /Cerrar sesión/i }));

    expect(auth.apiLogout).toHaveBeenCalledTimes(1);
    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect(auth.apiLogout.mock.invocationCallOrder[0]).toBeLessThan(auth.logout.mock.invocationCallOrder[0]);
  });

  it("logs out locally even when the API cannot be reached", async () => {
    auth.apiLogout.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: /Cerrar sesión/i }));

    expect(auth.logout).toHaveBeenCalledTimes(1);
  });

  it("stays compact while a page asks for it and then returns to the person's choice", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MemoryRouter initialEntries={["/krs"]}>
        <Sidebar />
        <CompactRequest active />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Expandir menú" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expandir menú" }));
    expect(screen.getByRole("button", { name: "Colapsar menú" })).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={["/krs"]}>
        <Sidebar />
        <CompactRequest active={false} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Colapsar menú" })).toBeInTheDocument();
  });

  it("keeps a sidebar the person collapsed collapsed after the compact request ends", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MemoryRouter initialEntries={["/krs"]}>
        <Sidebar />
        <CompactRequest active={false} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: "Colapsar menú" }));

    rerender(
      <MemoryRouter initialEntries={["/krs"]}>
        <Sidebar />
        <CompactRequest active />
      </MemoryRouter>,
    );
    rerender(
      <MemoryRouter initialEntries={["/krs"]}>
        <Sidebar />
        <CompactRequest active={false} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Expandir menú" })).toBeInTheDocument();
  });

  it("opens the change-password dialog", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("button", { name: /Cambiar contraseña/i }));

    expect(screen.getByRole("dialog", { name: "Cambiar contraseña" })).toBeInTheDocument();
  });
});
