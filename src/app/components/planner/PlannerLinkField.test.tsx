import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlannerLinkField } from "./PlannerLinkField";

describe("PlannerLinkField", () => {
  it("always shows the row, with an empty state when there is no link", () => {
    render(<dl><PlannerLinkField plannerUrl={null} /></dl>);
    expect(screen.getByText("Enlace de Planner")).toBeInTheDocument();
    expect(screen.getByText("Sin enlace de Planner")).toBeInTheDocument();
  });

  it("shows a valid link as a clickable address that opens in a new tab", () => {
    render(<dl><PlannerLinkField plannerUrl="https://tasks.office.com/plan/1" /></dl>);
    const link = screen.getByRole("link", { name: /Abrir el plan en Microsoft Planner/ });
    expect(link).toHaveAttribute("href", "https://tasks.office.com/plan/1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent("https://tasks.office.com/plan/1");
  });

  it("does not link an invalid saved address", () => {
    render(<dl><PlannerLinkField plannerUrl="https://example.com/no-planner" /></dl>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("El enlace guardado no es un enlace válido de Planner.")).toBeInTheDocument();
  });
});
