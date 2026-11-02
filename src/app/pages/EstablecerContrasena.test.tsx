import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { ApiError } from "../services/strategicApi";
import { EstablecerContrasena } from "./EstablecerContrasena";

const { setPasswordMock } = vi.hoisted(() => ({ setPasswordMock: vi.fn() }));

vi.mock("../services/authApi", async () => {
  const actual = await vi.importActual<typeof import("../services/authApi")>("../services/authApi");
  return { ...actual, authApi: { ...actual.authApi, setPassword: setPasswordMock } };
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function renderPage(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/establecer-contrasena" element={<><EstablecerContrasena /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fill(password: string, confirmation: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Nueva contraseña"), password);
  await user.type(screen.getByLabelText("Confirma la contraseña"), confirmation);
  await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));
}

describe("EstablecerContrasena", () => {
  beforeEach(() => {
    setPasswordMock.mockReset();
  });

  it.each([
    ["/establecer-contrasena"],
    ["/establecer-contrasena?token_hash=abc123&type=otro"],
    ["/establecer-contrasena?token_hash=abc%20123&type=invite"],
  ])("refuses an incomplete or altered link: %s", (entry) => {
    renderPage(entry);

    expect(screen.getByRole("heading", { name: "Enlace incompleto" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nueva contraseña")).not.toBeInTheDocument();
  });

  it("titles the form by link type", () => {
    renderPage("/establecer-contrasena?token_hash=abc123&type=recovery");

    expect(screen.getByRole("heading", { name: "Define una nueva contraseña" })).toBeInTheDocument();
  });

  it.each([
    ["corta", "corta", "al menos 10 caracteres"],
    ["una-clave-larga", "otra-clave-larga", "no coinciden"],
  ])("validates before calling the API (%s)", async (password, confirmation, message) => {
    renderPage("/establecer-contrasena?token_hash=abc123&type=invite");

    await fill(password, confirmation);

    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(setPasswordMock).not.toHaveBeenCalled();
  });

  it("saves the password and removes the single-use token from the address", async () => {
    setPasswordMock.mockResolvedValue(undefined);
    renderPage("/establecer-contrasena?token_hash=abc_123-XYZ&type=invite");
    expect(screen.getByRole("heading", { name: "Crea tu contraseña" })).toBeInTheDocument();

    await fill("una-clave-larga", "una-clave-larga");

    expect(await screen.findByRole("heading", { name: "Contraseña guardada" })).toBeInTheDocument();
    expect(setPasswordMock).toHaveBeenCalledWith("abc_123-XYZ", "invite", "una-clave-larga");
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/establecer-contrasena$/);
    expect(screen.getByRole("link", { name: "Ir a iniciar sesión" })).toHaveAttribute("href", "/login");
  });

  it("shows the API message when the link was already used", async () => {
    setPasswordMock.mockRejectedValue(new ApiError("El enlace no es válido o ya venció. Pide uno nuevo al administrador.", 400));
    renderPage("/establecer-contrasena?token_hash=abc123&type=invite");

    await fill("una-clave-larga", "una-clave-larga");

    expect(await screen.findByRole("alert")).toHaveTextContent("ya venció");
    expect(screen.getByRole("button", { name: "Guardar contraseña" })).toBeEnabled();
  });
});
