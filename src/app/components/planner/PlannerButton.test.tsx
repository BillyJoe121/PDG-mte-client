import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerButton } from "./PlannerButton";

describe("PlannerButton", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders nothing when there is no Planner link", () => {
    const { container, rerender } = render(<PlannerButton plannerUrl={null} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<PlannerButton />);
    expect(container).toBeEmptyDOMElement();

    rerender(<PlannerButton plannerUrl="   " />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a link the API would not accept", () => {
    const { container } = render(<PlannerButton plannerUrl="javascript:alert(1)" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens the saved link in a new tab and does not bubble the click", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const onParentClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <PlannerButton plannerUrl="https://tasks.office.com/plan/1" />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ir a Planner/ }));

    expect(openSpy).toHaveBeenCalledWith("https://tasks.office.com/plan/1", "_blank", "noopener,noreferrer");
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
