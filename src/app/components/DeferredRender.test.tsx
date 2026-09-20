import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeferredRender } from "./DeferredRender";

describe("DeferredRender", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders immediately when IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<DeferredRender><span>Contenido costoso</span></DeferredRender>);
    expect(screen.getByText("Contenido costoso")).toBeInTheDocument();
  });

  it("reserves space and renders when the viewport approaches", () => {
    let callback: IntersectionObserverCallback | undefined;
    const disconnect = vi.fn();
    const observe = vi.fn();
    class ObserverMock {
      constructor(next: IntersectionObserverCallback) { callback = next; }
      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = "320px 0px";
      thresholds = [0];
    }
    vi.stubGlobal("IntersectionObserver", ObserverMock);

    render(<DeferredRender minHeight={360}><span>Contenido costoso</span></DeferredRender>);
    const placeholder = screen.getByRole("status", { name: "Preparando visualización" });
    expect(placeholder.parentElement).toHaveStyle({ minHeight: "360px" });
    expect(screen.queryByText("Contenido costoso")).not.toBeInTheDocument();

    act(() => callback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(screen.getByText("Contenido costoso")).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalled();
  });
});
