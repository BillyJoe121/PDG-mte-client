import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";
import { CreateProjectModal } from "./CreateProjectModal";

const keyResults = [
  { id: 11, name: "Cobertura", description: "", metric: "Porcentaje", goals: [], strategicBets: [] },
  { id: 12, name: "Retencion", description: "", metric: "Tasa", goals: [], strategicBets: [] },
] as unknown as KeyResult[];

describe("CreateProjectModal key result links", () => {
  it("changes the weight of one selected key result without touching the other", async () => {
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
    const [first, second] = screen.getAllByRole("spinbutton");
    fireEvent.change(second, { target: { value: "60" } });

    expect(first).toHaveValue(30);
    expect(second).toHaveValue(60);
  });
});
