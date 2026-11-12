import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeSlide } from "../../../test/presentationFixtures";
import { PresentationSlideDeck } from "./PresentationSlideDeck";
import { PresentationSlideOverview } from "./PresentationSlideOverview";

const slides = [
  makeSlide("COVER", "Portada", {}, 1),
  makeSlide("CLOSING", "Cierre uno", { summaryText: "Uno" }, 2),
  makeSlide("CLOSING", "Cierre dos", { summaryText: "Dos" }, 3),
];

const thumb = (n: number) => screen.getByRole("button", { name: new RegExp(`^Ir a la diapositiva ${n}:`) });

function renderOverview(currentIndex = 1) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const view = render(
    <PresentationSlideOverview slides={slides} currentIndex={currentIndex} periodName="2026-1" onSelect={onSelect} onClose={onClose} />
  );
  return { ...view, onSelect, onClose, dialog: screen.getByRole("dialog", { name: "Vista de miniaturas" }) };
}

describe("PresentationSlideOverview", () => {
  it("focuses the current thumbnail and marks it", () => {
    renderOverview(1);
    expect(thumb(2)).toHaveFocus();
    expect(thumb(2)).toHaveAttribute("aria-current", "true");
    expect(thumb(1)).not.toHaveAttribute("aria-current");
    expect(screen.getByText("(3)")).toBeInTheDocument();
  });

  it("selects a slide and closes from the button", () => {
    const { onSelect, onClose } = renderOverview();
    fireEvent.click(thumb(3));
    expect(onSelect).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar miniaturas" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("moves between thumbnails with the arrow keys and clamps at the edges", () => {
    const { dialog } = renderOverview(1);
    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(thumb(3)).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "ArrowDown" });
    expect(thumb(3)).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "ArrowLeft" });
    expect(thumb(2)).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "ArrowUp" });
    fireEvent.keyDown(dialog, { key: "ArrowUp" });
    expect(thumb(1)).toHaveFocus();
  });

  it("jumps with Home and End and ignores unrelated keys", () => {
    const { dialog } = renderOverview(1);
    fireEvent.keyDown(dialog, { key: "End" });
    expect(thumb(3)).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Home" });
    expect(thumb(1)).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "x" });
    expect(thumb(1)).toHaveFocus();
  });

  it("ignores arrows while focus is outside the thumbnails", () => {
    const { dialog } = renderOverview(1);
    const close = screen.getByRole("button", { name: "Cerrar miniaturas" });
    close.focus();
    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(close).toHaveFocus();
  });

  it("keeps Tab inside the dialog", () => {
    const { dialog } = renderOverview(1);
    const close = screen.getByRole("button", { name: "Cerrar miniaturas" });
    // The close button is the first focusable control and the last thumbnail the final one.
    close.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(thumb(3)).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(close).toHaveFocus();
    // Tabbing from a middle control is left to the browser.
    thumb(2).focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(thumb(2)).toHaveFocus();
  });

  it("gives focus back to the opener when it unmounts", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = renderOverview(0);
    expect(thumb(1)).toHaveFocus();
    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it("copes with no active element when it opens", () => {
    const spy = vi.spyOn(document, "activeElement", "get").mockReturnValue(null);
    const { unmount } = renderOverview(0);
    spy.mockRestore();
    expect(() => unmount()).not.toThrow();
  });

  it("does not restore focus to a detached opener", () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = renderOverview(0);
    opener.remove();
    expect(() => unmount()).not.toThrow();
  });
});

describe("PresentationSlideDeck", () => {
  const baseProps = {
    slides,
    periodName: "2026-1",
    fullscreen: false,
    controlsVisible: true,
    overviewOpen: false,
    onToggleOverview: vi.fn(),
    onExit: vi.fn(),
  };

  it("shows a message when the current index has no slide", () => {
    render(<PresentationSlideDeck {...baseProps} slides={[]} currentIndex={0} onIndexChange={vi.fn()} />);
    expect(screen.getByText("No hay diapositivas registradas para este periodo.")).toBeInTheDocument();
  });

  it("moves to the previous and next slide without leaving the bounds", () => {
    const onIndexChange = vi.fn();
    const { rerender } = render(<PresentationSlideDeck {...baseProps} currentIndex={1} onIndexChange={onIndexChange} />);
    fireEvent.click(screen.getByRole("button", { name: /anterior/i }));
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(onIndexChange).toHaveBeenLastCalledWith(2);

    rerender(<PresentationSlideDeck {...baseProps} currentIndex={2} onIndexChange={onIndexChange} />);
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
  });

  it("renders the deck when the controls are hidden", () => {
    const { container } = render(<PresentationSlideDeck {...baseProps} currentIndex={0} controlsVisible={false} onIndexChange={vi.fn()} />);
    expect(container.querySelector(".presentation-deck")).toBeInTheDocument();
  });

  it("selects a thumbnail and closes the overview", () => {
    const onIndexChange = vi.fn();
    const onToggleOverview = vi.fn();
    render(<PresentationSlideDeck {...baseProps} currentIndex={0} overviewOpen onIndexChange={onIndexChange} onToggleOverview={onToggleOverview} />);
    fireEvent.click(thumb(3));
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(onToggleOverview).toHaveBeenCalledTimes(1);
  });
});
