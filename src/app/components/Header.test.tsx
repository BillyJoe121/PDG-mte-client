import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    usuario: { id: "1", nombre: "Ana Admin", correo: "ana@icesi.edu.co", rol: "admin", iniciales: "AA" },
  }),
}));

vi.mock("./ContextualHelp", () => ({ ContextualHelp: () => null }));
vi.mock("./PlatformTutorial", () => ({ PlatformTutorial: () => null }));

describe("Header", () => {
  it("does not render hardcoded notifications", () => {
    render(
      <MemoryRouter initialEntries={["/krs"]}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Key Results" })).toBeInTheDocument();
    expect(screen.queryByTitle(/notificaciones/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/notificaciones/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cumplimiento/i)).not.toBeInTheDocument();
  });

  it("shows the user's initials with the role label", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByTitle("Ana Admin · Administrador")).toHaveTextContent("AA");
  });
});
