import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ApiError } from "../services/strategicApi";
import { Login } from "./Login";

const { loginMock, meMock } = vi.hoisted(() => ({ loginMock: vi.fn(), meMock: vi.fn() }));

vi.mock("../services/authApi", async () => {
  const actual = await vi.importActual<typeof import("../services/authApi")>("../services/authApi");
  return { ...actual, authApi: { ...actual.authApi, login: loginMock, me: meMock } };
});

function DashboardProbe() {
  const { usuario } = useAuth();
  return <p>Dashboard: {usuario?.correo} ({usuario?.rol})</p>;
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

async function submit(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText("Correo institucional"), email);
  if (password) await user.type(screen.getByLabelText("Contraseña"), password);
  await user.click(screen.getByRole("button", { name: /Ingresar al MTE/i }));
}

describe("Login", () => {
  beforeEach(() => {
    sessionStorage.clear();
    loginMock.mockReset();
    meMock.mockReset();
  });

  it("has no demo access or external sign-in", () => {
    renderLogin();

    expect(screen.queryByRole("button", { name: /demo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /SSO|institucional/i })).not.toBeInTheDocument();
  });

  it("signs in through the API, keeps the token outside the stored profile and opens the dashboard", async () => {
    loginMock.mockResolvedValue({ accessToken: "session-token", tokenType: "bearer", expiresIn: 3600, expiresAt: 4102444800 });
    meMock.mockResolvedValue({ user: { externalUserId: 7, email: "ana@icesi.edu.co", roles: ["VISITOR"], professorName: "Ana Ruiz" } });
    renderLogin();

    await submit("  ana@icesi.edu.co ", "una-clave-larga");

    expect(await screen.findByText("Dashboard: ana@icesi.edu.co (visitor)")).toBeInTheDocument();
    expect(loginMock).toHaveBeenCalledWith("ana@icesi.edu.co", "una-clave-larga");
    expect(meMock).toHaveBeenCalledWith("session-token");
    expect(sessionStorage.getItem("sgp_access_token")).toBe("session-token");
    const stored = JSON.parse(sessionStorage.getItem("sgp_session_user") ?? "{}");
    expect(stored).not.toHaveProperty("token");
    expect(stored.expiresAt).toBe(4102444800 * 1000);
  });

  it("shows the API message when the credentials are rejected", async () => {
    const message = "No pudimos iniciar sesión con esos datos. Después de 5 intentos fallidos la cuenta se bloquea 15 minutos.";
    loginMock.mockRejectedValue(new ApiError(message, 401));
    renderLogin();

    await submit("ana@icesi.edu.co", "clave-equivocada");

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(meMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("sgp_access_token")).toBeNull();
  });

  it("does not open a session when the account has no MTE access", async () => {
    loginMock.mockResolvedValue({ accessToken: "session-token", tokenType: "bearer", expiresIn: 3600, expiresAt: 0 });
    meMock.mockRejectedValue(new ApiError("Tu cuenta no tiene acceso al MTE. Habla con el administrador.", 403));
    renderLogin();

    await submit("ana@icesi.edu.co", "una-clave-larga");

    expect(await screen.findByRole("alert")).toHaveTextContent("no tiene acceso al MTE");
    expect(sessionStorage.getItem("sgp_session_user")).toBeNull();
  });

  it("explains a network failure without exposing technical detail", async () => {
    loginMock.mockRejectedValue(new TypeError("Failed to fetch"));
    renderLogin();

    await submit("ana@icesi.edu.co", "una-clave-larga");

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectar con el MTE");
  });

  it("asks for both fields before calling the API", async () => {
    renderLogin();

    await submit("ana@icesi.edu.co", "");

    expect(screen.getByRole("alert")).toHaveTextContent("Ingresa tu correo y tu contraseña.");
    expect(loginMock).not.toHaveBeenCalled();
  });
});
