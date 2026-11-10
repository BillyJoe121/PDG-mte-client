import { useEffect, useSyncExternalStore } from "react";

/**
 * Pages that need the full width (such as the hierarchy table) ask the sidebar to shrink while
 * they are shown. The sidebar keeps the person's own choice and goes back to it afterwards.
 */
let requests = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isCompactRequested() {
  return requests > 0;
}

/** True while some page on screen asks for a compact sidebar. */
export function useSidebarCompactRequested() {
  return useSyncExternalStore(subscribe, isCompactRequested, isCompactRequested);
}

/** Keeps the sidebar compact while `active` is true and the calling component is mounted. */
export function useCompactSidebar(active: boolean) {
  useEffect(() => {
    if (!active) return;
    requests += 1;
    notify();
    return () => {
      requests -= 1;
      notify();
    };
  }, [active]);
}
