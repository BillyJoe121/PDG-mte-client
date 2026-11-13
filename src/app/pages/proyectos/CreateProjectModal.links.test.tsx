import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";
import { CreateProjectModal } from "./CreateProjectModal";

const keyResults = [
  { id: 11, name: "Cobertura", description: "", metric: "Porcentaje", goals: [], strategicBets: [] },
  { id: 12, name: "Retencion", description: "", metric: "Tasa", goals: [], strategicBets: [] },
] as unknown as KeyResult[];

describe("CreateProjectModal key result links", () => {
  it("selects several key results without asking for a weight", async () => {
    const user = userEvent.setup();
    render(
      <CreateProjectModal
        departments={[{ id: 1, name: "Sistemas" }] as never}
        periods={[{ id: 1, name: "2026-1" }] as never}
        keyResults={keyResults}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar KR 11" }));
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar KR 12" }));
    expect(screen.getByRole("checkbox", { name: "Seleccionar KR 11" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("checkbox", { name: "Seleccionar KR 12" })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });
});
