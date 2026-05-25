export type StrategicDataScope =
  | "projects"
  | "objectives"
  | "hierarchy"
  | "dashboard"
  | "reports"
  | "presentation"
  | "consistency";

export interface StrategicDataChange {
  changedAt: number;
  reason: string;
  projectId?: number;
  scopes: StrategicDataScope[];
}

const EVENT_NAME = "mte:strategic-data-changed";
const STORAGE_KEY = "mte_strategic_data_changed";

export function signalStrategicDataChanged(change: Omit<StrategicDataChange, "changedAt">) {
  if (typeof window === "undefined") return;

  const detail: StrategicDataChange = {
    ...change,
    changedAt: Date.now(),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(detail));
  } catch {
    // Local storage can be unavailable in private contexts; the in-tab event still keeps the UI fresh.
  }

  window.dispatchEvent(new CustomEvent<StrategicDataChange>(EVENT_NAME, { detail }));
}

export function listenStrategicDataChanges(listener: (change: StrategicDataChange) => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleEvent = (event: Event) => {
    listener((event as CustomEvent<StrategicDataChange>).detail);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      listener(JSON.parse(event.newValue) as StrategicDataChange);
    } catch {
      // Ignore malformed external storage events.
    }
  };

  window.addEventListener(EVENT_NAME, handleEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleEvent);
    window.removeEventListener("storage", handleStorage);
  };
}

export function intersectsStrategicScopes(left: StrategicDataScope[], right: StrategicDataScope[]) {
  return left.some((scope) => right.includes(scope));
}
