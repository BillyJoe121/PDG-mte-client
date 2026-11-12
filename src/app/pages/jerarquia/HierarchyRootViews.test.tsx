import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { EmptyState, HierarchyDetailHeader, HierarchyRootGallery } from "./HierarchyRootViews";

type Node = StrategicHierarchyNode;

const bet: Node = {
  nodeType: "STRATEGIC_BET",
  id: "1",
  label: "Apuesta de innovación",
  description: "Renovar la oferta académica.",
  badge: "Activa",
  executionSummary: { summaryText: "Va bien" } as Node["executionSummary"],
  children: [
    { nodeType: "GOAL", id: "2", label: "Meta", children: [{ nodeType: "KEY_RESULT", id: "3", label: "KR", children: [{ nodeType: "PROJECT", id: "4", label: "Ini", children: [] }] }] },
  ],
};
const goal: Node = { nodeType: "GOAL", id: "9", label: "Meta suelta", children: [] };

describe("HierarchyRootGallery", () => {
  it("lists roots with their description, badge and contained counts", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<HierarchyRootGallery nodes={[bet, goal]} onSelect={onSelect} />);

    expect(screen.getByRole("heading", { name: "Apuesta de innovación" })).toBeInTheDocument();
    expect(screen.getByText("Renovar la oferta académica.")).toBeInTheDocument();
    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByText(/Consulta su despliegue estrategico/)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button")[1]);
    expect(onSelect).toHaveBeenCalledWith(goal);
  });

  it("renders nothing for an empty list", () => {
    render(<HierarchyRootGallery nodes={[]} onSelect={vi.fn()} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

describe("HierarchyDetailHeader", () => {
  it("shows the root context, summary and manage/back actions for a bet", async () => {
    const user = userEvent.setup();
    const onManage = vi.fn();
    const onBack = vi.fn();
    render(<HierarchyDetailHeader node={bet} onManage={onManage} onBack={onBack} />);

    expect(screen.getByRole("heading", { name: "Apuesta de innovación" })).toBeInTheDocument();
    expect(screen.getByText("Va bien")).toBeInTheDocument();
    expect(screen.getByText("Activa")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Gestionar apuesta/ }));
    await user.click(screen.getByRole("button", { name: /Volver/ }));
    expect(onManage).toHaveBeenCalledWith(bet);
    expect(onBack).toHaveBeenCalled();
  });

  it("offers to manage a goal and shows a fallback when there is no summary", () => {
    render(<HierarchyDetailHeader node={goal} onManage={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Gestionar meta/ })).toBeInTheDocument();
    expect(screen.getByText("Sin resumen disponible")).toBeInTheDocument();
  });

  it("shows the recorded progress when the node carries it", () => {
    render(<HierarchyDetailHeader node={{ nodeType: "KEY_RESULT", id: "5", label: "KR", progressPercentage: 60, children: [] }} onManage={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText("Avance registrado")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders its text", () => {
    render(<EmptyState text="Nada por aquí" />);
    expect(screen.getByText("Nada por aquí")).toBeInTheDocument();
  });
});
