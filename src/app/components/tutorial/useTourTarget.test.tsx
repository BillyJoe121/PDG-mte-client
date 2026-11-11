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

  it("stops waiting for a missing required click when the step target is already on screen", async () => {
    const after = vi.fn();
    const { container } = render(
      <div>
        <section data-tour="kr-form-period">Periodo</section>
        <button type="button" data-tour="after" onClick={after}>Después</button>
      </div>,
    );
    const target = container.querySelector("[data-tour='kr-form-period']") as HTMLElement;
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ top: 10, left: 10, width: 200, height: 40, right: 210, bottom: 50, x: 10, y: 10, toJSON: () => ({}) });

    renderHook(() => useTourTarget("kr-form-period", true, ["kr-edit", "after"]));

    // Well under the 1.5 s a required click would otherwise wait for its element.
    await waitFor(() => expect(after).toHaveBeenCalledTimes(1), { timeout: 600 });
  });

  it("keeps a view that already shows the target instead of closing and reopening it", async () => {
    const back = vi.fn();
    const { container } = render(
      <div>
        <button type="button" data-tour="jerarquia-back" onClick={back}>Volver</button>
        <section data-tour="jerarquia-tree">Árbol</section>
      </div>,
    );
    const target = container.querySelector("[data-tour='jerarquia-tree']") as HTMLElement;
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ top: 10, left: 10, width: 200, height: 40, right: 210, bottom: 50, x: 10, y: 10, toJSON: () => ({}) });

    const { result } = renderHook(() => useTourTarget("jerarquia-tree", true, ["?jerarquia-back", "jerarquia-card"], true));

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(back).not.toHaveBeenCalled();
    expect(result.current.rect).toEqual({ top: 10, left: 10, width: 200, height: 40 });
  });

  it("does nothing while disabled", () => {
    const click = vi.fn();
    render(<button type="button" data-tour="view-table" onClick={click}>Tabla</button>);
    const { result } = renderHook(() => useTourTarget(undefined, false, ["view-table"]));
    expect(result.current.ready).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });
});
