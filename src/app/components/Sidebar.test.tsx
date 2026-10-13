import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsuarioActual } from "../context/AuthContext";
import { Sidebar } from "./Sidebar";

const auth = vi.hoisted(() => ({ usuario: null as UsuarioActual | null }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ usuario: auth.usuario, login: vi.fn(), logout: vi.fn() }),
}));

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
});
