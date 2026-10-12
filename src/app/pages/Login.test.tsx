import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Login } from "./Login";

const { authMeMock, ssoConfigMock } = vi.hoisted(() => ({
  authMeMock: vi.fn(),
  ssoConfigMock: vi.fn(),
}));

vi.mock("../services/authApi", async () => {
  const actual = await vi.importActual<typeof import("../services/authApi")>("../services/authApi");
  return {
    ...actual,
    authApi: { ...actual.authApi, me: authMeMock },
  };
});

vi.mock("../services/ssoApi", async () => {
  const actual = await vi.importActual<typeof import("../services/ssoApi")>("../services/ssoApi");
  return {
    ...actual,
    ssoApi: { ...actual.ssoApi, config: ssoConfigMock },
  };
});

function DashboardProbe() {
  const { usuario } = useAuth();
  return <p>Dashboard demo: {usuario?.rol}</p>;
}

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("Login demo access", () => {
  beforeEach(() => {
    sessionStorage.clear();
    authMeMock.mockReset().mockRejectedValue(new Error("backend unavailable"));
    ssoConfigMock.mockReset().mockResolvedValue({ enabled: false, providerName: "ICESI", scopes: [] });
  });

  it("offers one quick-access account for each supported role", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /acceso rápido demo/i }));

    expect(screen.getByRole("button", { name: /Hugo Arboleda.*Gestor estratégico/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Leonardo Bustamante.*Colaborador/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Profesor Demo.*Administrador/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Rocío Segovia/i })).not.toBeInTheDocument();
  });

  it("opens the selected demo role immediately when the backend is unavailable", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /acceso rápido demo/i }));
    await user.click(screen.getByRole("button", { name: /Hugo Arboleda/i }));

    expect(await screen.findByText("Dashboard demo: manager")).toBeInTheDocument();
    expect(sessionStorage.getItem("sgp_access_token")).toBe("mock-token-ha");
    expect(authMeMock).not.toHaveBeenCalled();
  });
});
