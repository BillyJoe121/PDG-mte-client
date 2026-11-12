import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ usuario: null as unknown }));

vi.mock("./context/AuthContext", () => ({ useAuth: () => ({ usuario: auth.usuario }) }));
vi.mock("./components/tutorial/TutorialHost", async () => {
  const { Outlet } = await import("react-router");
  return { TutorialHost: () => <Outlet /> };
});
vi.mock("./components/Layout", async () => {
  const { Outlet } = await import("react-router");
  return { Layout: () => <Outlet /> };
});
vi.mock("./pages/Login", () => ({ Login: () => <div>page-Login</div> }));
vi.mock("./pages/EstablecerContrasena", () => ({ EstablecerContrasena: () => <div>page-EstablecerContrasena</div> }));
vi.mock("./pages/Dashboard", () => ({ Dashboard: () => <div>page-Dashboard</div> }));
vi.mock("./pages/JerarquiaEstrategica", () => ({ JerarquiaEstrategica: () => <div>page-JerarquiaEstrategica</div> }));
vi.mock("./pages/Proyectos", () => ({ Proyectos: () => <div>page-Proyectos</div> }));
vi.mock("./pages/KRs", () => ({ KRs: () => <div>page-KRs</div> }));
vi.mock("./pages/Consistencia", () => ({ Consistencia: () => <div>page-Consistencia</div> }));
vi.mock("./pages/Usuarios", () => ({ Usuarios: () => <div>page-Usuarios</div> }));
vi.mock("./pages/Auditoria", () => ({ Auditoria: () => <div>page-Auditoria</div> }));
vi.mock("./pages/PresentacionDashboard", () => ({ PresentacionDashboard: () => <div>page-PresentacionDashboard</div> }));
vi.mock("./pages/NuevaApuesta", () => ({ NuevaApuesta: () => <div>page-NuevaApuesta</div> }));
vi.mock("./pages/NuevaMeta", () => ({ NuevaMeta: () => <div>page-NuevaMeta</div> }));
vi.mock("./pages/GestionApuesta", () => ({ GestionApuesta: () => <div>page-GestionApuesta</div> }));
vi.mock("./pages/GestionMeta", () => ({ GestionMeta: () => <div>page-GestionMeta</div> }));
vi.mock("./pages/NuevoProyecto", () => ({ NuevoProyecto: () => <div>page-NuevoProyecto</div> }));
vi.mock("./pages/Catalogos", () => ({ Catalogos: () => <div>page-Catalogos</div> }));

import { router } from "./routes";

const ADMIN = { id: "1", nombre: "Admin", correo: "admin@example.test", rol: "admin", iniciales: "AD" };

const CASES: Array<[string, string]> = [
  ["/login", "page-Login"],
  ["/establecer-contrasena", "page-EstablecerContrasena"],
  ["/presentacion", "page-PresentacionDashboard"],
  ["/dashboard", "page-Dashboard"],
  ["/dashboards", "page-Dashboard"],
  ["/jerarquia", "page-JerarquiaEstrategica"],
  ["/jerarquia/apuesta/nueva", "page-NuevaApuesta"],
  ["/jerarquia/meta/nueva", "page-NuevaMeta"],
  ["/jerarquia/apuestas/b1/gestionar", "page-GestionApuesta"],
  ["/jerarquia/metas/g1/gestionar", "page-GestionMeta"],
  ["/catalogos", "page-Catalogos"],
  ["/proyectos", "page-Proyectos"],
  ["/proyectos/nuevo", "page-NuevoProyecto"],
  ["/krs", "page-KRs"],
  ["/okrs", "page-KRs"],
  ["/okrs/x", "page-KRs"],
  ["/reportes", "page-PresentacionDashboard"],
  ["/consistencia", "page-Consistencia"],
  ["/usuarios", "page-Usuarios"],
  ["/auditoria", "page-Auditoria"],
  ["/desconocida", "page-Dashboard"],
  ["/", "page-Dashboard"],
];

describe("routes", () => {
  it.each(CASES)("resolves %s", async (path, expected) => {
    auth.usuario = ADMIN;
    // The shared router instance owns the route table; a memory router reuses it.
    const memory = createMemoryRouter(router.routes, { initialEntries: [path] });
    render(<RouterProvider router={memory} />);

    expect(await screen.findByText(expected)).toBeInTheDocument();
    memory.dispose();
  });

  it("sends an anonymous visitor of a protected page to the login redirect", async () => {
    auth.usuario = null;
    const memory = createMemoryRouter(router.routes, { initialEntries: ["/dashboard"] });
    render(<RouterProvider router={memory} />);

    expect(await screen.findByText("page-Login")).toBeInTheDocument();
    memory.dispose();
  });
});
