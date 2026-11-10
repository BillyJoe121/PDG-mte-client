import { createContext, useContext } from "react";

/** Starts the guided tour on demand; null outside the tour host. */
export const StartTutorialContext = createContext<(() => void) | null>(null);

export function useStartTutorial() {
  return useContext(StartTutorialContext) ?? undefined;
}
