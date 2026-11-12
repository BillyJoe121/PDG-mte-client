import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KeyResultProgressRecord } from "../../services/strategicApi";

const mocks = vi.hoisted(() => ({ progressRecords: vi.fn() }));

vi.mock("../../services/strategicApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/strategicApi")>();
  return { ...actual, keyResultsApi: { ...actual.keyResultsApi, progressRecords: mocks.progressRecords } };
});

import { KeyResultProgressHistory } from "./KeyResultProgressHistory";

describe("KeyResultProgressHistory after leaving the screen", () => {
  beforeEach(() => { mocks.progressRecords.mockReset(); });

  it("ignores records that arrive after unmounting", async () => {
    let finish: (value: KeyResultProgressRecord[]) => void = () => undefined;
    mocks.progressRecords.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { unmount, container } = render(<KeyResultProgressHistory keyResultId={5} />);
    unmount();
    finish([]);
    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
  });

  it("ignores a failure that arrives after unmounting", async () => {
    let fail: (reason: unknown) => void = () => undefined;
    mocks.progressRecords.mockReturnValue(new Promise((_, reject) => { fail = reject; }));
    const { unmount } = render(<KeyResultProgressHistory keyResultId={5} />);
    unmount();
    fail(new Error("tarde"));
    await Promise.resolve();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("drops the answer of a previous KR when another one is shown", async () => {
    let finishFirst: (value: KeyResultProgressRecord[]) => void = () => undefined;
    mocks.progressRecords
      .mockReturnValueOnce(new Promise((resolve) => { finishFirst = resolve; }))
      .mockResolvedValueOnce([]);
    const { rerender } = render(<KeyResultProgressHistory keyResultId={5} />);
    rerender(<KeyResultProgressHistory keyResultId={6} />);
    finishFirst([{ id: 1, keyResultId: 5, currentValue: 1, progressPercentage: 1, recordedAt: "2026-11-02T15:30:00Z" } as KeyResultProgressRecord]);

    expect(await screen.findByText("Sin registros de avance")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
