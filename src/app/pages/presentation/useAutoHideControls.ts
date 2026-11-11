import { useCallback, useEffect, useRef, useState } from "react";
import { isGuidedTourOpen } from "../../components/tutorial/guidedTour";

export const CONTROLS_HIDE_DELAY_MS = 1000;

/** Marks every floating control of the stage: header, bottom bar and their menus. */
export const CONTROLS_SELECTOR = "[data-presentation-controls]";

function focusIsVisible(element: Element) {
  try {
    return element.matches(":focus-visible");
  } catch {
    // Engines without :focus-visible: any focus inside the controls counts.
    return true;
  }
}

/**
 * The controls stay on screen while someone is using them: keyboard focus inside
 * them, one of their menus open, or the guided tour pointing at them.
 */
export function controlsInUse(doc: Document = document) {
  const active = doc.activeElement;
  if (active && active !== doc.body && active.closest(CONTROLS_SELECTOR) && focusIsVisible(active)) return true;
  if (doc.querySelector(`${CONTROLS_SELECTOR} [aria-expanded="true"]`)) return true;
  return isGuidedTourOpen(doc);
}

interface Options {
  /** Only the Presentar view hides its controls. */
  enabled: boolean;
  delayMs?: number;
  keepVisible?: () => boolean;
}

/** Shows the controls on pointer activity or keyboard focus and hides them after a pause. */
export function useAutoHideControls({ enabled, delayMs = CONTROLS_HIDE_DELAY_MS, keepVisible = controlsInUse }: Options) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const keepVisibleRef = useRef(keepVisible);
  keepVisibleRef.current = keepVisible;

  const clear = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };

  const schedule = useCallback(() => {
    clear();
    timer.current = setTimeout(function hide() {
      if (keepVisibleRef.current()) {
        timer.current = setTimeout(hide, delayMs);
        return;
      }
      timer.current = null;
      setVisible(false);
    }, delayMs);
  }, [delayMs]);

  const wake = useCallback(() => {
    setVisible(true);
    schedule();
  }, [schedule]);

  useEffect(() => {
    if (!enabled) {
      clear();
      setVisible(true);
      return;
    }

    const onPointerMove = (event: MouseEvent) => {
      const previous = lastPointer.current;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      // Some browsers repeat mousemove without movement after a slide change.
      if (previous && previous.x === event.clientX && previous.y === event.clientY) return;
      wake();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest(CONTROLS_SELECTOR)) wake();
    };

    wake();
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mousedown", wake);
    window.addEventListener("touchstart", wake, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    return () => {
      clear();
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mousedown", wake);
      window.removeEventListener("touchstart", wake);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [enabled, wake]);

  return { visible: visible || !enabled, wake };
}
