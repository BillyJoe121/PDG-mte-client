import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => true };
});

import { KeyResultCard } from "./KeyResultCard";

describe("KeyResultCard with reduced motion", () => {
  it("renders the card and opens it without animating", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const item = { id: 3, name: "Aumentar la retención", description: "Retener más.", status: "ACTIVO", progressPercentage: 40, goals: [], strategicBets: [] } as unknown as KeyResult;
    render(<KeyResultCard item={item} index={1} canRestore={false} restoring={false} onOpen={onOpen} onRestore={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Aumentar la retención" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Aumentar la retención/ }));
    expect(onOpen).toHaveBeenCalled();
  });
});
