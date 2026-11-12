import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ usuario: null as unknown }));
const prefetch = vi.hoisted(() => vi.fn());

vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ usuario: auth.usuario }) }));
vi.mock("../routePrefetch", () => ({ prefetchScreens: prefetch }));
vi.mock("./Sidebar", () => ({ Sidebar: () => <div>sidebar</div> }));
vi.mock("./Header", () => ({ Header: () => <div>header</div> }));

import { AccessDenied } from "./AccessDenied";
import { Footer } from "./Footer";
import { Layout } from "./Layout";
import { RequirePermission } from "./RequirePermission";

function Where() {
  return <div>at:{useLocation().pathname}</div>;
}

const ADMIN = { id: "1", nombre: "Admin", correo: "admin@example.test", rol: "admin", iniciales: "AD" };

beforeEach(() => {
  auth.usuario = ADMIN;
  prefetch.mockReset();
});

describe("Layout", () => {
  function renderAt(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<Where />} />
          <Route element={<Layout />}>
            <Route path="*" element={<div>content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  it("redirects to login without a session", () => {
    auth.usuario = null;
    renderAt("/dashboard");

    expect(screen.getByText("at:/login")).toBeInTheDocument();
    expect(prefetch).not.toHaveBeenCalled();
  });

  it.each([
    ["/jerarquia", "app-scroll-purple"],
    ["/krs", "app-scroll-orange"],
    ["/proyectos", "app-scroll-green"],
    ["/consistencia", "app-scroll-black"],
    ["/dashboard", "app-scroll-default"],
  ])("accents the scroll area of %s", (path, cls) => {
    const { container } = renderAt(path);

    expect(screen.getByText("sidebar")).toBeInTheDocument();
    expect(screen.getByText("header")).toBeInTheDocument();
    expect(container.querySelector("main")).toHaveClass(cls);
    expect(prefetch).toHaveBeenCalledTimes(1);
  });
});

describe("RequirePermission", () => {
  function renderGuard() {
    return render(
      <MemoryRouter initialEntries={["/x"]}>
        <Routes>
          <Route path="/login" element={<Where />} />
          <Route path="/dashboard" element={<Where />} />
          <Route
            path="/x"
            element={
              <RequirePermission action="usuarios.manage">
                <div>secret</div>
              </RequirePermission>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("redirects anonymous visitors to login", () => {
    auth.usuario = null;
    renderGuard();

    expect(screen.getByText("at:/login")).toBeInTheDocument();
  });

  it("shows the content when the role is allowed", () => {
    renderGuard();

    expect(screen.getByText("secret")).toBeInTheDocument();
  });

  it("shows the denied screen and lets the user go back to the dashboard", async () => {
    auth.usuario = { ...ADMIN, rol: "visitor" };
    renderGuard();

    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    expect(screen.getByText("Acceso restringido")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ir al dashboard" }));
    expect(screen.getByText("at:/dashboard")).toBeInTheDocument();
  });
});

describe("static pieces", () => {
  it("renders the denied screen and the footer", () => {
    render(
      <MemoryRouter>
        <AccessDenied />
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Acceso restringido" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});

