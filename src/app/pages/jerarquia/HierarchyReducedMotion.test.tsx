import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { StrategicHierarchyNode } from "../../services/strategicApi";

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => true };
});

import { HierarchyDetailTree } from "./HierarchyDetailTree";
import { HierarchyRootGallery } from "./HierarchyRootViews";

type Node = StrategicHierarchyNode;

const root: Node = {
  nodeType: "STRATEGIC_BET",
  id: "1",
  label: "Apuesta",
  children: [
    { nodeType: "GOAL", id: "2", label: "Meta A", children: [{ nodeType: "KEY_RESULT", id: "3", label: "KR uno", children: [] }] },
    { nodeType: "GOAL", id: "5", label: "Meta B", children: [] },
  ],
};

function Harness() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExpanded((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  return <HierarchyDetailTree root={root} expanded={expanded} onToggle={toggle} onManage={vi.fn()} />;
}

describe("hierarchy views with reduced motion", () => {
  it("expands and collapses tree nodes without animating", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /Meta A/ }));
    expect(screen.getByText("KR uno")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Meta A/ }));
    expect(screen.queryByText("KR uno")).not.toBeInTheDocument();
  });

  it("lists the root cards and selects one", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<HierarchyRootGallery nodes={[root]} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /Apuesta/ }));
    expect(onSelect).toHaveBeenCalledWith(root);
  });
});
