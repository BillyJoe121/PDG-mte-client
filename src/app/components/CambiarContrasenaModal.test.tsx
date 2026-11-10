import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { ApiError } from "../services/strategicApi";
import { CambiarContrasenaModal } from "./CambiarContrasenaModal";

const { changePasswordMock } = vi.hoisted(() => ({ changePasswordMock: vi.fn() }));

vi.mock("../services/authApi", async () => {
  const actual = await vi.importActual<typeof import("../services/authApi")>("../services/authApi");
  return { ...actual, authApi: { ...actual.authApi, changePassword: changePasswordMock } };
});

async function fill(current: string, next: string, confirmation: string) {
  const user = userEvent.setup();
  if (current) await user.type(screen.getByLabelText("Contraseña actual"), current);
  if (next) await user.type(screen.getByLabelText("Nueva contraseña"), next);
  if (confirmation) await user.type(screen.getByLabelText("Confirma la nueva contraseña"), confirmation);
  await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));
}

describe("CambiarContrasenaModal", () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    changePasswordMock.mockReset();
    onOpenChange.mockReset();
    vi.mocked(toast.success).mockReset();
  });

  it.each([
    ["", "una-clave-larga", "una-clave-larga", "Ingresa tu contraseña actual."],
    ["clave-actual-1", "clave-actual-1", "clave-actual-1", "La nueva contraseña debe ser distinta de la actual."],
    ["clave-actual-1", "corta", "corta", "al menos 10 caracteres"],
    ["clave-actual-1", "una-clave-larga", "otra-clave-larga", "no coinciden"],
  ])("validates locally (%s → %s)", async (current, next, confirmation, message) => {
    render(<CambiarContrasenaModal open onOpenChange={onOpenChange} />);

    await fill(current, next, confirmation);

    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("stays closed until it is opened", () => {
    render(<CambiarContrasenaModal open={false} onOpenChange={onOpenChange} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes with Cancelar, its close button or Escape", async () => {
    const user = userEvent.setup();
    render(<CambiarContrasenaModal open onOpenChange={onOpenChange} />);

    expect(screen.getByRole("dialog", { name: "Cambiar contraseña" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Cerrar modal" }));
    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledTimes(3);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("cannot be dismissed while the change is in flight", async () => {
    const user = userEvent.setup();
    changePasswordMock.mockReturnValue(new Promise(() => undefined));
    render(<CambiarContrasenaModal open onOpenChange={onOpenChange} />);

    await fill("clave-actual-1", "una-clave-larga", "una-clave-larga");
    expect(await screen.findByRole("button", { name: "Guardando…" })).toBeDisabled();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("changes the password, confirms it and closes", async () => {
    changePasswordMock.mockResolvedValue(undefined);
    render(<CambiarContrasenaModal open onOpenChange={onOpenChange} />);

    await fill("clave-actual-1", "una-clave-larga", "una-clave-larga");

    expect(changePasswordMock).toHaveBeenCalledWith("clave-actual-1", "una-clave-larga");
    expect(toast.success).toHaveBeenCalledWith("Contraseña actualizada. Úsala en tu próximo ingreso.");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps the dialog open with the API message when the current password is wrong", async () => {
    changePasswordMock.mockRejectedValue(new ApiError("La contraseña actual no es correcta.", 400));
    render(<CambiarContrasenaModal open onOpenChange={onOpenChange} />);

    await fill("clave-erronea", "una-clave-larga", "una-clave-larga");

    expect(await screen.findByRole("alert")).toHaveTextContent("La contraseña actual no es correcta.");
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
