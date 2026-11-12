import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { KeyResult } from "../../services/strategicApi";
import { KeyResultCard } from "./KeyResultCard";

function item(extra: Partial<KeyResult> = {}): KeyResult {
  return {
    id: 3,
    name: "Aumentar la retención",
    description: "Retener más estudiantes.",
    status: "ACTIVO",
    progressPercentage: 40,
    academicPeriodName: "2026-1",
    goals: [],
    strategicBets: [],
    ...extra,
  } as KeyResult;
}

function setup(props: Partial<Parameters<typeof KeyResultCard>[0]> = {}) {
  const onOpen = vi.fn();
  const onRestore = vi.fn();
  render(<KeyResultCard item={item()} index={0} canRestore={false} restoring={false} onOpen={onOpen} onRestore={onRestore} {...props} />);
  return { onOpen, onRestore };
}

describe("KeyResultCard", () => {
  it("shows code, period, status, progress, title and description", () => {
    setup();
    expect(screen.getByText("KR-03")).toBeInTheDocument();
    expect(screen.getByText("2026-1")).toBeInTheDocument();
    expect(screen.getByLabelText("Avance registrado 40%")).toHaveTextContent("40%");
    expect(screen.getByRole("heading", { name: "Aumentar la retención" })).toBeInTheDocument();
    expect(screen.getByText("Retener más estudiantes.")).toBeInTheDocument();
    expect(screen.queryByText("Archivado")).not.toBeInTheDocument();
  });

  it("falls back to a placeholder when the KR has no period", () => {
    setup({ item: item({ academicPeriodName: undefined }) });
    expect(screen.getByText("Sin periodo")).toBeInTheDocument();
  });

  it("opens by click and by Enter or Space but not other keys", async () => {
    const user = userEvent.setup();
    const { onOpen } = setup();
    const card = screen.getByRole("button", { name: /KR-03/ });

    await user.click(card);
    expect(onOpen).toHaveBeenCalledTimes(1);
    card.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onOpen).toHaveBeenCalledTimes(3);
    await user.keyboard("a");
    expect(onOpen).toHaveBeenCalledTimes(3);
  });

  it("marks archived KRs and lets managers restore them", async () => {
    const user = userEvent.setup();
    const { onRestore } = setup({ item: item({ archived: true }), canRestore: true });
    expect(screen.getByText("Archivado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restaurar Aumentar la retención" }));
    expect(onRestore).toHaveBeenCalled();
  });

  it("disables restore while restoring", () => {
    setup({ item: item({ archived: true }), canRestore: true, restoring: true });
    expect(screen.getByRole("button", { name: "Restaurar Aumentar la retención" })).toBeDisabled();
  });

  it("does not offer restore to people who cannot restore or on active KRs", () => {
    const { unmount } = render(<KeyResultCard item={item({ archived: true })} index={1} canRestore={false} restoring={false} onOpen={vi.fn()} onRestore={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Restaurar/ })).not.toBeInTheDocument();
    unmount();
    setup({ canRestore: true });
    expect(screen.queryByRole("button", { name: /Restaurar/ })).not.toBeInTheDocument();
  });
});
