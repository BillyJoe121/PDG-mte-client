import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: { id: "7" } as { id: string } | null,
  completed: false,
  markCompleted: vi.fn(),
}));

vi.mock("../../context/AuthContext", () => ({ useAuth: () => ({ usuario: mocks.user }) }));
vi.mock("./tutorialStorage", () => ({
  hasCompletedTutorial: () => mocks.completed,
  markTutorialCompleted: mocks.markCompleted,
}));
vi.mock("../PlatformTutorial", () => ({
  PlatformTutorial: ({ open, mandatory, onClose }: { open: boolean; mandatory?: boolean; onClose: (finished: boolean) => void }) => (
    <div data-testid="tour" data-open={String(open)} data-mandatory={String(Boolean(mandatory))}>
      <button type="button" onClick={() => onClose(true)}>finish</button>
      <button type="button" onClick={() => onClose(false)}>dismiss</button>
    </div>
  ),
}));

import { TutorialHost } from "./TutorialHost";

function renderHost() {
  return render(
    <MemoryRouter>
      <Routes><Route element={<TutorialHost />}><Route index element={<p>page</p>} /></Route></Routes>
    </MemoryRouter>,
  );
}

describe("TutorialHost", () => {
  beforeEach(() => {
    mocks.user = { id: "7" };
    mocks.completed = false;
    mocks.markCompleted.mockClear();
  });

  it("opens a mandatory tour on the first visit and records completion on finish", () => {
    renderHost();
    expect(screen.getByTestId("tour")).toHaveAttribute("data-mandatory", "true");
    fireEvent.click(screen.getByText("finish"));
    expect(mocks.markCompleted).toHaveBeenCalledWith("7");
    expect(screen.getByTestId("tour")).toHaveAttribute("data-open", "false");
  });

  it("does not record completion when the tour is dismissed", () => {
    renderHost();
    fireEvent.click(screen.getByText("dismiss"));
    expect(mocks.markCompleted).not.toHaveBeenCalled();
  });

  it("stays closed for a user who already completed it", () => {
    mocks.completed = true;
    renderHost();
    expect(screen.getByTestId("tour")).toHaveAttribute("data-open", "false");
  });

  it("renders no tour without a signed-in user", () => {
    mocks.user = null;
    renderHost();
    expect(screen.getByText("page")).toBeInTheDocument();
    expect(screen.queryByTestId("tour")).not.toBeInTheDocument();
  });
});
