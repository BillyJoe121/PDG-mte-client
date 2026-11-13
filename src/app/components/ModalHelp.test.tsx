import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal, ModalBody, ModalHeader } from "./Modal";

const help = {
  purpose: "Explica esta ventana.",
  actions: [{ label: "Guardar", effect: "Guarda los cambios." }],
  note: "Cerrar es definitivo.",
};

describe("Modal help", () => {
  it("toggles the help panel next to the close button without closing the modal", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose}>
        <ModalHeader title="Editar meta" onClose={onClose} help={help} />
        <ModalBody><p>Contenido</p></ModalBody>
      </Modal>,
    );

    const button = await screen.findByRole("button", { name: "Ayuda de esta ventana" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: "Ayuda de esta ventana" })).not.toBeInTheDocument();

    await user.click(button);
    const panel = screen.getByRole("region", { name: "Ayuda de esta ventana" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveTextContent("Guardar:");
    expect(panel).toHaveTextContent("Guarda los cambios.");
    expect(screen.getByRole("note")).toHaveTextContent("Cerrar es definitivo.");

    await user.click(screen.getByRole("button", { name: "Ocultar ayuda" }));
    expect(screen.queryByRole("region", { name: "Ayuda de esta ventana" })).not.toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Editar meta" })).toBeInTheDocument();
  });

  it("shows no help button when the modal has no help content", async () => {
    render(
      <Modal onClose={() => undefined}>
        <ModalHeader title="Editar meta" onClose={() => undefined} />
      </Modal>,
    );

    await screen.findByRole("dialog", { name: "Editar meta" });
    expect(screen.queryByRole("button", { name: "Ayuda de esta ventana" })).not.toBeInTheDocument();
  });
});
