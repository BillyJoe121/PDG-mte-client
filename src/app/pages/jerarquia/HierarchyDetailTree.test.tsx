import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { StrategicHierarchyNode } from "../../services/strategicApi";
import { HierarchyDetailTree } from "./HierarchyDetailTree";
import { getTreeNodeKey } from "./hierarchyPageModel";

type Node = StrategicHierarchyNode;

const summary = { summaryText: "Resumen", completedKeyResults: 1, inProgressKeyResults: 2, inProgressProjects: 3 } as Node["executionSummary"];

const root: Node = {
  nodeType: "STRATEGIC_BET",
  id: "1",
  label: "Apuesta",
  children: [
    {
      nodeType: "GOAL",
      id: "2",
      label: "Meta A",
      description: "Descripción meta",
      badge: "Cupos",
      children: [
        { nodeType: "KEY_RESULT", id: "3", label: "KR uno", progressPercentage: 40, executionSummary: summary, children: [{ nodeType: "PROJECT", id: "4", label: "Iniciativa uno", children: [] }] },
      ],
    },
    { nodeType: "GOAL", id: "5", label: "Meta B", children: [] },
  ],
};

function Harness({ onManage, onCreateChild, createChildLabel }: { onManage: (node: Node) => void; onCreateChild?: () => void; createChildLabel?: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  return <HierarchyDetailTree root={root} expanded={expanded} onToggle={toggle} onManage={onManage} onCreateChild={onCreateChild} createChildLabel={createChildLabel} />;
}

describe("HierarchyDetailTree", () => {
  it("shows direct children grouped, and expands/collapses a node on click", async () => {
    const user = userEvent.setup();
    render(<Harness onManage={vi.fn()} />);

    expect(screen.getByText("2 elementos directos")).toBeInTheDocument();
    expect(screen.getByText("Metas")).toBeInTheDocument();
    expect(screen.queryByText("KR uno")).not.toBeInTheDocument();

    const metaA = screen.getByRole("button", { name: /Meta A/ });
    expect(metaA).toHaveAttribute("aria-expanded", "false");
    await user.click(metaA);
    expect(await screen.findByText("KR uno")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("KRs cerrados 1")).toBeInTheDocument();
    expect(screen.getByText("KRs activos 2")).toBeInTheDocument();
    expect(screen.getByText("Iniciativas en progreso 3")).toBeInTheDocument();
    expect(screen.getByText("Descripción meta")).toBeInTheDocument();
    expect(screen.getByText("Cupos")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /KR uno/ }));
    expect(await screen.findByText("Iniciativa uno")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Meta A/ }));
    await user.click(screen.getByRole("button", { name: /Meta A/ }));
    expect(screen.getByRole("button", { name: /Meta A/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles with the keyboard but ignores other keys", async () => {
    const user = userEvent.setup();
    render(<Harness onManage={vi.fn()} />);

    const metaA = screen.getByRole("button", { name: /Meta A/ });
    metaA.focus();
    await user.keyboard("a");
    expect(metaA).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{Enter}");
    expect(metaA).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(metaA).toHaveAttribute("aria-expanded", "false");
  });

  it("leaf nodes are not toggleable and ignore key presses and clicks", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<HierarchyDetailTree root={root} expanded={new Set()} onToggle={onToggle} onManage={vi.fn()} />);

    await user.click(screen.getByText("Meta B"));
    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Meta B/ })).not.toBeInTheDocument();
    // Fires the keydown handler of a leaf without effect
    const leaf = screen.getByText("Meta B").closest("div[class*='hierarchy-detail-node']") as HTMLElement;
    leaf.focus();
    await user.keyboard("{Enter}");
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("manages a node without toggling it", async () => {
    const user = userEvent.setup();
    const onManage = vi.fn();
    const onToggle = vi.fn();
    render(<HierarchyDetailTree root={root} expanded={new Set()} onToggle={onToggle} onManage={onManage} />);

    const metaA = screen.getByRole("button", { name: /Meta A/ });
    await user.click(within(metaA).getByRole("button", { name: "Gestionar" }));
    expect(onManage).toHaveBeenCalledWith(root.children[0]);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("starts expanded when the key is in the expanded set", () => {
    const key = getTreeNodeKey(root.children[0], getTreeNodeKey(root));
    render(<HierarchyDetailTree root={root} expanded={new Set([key])} onToggle={vi.fn()} onManage={vi.fn()} />);
    expect(screen.getByText("KR uno")).toBeInTheDocument();
  });

  it("offers a create action only when both callback and label are given", async () => {
    const user = userEvent.setup();
    const onCreateChild = vi.fn();
    const { unmount } = render(<Harness onManage={vi.fn()} onCreateChild={onCreateChild} createChildLabel="Nueva Meta" />);
    await user.click(screen.getByRole("button", { name: /Nueva Meta/ }));
    expect(onCreateChild).toHaveBeenCalled();
    unmount();

    render(<Harness onManage={vi.fn()} onCreateChild={onCreateChild} />);
    expect(screen.queryByRole("button", { name: /Nueva/ })).not.toBeInTheDocument();
  });

  it("shows an empty message when the root has no children", () => {
    render(<HierarchyDetailTree root={{ ...root, children: [] }} expanded={new Set()} onToggle={vi.fn()} onManage={vi.fn()} />);
    expect(screen.getByText(/todavia no tiene KRs o iniciativas/)).toBeInTheDocument();
    expect(screen.getByText("0 elementos directos")).toBeInTheDocument();
  });

  it("tolerates a root with undefined children", () => {
    render(<HierarchyDetailTree root={{ ...root, children: undefined as unknown as Node[] }} expanded={new Set()} onToggle={vi.fn()} onManage={vi.fn()} />);
    expect(screen.getByText(/todavia no tiene/)).toBeInTheDocument();
  });
});
