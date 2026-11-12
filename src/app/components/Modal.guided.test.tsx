import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ guided: false }));
vi.mock("./tutorial/guidedTour", () => ({ isGuidedTourOpen: () => mocks.guided }));

import { Modal, ModalHeader } from "./Modal";

function Harness({ onClose, label }: { onClose: () => void; label?: string }) {
  return (
    <Modal onClose={onClose} label={label}>
      <ModalHeader title="Detalle" onClose={onClose} />
      <button type="button">Dentro</button>
    </Modal>
  );
}

describe("Modal during a guided tour and focus restore", () => {
  afterEach(() => { mocks.guided = false; });

  it("ignores Escape and keeps focus where it was while a tour is open", async () => {
    mocks.guided = true;
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<><button type="button">Afuera</button><Harness onClose={onClose} /></>);

    screen.getByRole("button", { name: "Afuera" }).focus();
    await user.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Afuera" })).toHaveFocus();
  });

  it("does not close when the card behind the overlay is pressed, but closes on the overlay itself", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Dentro" }));
    expect(onClose).not.toHaveBeenCalled();

    const overlay = screen.getByRole("dialog").parentElement as HTMLElement;
    await user.pointer({ keys: "[MouseLeft]", target: overlay });
    expect(onClose).toHaveBeenCalled();
  });

  it("returns focus to the opener after closing", async () => {
    const user = userEvent.setup();
    function Opener() {
      return <OpenerInner />;
    }
    const { useState } = await import("react");
    function OpenerInner() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Abrir</button>
          {open && <Harness label="Titulo oculto" onClose={() => setOpen(false)} />}
        </>
      );
    }
    render(<Opener />);

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Abrir" })).toHaveFocus());
  });
});
