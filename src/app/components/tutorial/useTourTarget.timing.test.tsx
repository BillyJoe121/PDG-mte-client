import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTourTarget } from "./useTourTarget";

function addTarget(name: string, box = { top: 10, left: 20, width: 100, height: 40 }) {
  const element = document.createElement("div");
  element.setAttribute("data-tour", name);
  element.getBoundingClientRect = () => ({ ...box, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  document.body.appendChild(element);
  return { element, box };
}

const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

describe("useTourTarget timing", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("gives up and reports no box when the target never appears", async () => {
    const { result } = renderHook(() => useTourTarget("missing", true));
    expect(result.current).toEqual({ ready: false, rect: null });
    await advance(2700);
    expect(result.current).toEqual({ ready: true, rect: null });
  });

  it("is ready at once without a target", async () => {
    const { result } = renderHook(() => useTourTarget(undefined, true));
    await advance(10);
    expect(result.current).toEqual({ ready: true, rect: null });
  });

  it("resets when disabled", async () => {
    addTarget("here");
    const { result, rerender } = renderHook(({ on }) => useTourTarget("here", on), { initialProps: { on: true } });
    await advance(500);
    expect(result.current.ready).toBe(true);
    rerender({ on: false });
    expect(result.current).toEqual({ ready: false, rect: null });
  });

  it("waits for a box that appears late, then follows it when it moves", async () => {
    const { element } = addTarget("late", { top: 0, left: 0, width: 0, height: 0 });
    const box = { top: 10, left: 20, width: 100, height: 40 };
    const { result } = renderHook(() => useTourTarget("late", true));
    await advance(300);
    expect(result.current.ready).toBe(false);

    let current = { ...box };
    element.getBoundingClientRect = () => ({ ...current }) as DOMRect;
    await advance(600);
    expect(result.current.rect).toMatchObject(box);

    current = { ...box, top: 200 };
    await advance(100);
    expect(result.current.rect?.top).toBe(200);
  });

  it("re-finds the element when it is replaced in the document", async () => {
    const first = addTarget("swap");
    const { result } = renderHook(() => useTourTarget("swap", true));
    await advance(500);
    expect(result.current.rect).toMatchObject(first.box);

    first.element.remove();
    addTarget("swap", { top: 50, left: 60, width: 70, height: 80 });
    await advance(200);
    expect(result.current.rect).toMatchObject({ top: 50, left: 60 });
  });

  it("clicks required elements in order, skips an absent optional one and ignores a pressed one", async () => {
    const order: string[] = [];
    const a = addTarget("a");
    a.element.addEventListener("click", () => order.push("a"));
    const pressed = addTarget("pressed");
    pressed.element.setAttribute("aria-pressed", "true");
    pressed.element.addEventListener("click", () => order.push("pressed"));
    addTarget("goal");

    renderHook(() => useTourTarget("goal", true, ["?absent", "a", "pressed"]));
    await advance(1000);

    expect(order).toEqual(["a"]);
  });

  it("stops waiting for a required click once the target is already visible", async () => {
    addTarget("goal");
    const { result } = renderHook(() => useTourTarget("goal", true, ["never-there"]));
    await advance(600);
    expect(result.current.ready).toBe(true);
  });

  it("waits for a required click element up to its limit before moving on", async () => {
    const { result } = renderHook(() => useTourTarget("nothing", true, ["never-there"]));
    await advance(1700);
    expect(result.current.ready).toBe(false);
    await advance(2700);
    expect(result.current.ready).toBe(true);
  });

  it("keeps the shown target instead of clicking again when asked to", async () => {
    const clicked = vi.fn();
    const a = addTarget("a");
    a.element.addEventListener("click", clicked);
    addTarget("goal");
    renderHook(() => useTourTarget("goal", true, ["a"], true));
    await advance(500);
    expect(clicked).not.toHaveBeenCalled();
  });

  it("stops cleanly when unmounted during the click phase", async () => {
    const a = addTarget("a");
    const clicked = vi.fn();
    a.element.addEventListener("click", clicked);
    const { unmount } = renderHook(() => useTourTarget("goal", true, ["a", "b"]));
    await advance(10);
    unmount();
    await advance(3000);
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it("stops waiting for a click element when unmounted while polling", async () => {
    const { unmount } = renderHook(() => useTourTarget("goal", true, ["late-one"]));
    await advance(250);
    unmount();
    await advance(3000);
  });
});
