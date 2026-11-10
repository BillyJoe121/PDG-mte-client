import { render, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTourTarget } from "./useTourTarget";

describe("useTourTarget", () => {
  it("prepares the screen with the step clicks, skipping missing optional ones and pressed toggles", async () => {
    const showTable = vi.fn();
    const showCards = vi.fn();
    render(
      <div>
        <button type="button" data-tour="view-cards" aria-pressed="true" onClick={showCards}>Tarjetas</button>
        <button type="button" data-tour="view-table" aria-pressed="false" onClick={showTable}>Tabla</button>
      </div>,
    );

    const { result } = renderHook(() => useTourTarget(undefined, true, ["?jerarquia-back", "view-cards", "view-table"]));

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(showCards).not.toHaveBeenCalled();
    expect(showTable).toHaveBeenCalledTimes(1);
    expect(result.current.rect).toBeNull();
  });

  it("does nothing while disabled", () => {
    const click = vi.fn();
    render(<button type="button" data-tour="view-table" onClick={click}>Tabla</button>);
    const { result } = renderHook(() => useTourTarget(undefined, false, ["view-table"]));
    expect(result.current.ready).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });
});
