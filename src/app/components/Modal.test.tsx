import { act, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { useDirtyReport, useDiscardGuard } from "../hooks/useDiscardGuard";
import { ConfirmDialog, useConfirm } from "./ConfirmDialog";
import { Modal, ModalBody, ModalHeader } from "./Modal";

describe("Modal", () => {
  it("exposes a named dialog, traps focus inside it and closes with Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose}>
        <ModalHeader title="Editar meta" onClose={onClose} />
        <ModalBody><input aria-label="Nombre" /></ModalBody>
      </Modal>,
    );

    const dialog = await screen.findByRole("dialog", { name: "Editar meta" });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("returns focus to the control that opened it", async () => {
    function Host() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Abrir</button>
          {open && <Modal label="Detalle" onClose={() => setOpen(false)}><p>Contenido</p></Modal>}
        </>
      );
    }
    const user = userEvent.setup();
    render(<Host />);

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await screen.findByRole("dialog", { name: "Detalle" });
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.getByRole("button", { name: "Abrir", hidden: true })).toHaveFocus());
  });

  it("closes on a press on the overlay but not on one inside the panel", async () => {
    const onClose = vi.fn();
    render(<Modal label="Detalle" onClose={onClose}><p>Contenido</p></Modal>);

    const dialog = await screen.findByRole("dialog", { name: "Detalle" });
    fireEvent.mouseDown(within(dialog).getByText("Contenido"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(dialog.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("lets Escape close only the top dialog when one is nested in another", async () => {
    const user = userEvent.setup();
    const onCloseOuter = vi.fn();
    const onCancel = vi.fn();
    render(
      <Modal label="Detalle" onClose={onCloseOuter}>
        <ConfirmDialog title="Archivar" description="Se archivará." confirmLabel="Archivar" onCancel={onCancel} onConfirm={vi.fn()} />
      </Modal>,
    );

    await screen.findByRole("dialog", { name: "Archivar" });
    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCloseOuter).not.toHaveBeenCalled();
  });
});

describe("ConfirmDialog", () => {
  it("shows the refusal message and starts on Cancelar", async () => {
    render(<ConfirmDialog title="Archivar" description="Se archivará." confirmLabel="Archivar" error="Tiene iniciativas." onCancel={vi.fn()} onConfirm={vi.fn()} />);

    const dialog = await screen.findByRole("dialog", { name: "Archivar" });
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Tiene iniciativas.");
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Cancelar" })).toHaveFocus());
  });

  it("cannot be dismissed while the action is running", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog title="Archivar" description="Se archivará." confirmLabel="Archivar" saving onCancel={onCancel} onConfirm={vi.fn()} />);

    await screen.findByRole("dialog", { name: "Archivar" });
    await user.keyboard("{Escape}");

    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe("useConfirm", () => {
  function Harness({ onResult }: { onResult: (accepted: boolean) => void }) {
    const { confirm, confirmDialog } = useConfirm();
    return (
      <>
        <button type="button" onClick={() => void confirm({ title: "Eliminar", description: "No se puede deshacer.", confirmLabel: "Eliminar" }).then(onResult)}>Abrir</button>
        {confirmDialog}
      </>
    );
  }

  it.each([["Eliminar", true], ["Cancelar", false]] as const)("resolves when pressing %s", async (buttonName, expected) => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(<Harness onResult={onResult} />);

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    const dialog = await screen.findByRole("dialog", { name: "Eliminar" });
    await user.click(within(dialog).getByRole("button", { name: buttonName }));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(expected));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("useDiscardGuard", () => {
  function Harness({ onLeave }: { onLeave: () => void }) {
    const guard = useDiscardGuard();
    return (
      <>
        <button type="button" onClick={() => guard.setDirty(true)}>Ensuciar</button>
        <button type="button" onClick={() => guard.run(onLeave)}>Salir</button>
        {guard.dialog}
      </>
    );
  }

  it("runs the action at once when nothing changed", async () => {
    const user = userEvent.setup();
    const onLeave = vi.fn();
    render(<Harness onLeave={onLeave} />);

    await user.click(screen.getByRole("button", { name: "Salir" }));

    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks first when there are unsaved changes, and only leaves after Descartar", async () => {
    const user = userEvent.setup();
    const onLeave = vi.fn();
    render(<Harness onLeave={onLeave} />);

    await user.click(screen.getByRole("button", { name: "Ensuciar" }));
    await user.click(screen.getByRole("button", { name: "Salir" }));
    const first = await screen.findByRole("dialog", { name: "Descartar cambios" });
    await user.click(within(first).getByRole("button", { name: "Cancelar" }));
    expect(onLeave).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Salir" }));
    const second = await screen.findByRole("dialog", { name: "Descartar cambios" });
    await user.click(within(second).getByRole("button", { name: "Descartar" }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});

describe("useDirtyReport", () => {
  it("is clean at the start, dirty on a change, clean again when restored and when unmounted", () => {
    const onDirtyChange = vi.fn();
    const { rerender, unmount } = renderHook(({ value }) => useDirtyReport({ name: value }, onDirtyChange), { initialProps: { value: "Meta" } });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);

    rerender({ value: "Meta editada" });
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);

    rerender({ value: "Meta" });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);

    rerender({ value: "Otra" });
    act(() => unmount());
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });
});
