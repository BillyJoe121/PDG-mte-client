import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlannerButton } from "./PlannerButton";

const url = "https://tasks.office.com/plan/1";

describe("PlannerButton appearance", () => {
  it("uses the larger padding and icon for the medium size", () => {
    render(<PlannerButton plannerUrl={url} size="md" variant="solid" />);
    const button = screen.getByRole("button", { name: /Ir a Planner/ });
    expect(button.style.padding).toBe("8px 14px");
    expect(button.querySelector("svg")).toHaveAttribute("width", "14");
  });

  it("can hide the icon and accepts extra class, style and variants", () => {
    const { rerender } = render(<PlannerButton plannerUrl={url} showIcon={false} className="extra" style={{ margin: "2px" }} variant="subtle" />);
    const button = screen.getByRole("button");
    expect(button.querySelector("svg")).toBeNull();
    expect(button).toHaveClass("extra");
    expect(button.style.margin).toBe("2px");
    expect(button.style.padding).toBe("5px 10px");

    rerender(<PlannerButton plannerUrl={url} variant="badge" />);
    expect(screen.getByRole("button").style.fontSize).toBe("9px");
    expect(screen.getByRole("button").querySelector("svg")).toHaveAttribute("width", "12");
  });
});
