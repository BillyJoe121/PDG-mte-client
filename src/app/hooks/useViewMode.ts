import { useCallback, useState } from "react";

export type ViewMode = "cards" | "table";

function readViewMode(storageKey: string): ViewMode {
  try {
    return localStorage.getItem(storageKey) === "table" ? "table" : "cards";
  } catch {
    return "cards";
  }
}

/** Remembers in this browser how a screen is displayed; cards is the default. */
export function useViewMode(storageKey: string) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => readViewMode(storageKey));

  const setViewMode = useCallback(
    (next: ViewMode) => {
      setViewModeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Without storage the choice still applies until the screen is left.
      }
    },
    [storageKey],
  );

  return [viewMode, setViewMode] as const;
}
