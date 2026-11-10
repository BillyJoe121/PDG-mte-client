import { useEffect, useState } from "react";
import type { Rect } from "./tourPlacement";

const POLL_MS = 100;
/** Pages load their data first; after this the step is shown centered. */
const WAIT_MS = 2500;
/** How long a required click waits for its element to appear. */
const CLICK_WAIT_MS = 1500;
/** Time for the page to react to a click before the next one. */
const SETTLE_MS = 120;
/** Frames the target must keep the same box before the card is shown (menus animate their width). */
const STABLE_FRAMES = 3;

export interface TourTargetState {
  /** Searching for the target is over, found or not. */
  ready: boolean;
  rect: Rect | null;
}

const selectorFor = (target: string) => `[data-tour="${target}"]`;

function visibleRect(element: Element): Rect | null {
  const box = element.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return null;
  return { top: box.top, left: box.left, width: box.width, height: box.height };
}

function sameRect(a: Rect | null, b: Rect | null) {
  if (!a || !b) return a === b;
  return Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * Prepares the screen for a step by clicking the given `data-tour` elements in order (switching a
 * view, opening a detail). A leading "?" clicks only if the element is already there.
 */
async function runClicks(clicks: string[], cancelled: () => boolean) {
  for (const entry of clicks) {
    const optional = entry.startsWith("?");
    const selector = selectorFor(optional ? entry.slice(1) : entry);
    const startedAt = Date.now();
    let element = document.querySelector<HTMLElement>(selector);
    while (!element && !optional && Date.now() - startedAt < CLICK_WAIT_MS) {
      await wait(POLL_MS);
      if (cancelled()) return;
      element = document.querySelector<HTMLElement>(selector);
    }
    if (cancelled()) return;
    if (!element) continue;
    if (element.getAttribute("aria-pressed") !== "true") element.click();
    await wait(SETTLE_MS);
    if (cancelled()) return;
  }
}

/**
 * Finds the element marked `data-tour={target}` once the page is ready, brings it into view and
 * keeps following its box while the layout moves (scroll, resize, menus that expand or collapse).
 */
export function useTourTarget(target: string | undefined, enabled: boolean, clicks: readonly string[] = []): TourTargetState {
  const [state, setState] = useState<TourTargetState>({ ready: false, rect: null });
  const clickKey = clicks.join("|");

  useEffect(() => {
    if (!enabled) {
      setState({ ready: false, rect: null });
      return;
    }

    let stopped = false;
    let frame = 0;
    let poll = 0;
    const cancelled = () => stopped;
    setState({ ready: false, rect: null });

    const track = (selector: string, first: Element) => {
      let element: Element = first;
      let last: Rect | null = null;
      let stableFrames = 0;
      let shown = false;
      const tick = () => {
        if (stopped) return;
        if (!element.isConnected) element = document.querySelector(selector) ?? element;
        const rect = element.isConnected ? visibleRect(element) : null;
        if (sameRect(rect, last)) stableFrames += 1;
        else stableFrames = 0;
        if (!shown && stableFrames >= STABLE_FRAMES) {
          shown = true;
          setState({ ready: true, rect });
        } else if (shown && stableFrames === 0) {
          setState({ ready: true, rect });
        }
        last = rect;
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const start = async () => {
      await runClicks(clickKey ? clickKey.split("|") : [], cancelled);
      if (stopped) return;
      if (!target) {
        setState({ ready: true, rect: null });
        return;
      }
      const selector = selectorFor(target);
      const startedAt = Date.now();
      const find = () => {
        if (stopped) return;
        const found = document.querySelector(selector);
        if (found && visibleRect(found)) {
          found.scrollIntoView?.({ block: "nearest", inline: "nearest" });
          track(selector, found);
          return;
        }
        if (Date.now() - startedAt >= WAIT_MS) {
          setState({ ready: true, rect: null });
          return;
        }
        poll = window.setTimeout(find, POLL_MS);
      };
      find();
    };
    void start();

    return () => {
      stopped = true;
      window.clearTimeout(poll);
      cancelAnimationFrame(frame);
    };
  }, [target, enabled, clickKey]);

  return state;
}
