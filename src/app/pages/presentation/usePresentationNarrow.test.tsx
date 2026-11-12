import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePresentationNarrow } from "./usePresentationNarrow";

type Listener = () => void;

function stubMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const query = {
    matches: initial,
    addEventListener: vi.fn((_: string, fn: Listener) => listeners.add(fn)),
    removeEventListener: vi.fn((_: string, fn: Listener) => listeners.delete(fn)),
  };
  window.matchMedia = vi.fn(() => query) as unknown as typeof window.matchMedia;
  return { query, listeners };
}

describe("usePresentationNarrow", () => {
  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it("is false when the browser cannot match media queries", () => {
    const { result } = renderHook(() => usePresentationNarrow());
    expect(result.current).toBe(false);
  });

  it("follows the narrow breakpoint and stops listening on unmount", () => {
    const { query, listeners } = stubMatchMedia(true);
    const { result, unmount } = renderHook(() => usePresentationNarrow());
    expect(result.current).toBe(true);

    query.matches = false;
    act(() => listeners.forEach((fn) => fn()));
    expect(result.current).toBe(false);

    unmount();
    expect(query.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    expect(listeners.size).toBe(0);
  });
});
