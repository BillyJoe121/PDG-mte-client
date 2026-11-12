// Main screens reached from the sidebar. Their code downloads while the browser is idle after
// sign-in, so the first visit to each one does not wait for its chunk. Charts stay deferred:
// they load from inside the screens, not from these modules.
const screenLoaders: ReadonlyArray<() => Promise<unknown>> = [
  () => import("./pages/Dashboard"),
  () => import("./pages/JerarquiaEstrategica"),
  () => import("./pages/Proyectos"),
  () => import("./pages/KRs"),
  () => import("./pages/Consistencia"),
];

type IdleScheduler = (callback: () => void) => void;

interface PrefetchEnvironment {
  loaders?: ReadonlyArray<() => Promise<unknown>>;
  scheduleIdle?: IdleScheduler;
  saveData?: boolean;
}

let started = false;

function defaultScheduleIdle(callback: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout: 4000 });
  } else {
    window.setTimeout(callback, 1500);
  }
}

function prefersSavingData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/** Starts downloading the main screens once per page load; failures are ignored because navigation retries them. */
export function prefetchScreens(environment: PrefetchEnvironment = {}) {
  if (started) return;
  if (environment.saveData ?? prefersSavingData()) return;
  started = true;
  const loaders = environment.loaders ?? screenLoaders;
  const scheduleIdle = environment.scheduleIdle ?? defaultScheduleIdle;
  scheduleIdle(() => {
    void Promise.allSettled(loaders.map((load) => load()));
  });
}

export function resetScreenPrefetchForTests() {
  started = false;
}
