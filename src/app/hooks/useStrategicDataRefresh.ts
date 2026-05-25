import { useEffect, useMemo, useRef } from "react";
import {
  intersectsStrategicScopes,
  listenStrategicDataChanges,
  type StrategicDataScope,
} from "../utils/strategicDataRefresh";

interface UseStrategicDataRefreshOptions {
  enabled?: boolean;
  intervalMs?: number;
  minDelayMs?: number;
  onRefresh: () => Promise<void> | void;
  scopes: StrategicDataScope[];
}

export function useStrategicDataRefresh({
  enabled = true,
  intervalMs = 60000,
  minDelayMs = 800,
  onRefresh,
  scopes,
}: UseStrategicDataRefreshOptions) {
  const onRefreshRef = useRef(onRefresh);
  const lastRefreshRef = useRef(0);
  const scopeKey = useMemo(() => scopes.join("|"), [scopes]);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    const runRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < minDelayMs) return;
      lastRefreshRef.current = now;
      void onRefreshRef.current();
    };

    const stopListening = listenStrategicDataChanges((change) => {
      if (intersectsStrategicScopes(scopes, change.scopes)) {
        runRefresh();
      }
    });

    const handleFocus = () => runRefresh();
    const handleVisibility = () => {
      if (!document.hidden) runRefresh();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    const interval = intervalMs > 0
      ? window.setInterval(() => {
        if (!document.hidden) runRefresh();
      }, intervalMs)
      : undefined;

    return () => {
      stopListening();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (interval) window.clearInterval(interval);
    };
  }, [enabled, intervalMs, minDelayMs, scopeKey]);
}
