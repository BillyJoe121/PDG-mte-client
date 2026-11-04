import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { AccessLinkDialog } from "./AccessLinkDialog";

const link = {
  professorId: 8,
  email: "ana@icesi.edu.co",
  url: "https://mte.example/establecer-contrasena?token_hash=abc&type=invite",
  accountCreated: true,
};

describe("AccessLinkDialog", () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  afterEach(() => vi.restoreAllMocks());

  it("stays closed without a link", () => {
    render(<AccessLinkDialog link={null} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the link and explains that the MTE sends no email", () => {
    render(<AccessLinkDialog link={link} personName="Ana Ruiz" onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toHaveTextContent("Se creó la cuenta de Ana Ruiz");
    expect(screen.getByLabelText("Enlace para ana@icesi.edu.co")).toHaveValue(link.url);
    expect(screen.getByText(/no envía correos/)).toBeInTheDocument();
  });

  it("describes a reset when the account already existed", () => {
    render(<AccessLinkDialog link={{ ...link, accountCreated: false }} personName="Ana Ruiz" onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toHaveTextContent("Ana Ruiz define una nueva contraseña");
  });

  it("names the dialog and closes with its button or Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AccessLinkDialog link={link} onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "Enlace de acceso" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar modal" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("copies the link to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(<AccessLinkDialog link={link} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Copiar" }));

    expect(writeText).toHaveBeenCalledWith(link.url);
    expect(toast.success).toHaveBeenCalledWith("Enlace copiado");
  });

  it("asks for a manual copy when the clipboard is blocked", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    render(<AccessLinkDialog link={link} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Copiar" }));

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("cópialo manualmente"));
  });
});
