import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlannerLinkField } from "./PlannerLinkField";

describe("PlannerLinkField", () => {
  it("always shows the row, with an empty state when there is no link", () => {
    render(<dl><PlannerLinkField plannerUrl={null} /></dl>);
    expect(screen.getByText("Enlace de Planner")).toBeInTheDocument();
    expect(screen.getByText("Sin enlace de Planner")).toBeInTheDocument();
  });

  it("offers the Planner button when the link is valid", () => {
    render(<dl><PlannerLinkField plannerUrl="https://tasks.office.com/plan/1" /></dl>);
    expect(screen.getByRole("button", { name: "Ir a Planner" })).toBeInTheDocument();
  });
});
