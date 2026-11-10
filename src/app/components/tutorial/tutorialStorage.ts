const KEY_PREFIX = "mte.tutorial.completed.";

/** Kept in memory too, so a browser that blocks storage does not repeat the tour within the session. */
const completedInSession = new Set<string>();

export function tutorialStorageKey(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

/** Whether this user finished the guided tour in this browser. */
export function hasCompletedTutorial(userId: string): boolean {
  if (completedInSession.has(userId)) return true;
  try {
    return window.localStorage.getItem(tutorialStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markTutorialCompleted(userId: string) {
  completedInSession.add(userId);
  try {
    window.localStorage.setItem(tutorialStorageKey(userId), "1");
  } catch {
    // Storage blocked: the in-memory record covers this session.
  }
}

/** Test helper. */
export function resetTutorialSessionState() {
  completedInSession.clear();
}
