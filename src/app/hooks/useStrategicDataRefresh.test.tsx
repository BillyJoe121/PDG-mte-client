import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signalStrategicDataChanged } from "../utils/strategicDataRefresh";
import { useStrategicDataRefresh } from "./useStrategicDataRefresh";

describe("useStrategicDataRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("refreshes when a change in a watched scope is signalled", () => {
    const onRefresh = vi.fn();
    renderHook(() => useStrategicDataRefresh({ onRefresh, scopes: ["keyResults"] }));

    act(() => signalStrategicDataChanged({ reason: "kr", scopes: ["keyResults"] }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("ignores changes in other scopes", () => {
    const onRefresh = vi.fn();
    renderHook(() => useStrategicDataRefresh({ onRefresh, scopes: ["keyResults"] }));

    act(() => signalStrategicDataChanged({ reason: "p", scopes: ["projects"] }));
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("throttles bursts of signals using minDelayMs", () => {
    const onRefresh = vi.fn();
    renderHook(() => useStrategicDataRefresh({ onRefresh, scopes: ["keyResults"], minDelayMs: 1000 }));

    act(() => signalStrategicDataChanged({ reason: "a", scopes: ["keyResults"] }));
    act(() => signalStrategicDataChanged({ reason: "b", scopes: ["keyResults"] }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1100);
      signalStrategicDataChanged({ reason: "c", scopes: ["keyResults"] });
    });
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it("refreshes on window focus and when the tab becomes visible", () => {
    const onRefresh = vi.fn();
    renderHook(() => useStrategicDataRefresh({ onRefresh, scopes: ["hierarchy"], minDelayMs: 0 }));

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(10);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(onRefresh).toHaveBeenCalledTimes(2);

    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      vi.advanceTimersByTime(10);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(onRefresh).toHaveBeenCalledTimes(2);
    hidden.mockRestore();
  });

  it("polls on the interval only while the document is visible", () => {
    const onRefresh = vi.fn();
    renderHook(() => useStrategicDataRefresh({ onRefresh, scopes: ["hierarchy"], intervalMs: 5000, minDelayMs: 0 }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);

    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
    hidden.mockRestore();
  });

  it("does not poll when the interval is disabled", () => {
    const onRefresh = vi.fn();
    renderHook(() => useStrategicDataRefresh({ onRefresh, scopes: ["hierarchy"], intervalMs: 0 }));
    act(() => {
      vi.advanceTimersByTime(120000);
    });
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("does nothing while disabled and stops listening on unmount", () => {
    const onRefresh = vi.fn();
    const disabled = renderHook(() => useStrategicDataRefresh({ onRefresh, scopes: ["keyResults"], enabled: false }));
    act(() => signalStrategicDataChanged({ reason: "x", scopes: ["keyResults"] }));
    expect(onRefresh).not.toHaveBeenCalled();
    disabled.unmount();

    const active = renderHook(() => useStrategicDataRefresh({ onRefresh, scopes: ["keyResults"] }));
    active.unmount();
    act(() => signalStrategicDataChanged({ reason: "y", scopes: ["keyResults"] }));
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("calls the latest onRefresh callback", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ cb }) => useStrategicDataRefresh({ onRefresh: cb, scopes: ["keyResults"] }),
      { initialProps: { cb: first } },
    );
    rerender({ cb: second });
    act(() => signalStrategicDataChanged({ reason: "z", scopes: ["keyResults"] }));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
