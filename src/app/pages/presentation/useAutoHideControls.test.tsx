import { act, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import { CONTROLS_HIDE_DELAY_MS, controlsInUse, useAutoHideControls } from "./useAutoHideControls";

describe("useAutoHideControls", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

  it("hides the controls after the pause and shows them again when the mouse moves", () => {
    const { result } = renderHook(() => useAutoHideControls({ enabled: true, keepVisible: () => false }));
    expect(result.current.visible).toBe(true);

    advance(CONTROLS_HIDE_DELAY_MS - 1);
    expect(result.current.visible).toBe(true);
    advance(1);
    expect(result.current.visible).toBe(false);

    act(() => void fireEvent.mouseMove(window, { clientX: 10, clientY: 20 }));
    expect(result.current.visible).toBe(true);
    advance(CONTROLS_HIDE_DELAY_MS);
    expect(result.current.visible).toBe(false);
  });

  it("ignores a mousemove repeated at the same point", () => {
    const { result } = renderHook(() => useAutoHideControls({ enabled: true, keepVisible: () => false }));
    act(() => void fireEvent.mouseMove(window, { clientX: 5, clientY: 5 }));
    advance(CONTROLS_HIDE_DELAY_MS);
    expect(result.current.visible).toBe(false);

    act(() => void fireEvent.mouseMove(window, { clientX: 5, clientY: 5 }));
    expect(result.current.visible).toBe(false);
  });

  it("wakes on a click or a touch", () => {
    const { result } = renderHook(() => useAutoHideControls({ enabled: true, keepVisible: () => false }));
    advance(CONTROLS_HIDE_DELAY_MS);
    act(() => void fireEvent.mouseDown(window));
    expect(result.current.visible).toBe(true);
    advance(CONTROLS_HIDE_DELAY_MS);
    act(() => void fireEvent.touchStart(window));
    expect(result.current.visible).toBe(true);
  });

  it("stays visible while the controls are in use", () => {
    let inUse = true;
    const { result } = renderHook(() => useAutoHideControls({ enabled: true, keepVisible: () => inUse }));
    advance(CONTROLS_HIDE_DELAY_MS * 3);
    expect(result.current.visible).toBe(true);

    inUse = false;
    advance(CONTROLS_HIDE_DELAY_MS);
    expect(result.current.visible).toBe(false);
  });

  it("shows the controls when keyboard focus enters them", () => {
    const bar = document.createElement("div");
    bar.setAttribute("data-presentation-controls", "");
    const button = document.createElement("button");
    bar.append(button);
    document.body.append(bar);

    const { result } = renderHook(() => useAutoHideControls({ enabled: true, keepVisible: () => false }));
    advance(CONTROLS_HIDE_DELAY_MS);
    expect(result.current.visible).toBe(false);

    act(() => button.focus());
    expect(result.current.visible).toBe(true);
  });

  it("always shows the controls when disabled", () => {
    const { result, rerender } = renderHook(({ enabled }) => useAutoHideControls({ enabled, keepVisible: () => false }), {
      initialProps: { enabled: true },
    });
    advance(CONTROLS_HIDE_DELAY_MS);
    expect(result.current.visible).toBe(false);

    rerender({ enabled: false });
    expect(result.current.visible).toBe(true);
    advance(CONTROLS_HIDE_DELAY_MS * 2);
    expect(result.current.visible).toBe(true);
  });
});

describe("controlsInUse", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is false with nothing going on", () => {
    expect(controlsInUse()).toBe(false);
  });

  it("is true while a menu of the controls is open", () => {
    document.body.innerHTML = '<div data-presentation-controls><button aria-expanded="true">Exportar</button></div>';
    expect(controlsInUse()).toBe(true);
  });

  it("is true while the guided tour is running", () => {
    document.body.innerHTML = "<div data-guided-tour></div>";
    expect(controlsInUse()).toBe(true);
  });
});
